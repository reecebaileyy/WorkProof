import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const CREDIBLES_V2_ABI = [
  {
    inputs: [{ name: "emailDomain", type: "string" }],
    name: "requestIssuerVerification",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "issuer", type: "address" }, { name: "emailDomain", type: "string" }],
    name: "verifyIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "issuer", type: "address" }],
    name: "isVerifiedIssuer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const { email, issuerAddress } = await request.json();

    if (!email || !issuerAddress) {
      return NextResponse.json(
        { error: "Email and issuer address are required" },
        { status: 400 }
      );
    }

    // Extract domain from email
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // This would typically be called from the frontend via wallet
    // The API route is mainly for validation and status checking
    return NextResponse.json({
      success: true,
      domain,
      message: "Verification request should be submitted via wallet transaction",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

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

    const isVerified = await publicClient.readContract({
      address: contractAddress,
      abi: CREDIBLES_V2_ABI,
      functionName: "isVerifiedIssuer",
      args: [issuerAddress as `0x${string}`],
    });

    return NextResponse.json({
      isVerified,
      issuerAddress,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

