import { createWalletClient, createPublicClient, http } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

dotenv.config();

// Compile contracts first
console.log("Compiling contracts...");
execSync("npx hardhat compile", { stdio: "inherit" });

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

  console.log("Deploying CrediblesV2 contract...");
  
  // Read compiled contract bytecode
  const crediblesV2Artifact = JSON.parse(
    readFileSync("./artifacts/contracts/CrediblesV2.sol/CrediblesV2.json", "utf-8")
  );
  
  const crediblesV2Hash = await walletClient.deployContract({
    abi: crediblesV2Artifact.abi,
    bytecode: crediblesV2Artifact.bytecode as `0x${string}`,
    args: [account.address],
  });

  console.log(`CrediblesV2 deployment transaction: ${crediblesV2Hash}`);
  
  // Wait for transaction receipt
  const crediblesV2Receipt = await waitForTransactionReceipt(publicClient, { hash: crediblesV2Hash });
  const crediblesV2Address = crediblesV2Receipt.contractAddress;
  
  if (!crediblesV2Address) {
    throw new Error("CrediblesV2 deployment failed - no contract address");
  }

  console.log(`CrediblesV2 deployed to: ${crediblesV2Address}`);

  console.log("Deploying IssuerRegistry contract...");
  
  const issuerRegistryArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/IssuerRegistry.sol/IssuerRegistry.json", "utf-8")
  );
  
  const issuerRegistryHash = await walletClient.deployContract({
    abi: issuerRegistryArtifact.abi,
    bytecode: issuerRegistryArtifact.bytecode as `0x${string}`,
    args: [account.address],
  });

  console.log(`IssuerRegistry deployment transaction: ${issuerRegistryHash}`);
  
  const issuerRegistryReceipt = await waitForTransactionReceipt(publicClient, { hash: issuerRegistryHash });
  const issuerRegistryAddress = issuerRegistryReceipt.contractAddress;
  
  if (!issuerRegistryAddress) {
    throw new Error("IssuerRegistry deployment failed - no contract address");
  }

  console.log(`IssuerRegistry deployed to: ${issuerRegistryAddress}`);

  // Save deployment to history
  const deploymentFile = "./deployments.json";
  interface Deployment {
    network: string;
    timestamp: string;
    contracts: {
      name: string;
      address: string;
      txHash: string;
    }[];
    owner: string;
  }

  let deployments: Deployment[] = [];
  if (existsSync(deploymentFile)) {
    deployments = JSON.parse(readFileSync(deploymentFile, "utf-8"));
  }

  const deployment: Deployment = {
    network: "base-sepolia",
    timestamp: new Date().toISOString(),
    owner: account.address,
    contracts: [
      {
        name: "CrediblesV2",
        address: crediblesV2Address,
        txHash: crediblesV2Hash,
      },
      {
        name: "IssuerRegistry",
        address: issuerRegistryAddress,
        txHash: issuerRegistryHash,
      },
    ],
  };

  deployments.push(deployment);
  writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log(`\n✅ Deployment saved to ${deploymentFile}`);

  // Verify contracts if BASESCAN_API_KEY is set
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nVerifying contracts on BaseScan...");
    try {
      // Verify CrediblesV2
      try {
        execSync(
          `npx hardhat verify --network baseSepolia ${crediblesV2Address} "${account.address}"`,
          { stdio: "inherit" }
        );
      } catch (error: any) {
        if (error.message?.includes("already verified") || error.message?.includes("Already Verified")) {
          console.log("✅ CrediblesV2 already verified");
        } else {
          console.warn("⚠️  CrediblesV2 verification failed (may already be verified)");
        }
      }

      // Verify IssuerRegistry
      try {
        execSync(
          `npx hardhat verify --network baseSepolia ${issuerRegistryAddress} "${account.address}"`,
          { stdio: "inherit" }
        );
      } catch (error: any) {
        if (error.message?.includes("already verified") || error.message?.includes("Already Verified")) {
          console.log("✅ IssuerRegistry already verified");
        } else {
          console.warn("⚠️  IssuerRegistry verification failed (may already be verified)");
        }
      }
    } catch (error) {
      console.warn("Verification had some issues, but contracts are deployed. You can verify manually later.");
    }
  } else {
    console.log("\n⚠️  BASESCAN_API_KEY not set. Skipping verification.");
    console.log("   To verify manually, run:");
    console.log(`   npx hardhat verify --network baseSepolia ${crediblesV2Address} "${account.address}"`);
    console.log(`   npx hardhat verify --network baseSepolia ${issuerRegistryAddress} "${account.address}"`);
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`CrediblesV2: ${crediblesV2Address}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${crediblesV2Address}`);
  console.log(`IssuerRegistry: ${issuerRegistryAddress}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${issuerRegistryAddress}`);
  console.log("\n📝 Add these to your Credibles/.env.local file:");
  console.log(`NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS=${crediblesV2Address}`);
  console.log(`NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS=${issuerRegistryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

