import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const CREDIBLES_V2_ABI = [
  {
    inputs: [{ name: "issuer", type: "address" }],
    name: "isVerifiedIssuer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "issuer", type: "address" }],
    name: "pendingVerifications",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issuerAddress = searchParams.get("issuer");

    if (!issuerAddress) {
      return NextResponse.json(
        { error: "Issuer address is required" },
        { status: 400 }
      );
    }

    const contractAddress = process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS as `0x${string}`;
    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address not configured" },
        { status: 500 }
      );
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.RPC_URL || "https://sepolia.base.org"),
    });

    const [isVerified, pendingDomain] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: CREDIBLES_V2_ABI,
        functionName: "isVerifiedIssuer",
        args: [issuerAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: CREDIBLES_V2_ABI,
        functionName: "pendingVerifications",
        args: [issuerAddress as `0x${string}`],
      }),
    ]);

    return NextResponse.json({
      isVerified,
      pendingDomain: pendingDomain || null,
      status: isVerified ? "verified" : pendingDomain ? "pending" : "not_verified",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

