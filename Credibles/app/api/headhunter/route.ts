import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";

// Payment configuration
const PAYMENT_CONFIG = {
  price: "5.00", // 5 USDC
  network: "base-sepolia",
  description: "Access Verified Talent Data",
};

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

// Create x402 middleware
const x402Gate = paymentMiddleware(
  process.env.WALLET_ADDRESS || "", // Your wallet receives the funds
  {
    "/api/headhunter": {
      price: PAYMENT_CONFIG.price,
      network: PAYMENT_CONFIG.network,
      config: {
        description: PAYMENT_CONFIG.description,
      },
    },
  },
  facilitator // Uses Coinbase's hosted verifier automatically
);

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
    // Apply x402 payment middleware
    // The middleware will handle payment verification and return 402 if needed
    const response = await new Promise<NextResponse>((resolve) => {
      x402Gate(
        request as any,
        {
          status: (code: number) => ({
            json: (data: any) => {
              resolve(NextResponse.json(data, { status: code }));
            },
            send: (data: any) => {
              resolve(new NextResponse(data, { status: code }));
            },
          }),
        } as any,
        async () => {
          // Payment verified - proceed with data retrieval
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
          resolve(
            NextResponse.json(
              {
                success: true,
                count: filteredUsers.length,
                users: filteredUsers,
              },
              { status: 200 }
            )
          );
        }
      );
    });

    return response;
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
