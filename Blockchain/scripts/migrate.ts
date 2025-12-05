import { createPublicClient, createWalletClient, http } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";

dotenv.config();

// Old contract ABI (for reading existing data)
const OLD_CREDIBLES_ABI = [
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "characterStats",
    outputs: [
      { name: "dev", type: "uint256" },
      { name: "defi", type: "uint256" },
      { name: "gov", type: "uint256" },
      { name: "social", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "getTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// New contract ABI (for writing migrated data)
const NEW_CREDIBLES_ABI = [
  {
    inputs: [{ name: "resumeWallet", type: "address" }],
    name: "mintSkillPet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "resumeWallet", type: "address" },
      { name: "category", type: "string" },
      { name: "amount", type: "uint256" },
    ],
    name: "addXPDirect",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "resumeWallet", type: "address" },
    ],
    name: "registerResumeWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not set in .env file");
  }

  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}` as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.RPC_URL || "https://sepolia.base.org"),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.RPC_URL || "https://sepolia.base.org"),
  });

  // Get contract addresses from environment or deployment file
  const oldContractAddress = process.env.OLD_CREDIBLES_CONTRACT_ADDRESS as `0x${string}`;
  const newContractAddress = process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS as `0x${string}`;

  if (!oldContractAddress || !newContractAddress) {
    console.log("❌ Please set OLD_CREDIBLES_CONTRACT_ADDRESS and NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS");
    return;
  }

  console.log("🔄 Starting migration from old contract to new contract...");
  console.log(`Old Contract: ${oldContractAddress}`);
  console.log(`New Contract: ${newContractAddress}`);

  // Get deployment history to find old contract users
  const deploymentFile = "./deployments.json";
  if (!existsSync(deploymentFile)) {
    console.log("❌ No deployment history found");
    return;
  }

  const deployments = JSON.parse(readFileSync(deploymentFile, "utf-8"));
  const oldDeployment = deployments.find((d: any) => 
    d.contracts.some((c: any) => c.name === "Credibles" && c.address.toLowerCase() === oldContractAddress.toLowerCase())
  );

  if (!oldDeployment) {
    console.log("⚠️  Old contract not found in deployment history");
    console.log("   Migration will need to be done manually for each user");
    return;
  }

  console.log("\n📋 Migration Instructions:");
  console.log("1. For each user with an old SkillPet NFT:");
  console.log("   - They need to create a Base Account sub-account (resume wallet)");
  console.log("   - Register the resume wallet in the new contract");
  console.log("   - Mint a new SkillPet NFT to the resume wallet");
  console.log("   - XP can be migrated by calling addXPDirect for each category");
  console.log("\n2. This script provides a helper function to migrate XP:");
  console.log("   - Call migrateUserXP(userAddress, resumeWallet) for each user");
  console.log("\n3. Users will need to complete the migration through the frontend");
  console.log("   - The frontend will guide them through Base Account setup");
  console.log("   - Then they can mint their new SkillPet NFT");

  console.log("\n✅ Migration guide complete. Users can migrate through the frontend.");
}

/**
 * Helper function to migrate a user's XP from old contract to new
 * This should be called for each user individually
 */
export async function migrateUserXP(
  publicClient: any,
  walletClient: any,
  oldContract: `0x${string}`,
  newContract: `0x${string}`,
  userAddress: `0x${string}`,
  resumeWallet: `0x${string}`
) {
  try {
    // Get old token ID
    const oldTokenId = await publicClient.readContract({
      address: oldContract,
      abi: OLD_CREDIBLES_ABI,
      functionName: "getTokenId",
      args: [userAddress],
    });

    if (!oldTokenId || oldTokenId === 0n) {
      console.log(`No old NFT found for ${userAddress}`);
      return;
    }

    // Get old stats
    const oldStats = await publicClient.readContract({
      address: oldContract,
      abi: OLD_CREDIBLES_ABI,
      functionName: "characterStats",
      args: [oldTokenId],
    });

    console.log(`Migrating XP for ${userAddress}:`);
    console.log(`  Dev: ${oldStats.dev}, DeFi: ${oldStats.defi}, Gov: ${oldStats.gov}, Social: ${oldStats.social}`);

    // Migrate XP for each category
    const categories = [
      { name: "dev", value: oldStats.dev },
      { name: "defi", value: oldStats.defi },
      { name: "gov", value: oldStats.gov },
      { name: "social", value: oldStats.social },
    ];

    for (const category of categories) {
      if (category.value > 0n) {
        const hash = await walletClient.writeContract({
          address: newContract,
          abi: NEW_CREDIBLES_ABI,
          functionName: "addXPDirect",
          args: [resumeWallet, category.name, category.value],
        });
        await waitForTransactionReceipt(publicClient, { hash });
        console.log(`  ✓ Migrated ${category.name} XP: ${category.value}`);
      }
    }

    console.log(`✅ Migration complete for ${userAddress}`);
  } catch (error) {
    console.error(`❌ Error migrating ${userAddress}:`, error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

