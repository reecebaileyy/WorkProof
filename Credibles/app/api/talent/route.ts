import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, parseAbiItem, encodeFunctionData, decodeEventLog, getContract } from "viem";
import { baseSepolia } from "viem/chains";

// Contract ABIs
const CREDIBLES_V2_ABI = parseAbi([
  "function skillPetStats(uint256) view returns (uint256 dev, uint256 defi, uint256 gov, uint256 social)",
  "function userToSkillPet(address) view returns (uint256)",
  "function hasSkillPet(address) view returns (bool)",
  "event SkillPetMinted(address indexed user, address indexed resumeWallet, uint256 indexed tokenId)",
]);

const ATTESTATION_NFT_ABI = parseAbi([
  "event AttestationNFTMinted(address indexed recipient, address indexed issuer, uint256 indexed tokenId, string category, string title)",
]);

const PAYMENT_GATEWAY_ABI = parseAbi([
  "function payForAccess(address targetTalent)",
  "event AccessPaid(address indexed payer, address indexed student, uint256 timestamp)",
]);

// Candidate interface
interface Candidate {
  address: `0x${string}`;
  hasAttestation: boolean;
  xp: bigint;
  tokenId?: bigint;
}

// Skill category mapping
const SKILL_CATEGORIES = ["dev", "defi", "gov", "social"] as const;
type SkillCategory = (typeof SKILL_CATEGORIES)[number];

function isValidSkill(skill: string): skill is SkillCategory {
  return SKILL_CATEGORIES.includes(skill as SkillCategory);
}

/**
 * Get XP for a specific category from stats
 */
function getCategoryXP(stats: { dev: bigint; defi: bigint; gov: bigint; social: bigint }, category: SkillCategory): bigint {
  switch (category) {
    case "dev":
      return stats.dev;
    case "defi":
      return stats.defi;
    case "gov":
      return stats.gov;
    case "social":
      return stats.social;
    default:
      return 0n;
  }
}

/**
 * Discover candidates from SkillPet events
 */
async function discoverSkillPetCandidates(
  publicClient: ReturnType<typeof createPublicClient>,
  crediblesV2Address: `0x${string}`,
  category: SkillCategory
): Promise<Map<`0x${string}`, { tokenId: bigint; xp: bigint }>> {
  const candidates = new Map<`0x${string}`, { tokenId: bigint; xp: bigint }>();

  try {
    // Get SkillPetMinted events
    const logs = await publicClient.getLogs({
      address: crediblesV2Address,
      event: parseAbiItem("event SkillPetMinted(address indexed user, address indexed resumeWallet, uint256 indexed tokenId)"),
      fromBlock: "earliest",
    });

    // Extract unique resume wallet addresses
    const resumeWallets = new Set<`0x${string}`>();
    const walletToTokenId = new Map<`0x${string}`, bigint>();

    for (const log of logs) {
      if (log.args.resumeWallet) {
        resumeWallets.add(log.args.resumeWallet);
        walletToTokenId.set(log.args.resumeWallet, log.args.tokenId);
      }
    }

    if (resumeWallets.size === 0) {
      return candidates;
    }

    // Batch read skillPetStats using multicall
    const _contract = getContract({
      address: crediblesV2Address,
      abi: CREDIBLES_V2_ABI,
      client: publicClient,
    });

    const calls = Array.from(resumeWallets).map((wallet) => {
      const tokenId = walletToTokenId.get(wallet)!;
      return {
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "skillPetStats",
        args: [tokenId],
      } as const;
    });

    const results = await publicClient.multicall({
      contracts: calls,
    });

    // Process results
    for (let i = 0; i < calls.length; i++) {
      const wallet = Array.from(resumeWallets)[i];
      const tokenId = walletToTokenId.get(wallet)!;
      const result = results[i];

      if (result.status === "success" && result.result) {
        const stats = result.result as { dev: bigint; defi: bigint; gov: bigint; social: bigint };
        const xp = getCategoryXP(stats, category);
        candidates.set(wallet, { tokenId, xp });
      }
    }
  } catch (error) {
    console.error("Error discovering SkillPet candidates:", error);
  }

  return candidates;
}

/**
 * Discover candidates from AttestationNFT events
 */
async function discoverAttestationCandidates(
  publicClient: ReturnType<typeof createPublicClient>,
  attestationNFTAddress: `0x${string}`,
  category: SkillCategory
): Promise<Set<`0x${string}`>> {
  const candidates = new Set<`0x${string}`>();

  try {
    // Get AttestationNFTMinted events
    const logs = await publicClient.getLogs({
      address: attestationNFTAddress,
      event: ATTESTATION_NFT_ABI[0],
      fromBlock: "earliest",
    });

    // Filter by category and extract recipients
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: ATTESTATION_NFT_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "AttestationNFTMinted") {
          const eventCategory = decoded.args.category?.toLowerCase();
          if (eventCategory === category && decoded.args.recipient) {
            candidates.add(decoded.args.recipient);
          }
        }
      } catch {
        // Skip logs that can't be decoded
        continue;
      }
    }
  } catch (error) {
    console.error("Error discovering Attestation candidates:", error);
  }

  return candidates;
}

/**
 * Rank and select top candidate
 */
function selectTopCandidate(
  skillPetCandidates: Map<`0x${string}`, { tokenId: bigint; xp: bigint }>,
  attestationCandidates: Set<`0x${string}`>
): Candidate | null {
  // Merge candidates
  const allCandidates = new Map<`0x${string}`, Candidate>();

  // Add SkillPet candidates
  for (const [address, data] of skillPetCandidates.entries()) {
    allCandidates.set(address, {
      address,
      hasAttestation: attestationCandidates.has(address),
      xp: data.xp,
      tokenId: data.tokenId,
    });
  }

  // Add Attestation-only candidates (no SkillPet)
  for (const address of attestationCandidates) {
    if (!allCandidates.has(address)) {
      allCandidates.set(address, {
        address,
        hasAttestation: true,
        xp: 0n,
      });
    }
  }

  if (allCandidates.size === 0) {
    return null;
  }

  // Sort: Attestation first, then by XP
  const sorted = Array.from(allCandidates.values()).sort((a, b) => {
    // Primary: Attestation holders first
    if (a.hasAttestation && !b.hasAttestation) return -1;
    if (!a.hasAttestation && b.hasAttestation) return 1;
    // Secondary: Higher XP first
    if (a.xp > b.xp) return -1;
    if (a.xp < b.xp) return 1;
    return 0;
  });

  return sorted[0];
}

/**
 * Verify payment transaction
 */
async function verifyPayment(
  publicClient: ReturnType<typeof createPublicClient>,
  paymentGatewayAddress: `0x${string}`,
  txHash: `0x${string}`,
  expectedStudent: `0x${string}`
): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      return false;
    }

    // Check if transaction was to the payment gateway
    if (receipt.to?.toLowerCase() !== paymentGatewayAddress.toLowerCase()) {
      return false;
    }

    // Find and decode AccessPaid event from logs
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== paymentGatewayAddress.toLowerCase()) {
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: PAYMENT_GATEWAY_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "AccessPaid") {
          const student = decoded.args.student;
          return student?.toLowerCase() === expectedStudent.toLowerCase();
        }
      } catch {
        // Not the event we're looking for, continue
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill")?.toLowerCase();

    if (!skill || !isValidSkill(skill)) {
      return NextResponse.json(
        { error: "Valid skill parameter required (dev, defi, gov, or social)" },
        { status: 400 }
      );
    }

    // Get contract addresses from environment
    const crediblesV2Address = process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS as `0x${string}`;
    const attestationNFTAddress = process.env.NEXT_PUBLIC_ATTESTATION_NFT_CONTRACT_ADDRESS as `0x${string}`;
    const paymentGatewayAddress = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_CONTRACT_ADDRESS as `0x${string}`;

    if (!crediblesV2Address || !attestationNFTAddress || !paymentGatewayAddress) {
      return NextResponse.json(
        { error: "Contract addresses not configured" },
        { status: 500 }
      );
    }

    // Check for payment proof
    const txHash = request.headers.get("X-Transaction-Hash") as `0x${string}` | null;

    // Create public client
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.RPC_URL || "https://sepolia.base.org"),
    });

    // Discover candidates
    const [skillPetCandidates, attestationCandidates] = await Promise.all([
      discoverSkillPetCandidates(publicClient, crediblesV2Address, skill),
      discoverAttestationCandidates(publicClient, attestationNFTAddress, skill),
    ]);

    // Select top candidate
    const topCandidate = selectTopCandidate(skillPetCandidates, attestationCandidates);

    if (!topCandidate) {
      return NextResponse.json(
        { error: "No candidates found for this skill" },
        { status: 404 }
      );
    }

    // If payment proof provided, verify and return candidate info
    if (txHash) {
      const isValid = await verifyPayment(publicClient, paymentGatewayAddress, txHash, topCandidate.address);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid payment transaction" },
          { status: 403 }
        );
      }

      // Return candidate contact info
      return NextResponse.json({
        candidate: {
          address: topCandidate.address,
          email: `talent-${topCandidate.address.slice(2, 8)}@credibles.io`,
          discord: `@talent-${topCandidate.address.slice(2, 10)}`,
          hasAttestation: topCandidate.hasAttestation,
          xp: topCandidate.xp.toString(),
          skill,
        },
      });
    }

    // No payment - return 402 with x402 envelope
    const encodedCalldata = encodeFunctionData({
      abi: PAYMENT_GATEWAY_ABI,
      functionName: "payForAccess",
      args: [topCandidate.address],
    });

    const x402Response = {
      status: 402,
      accepts: [
        {
          type: "application/x402+json",
          target: paymentGatewayAddress,
          amount: "5000000", // 5 USDC (6 decimals)
          currency: "USDC",
          network: "base-sepolia",
          function: "payForAccess(address)",
          data: encodedCalldata,
        },
      ],
    };

    return NextResponse.json(x402Response, { status: 402 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in talent API:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

