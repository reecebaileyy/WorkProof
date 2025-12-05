import { NextRequest, NextResponse } from "next/server";

// Payment configuration
const PAYMENT_CONFIG = {
  price: "5.00", // 5 USDC
  network: "base-sepolia",
  description: "Access Verified Talent Data",
  recipient: process.env.WALLET_ADDRESS || process.env.NEXT_PUBLIC_WALLET_ADDRESS || "",
};

// USDC address on Base Sepolia
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Mock verified users data (in production, this would come from a database)
const MOCK_VERIFIED_USERS = [
  {
    id: 1,
    name: "Alice",
    level: 5,
    category: "dev",
    skills: ["Solidity", "React", "TypeScript"],
    xp: {
      dev: 450,
      defi: 120,
      gov: 80,
      social: 60,
    },
    contact: "alice@example.com",
  },
  {
    id: 2,
    name: "Bob",
    level: 3,
    category: "defi",
    skills: ["Node.js", "TypeScript", "DeFi Protocols"],
    xp: {
      dev: 180,
      defi: 280,
      gov: 50,
      social: 40,
    },
    contact: "bob@example.com",
  },
  {
    id: 3,
    name: "Charlie",
    level: 4,
    category: "gov",
    skills: ["DAO Governance", "Solidity", "Economics"],
    xp: {
      dev: 200,
      defi: 150,
      gov: 380,
      social: 90,
    },
    contact: "charlie@example.com",
  },
  {
    id: 4,
    name: "Diana",
    level: 6,
    category: "dev",
    skills: ["Rust", "Web3", "Smart Contracts"],
    xp: {
      dev: 580,
      defi: 200,
      gov: 100,
      social: 120,
    },
    contact: "diana@example.com",
  },
];

/**
 * GET /api/headhunter
 * 
 * x402-gated API endpoint for accessing verified talent data.
 * Returns 402 Payment Required if no valid payment proof is provided.
 * Returns 200 with verified users JSON if payment is valid.
 * 
 * Query params:
 * - skill: Optional filter by skill category (dev, defi, gov, social)
 * - level: Optional minimum level filter
 */
export async function GET(request: NextRequest) {
  try {
    // Check for payment proof in headers
    const paymentProof = request.headers.get("X-Payment") || request.headers.get("x-payment");
    
    // If no payment proof or no recipient address configured, return 402 with payment details
    if (!paymentProof || !PAYMENT_CONFIG.recipient) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "Payment Required",
          accepts: [
            {
              scheme: "exact",
              network: PAYMENT_CONFIG.network,
              maxAmountRequired: (parseFloat(PAYMENT_CONFIG.price) * 1e6).toString(), // 5 USDC in smallest unit (6 decimals)
              asset: USDC_ADDRESS,
              payTo: PAYMENT_CONFIG.recipient || "0x0000000000000000000000000000000000000000",
              resource: request.url,
              description: PAYMENT_CONFIG.description,
              mimeType: "application/json",
              outputSchema: null,
              maxTimeoutSeconds: 60,
              extra: {
                name: "USDC",
                version: "2",
              },
            },
          ],
        },
        { status: 402 }
      );
    }

    // TODO: Verify payment proof on-chain
    // In production, you should:
    // 1. Verify the transaction hash exists on Base Sepolia
    // 2. Check the transaction is to the PaymentSplitter contract
    // 3. Verify the amount is >= 5 USDC
    // 4. Check the transaction is recent (within timeout)
    // For now, if payment proof exists, allow access
    
    const { searchParams } = new URL(request.url);
    const skillFilter = searchParams.get("skill");
    const levelFilter = searchParams.get("level");

    // Filter users based on query parameters
    let filteredUsers = [...MOCK_VERIFIED_USERS];

    if (skillFilter) {
      filteredUsers = filteredUsers.filter(
        (user) => user.category === skillFilter.toLowerCase()
      );
    }

    if (levelFilter) {
      const minLevel = parseInt(levelFilter, 10);
      if (!isNaN(minLevel)) {
        filteredUsers = filteredUsers.filter(
          (user) => user.level >= minLevel
        );
      }
    }

    // Return filtered verified users
    return NextResponse.json(
      {
        success: true,
        count: filteredUsers.length,
        users: filteredUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Headhunter API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
