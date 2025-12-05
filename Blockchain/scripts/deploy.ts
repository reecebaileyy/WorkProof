import { createWalletClient, createPublicClient, http } from "../node_modules/viem/_types/index.js";
import { waitForTransactionReceipt } from "../node_modules/viem/_types/actions/index.js";
import { privateKeyToAccount } from "../node_modules/viem/_types/accounts/index.js";
import { baseSepolia } from "../node_modules/viem/_types/chains/index.js";
import * as dotenv from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

dotenv.config();

// Compile contracts first
console.log("Compiling contracts...");
execSync("npx hardhat compile", { stdio: "inherit" });

const EAS_ADDRESS = "0x4200000000000000000000000000000000000021";
const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020";

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

  console.log("Deploying Credibles contract...");
  
  // Read compiled contract bytecode
  const crediblesArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/Credibles.sol/Credibles.json", "utf-8")
  );
  
  const crediblesHash = await walletClient.deployContract({
    abi: crediblesArtifact.abi,
    bytecode: crediblesArtifact.bytecode as `0x${string}`,
    args: [account.address],
  });

  console.log(`Credibles deployment transaction: ${crediblesHash}`);
  
  // Wait for transaction receipt
  const crediblesReceipt = await waitForTransactionReceipt(publicClient, { hash: crediblesHash });
  const crediblesAddress = crediblesReceipt.contractAddress;
  
  if (!crediblesAddress) {
    throw new Error("Credibles deployment failed - no contract address");
  }

  console.log(`Credibles deployed to: ${crediblesAddress}`);

  console.log("Deploying AttestationResolver contract...");
  
  const resolverArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/AttestationResolver.sol/AttestationResolver.json", "utf-8")
  );
  
  const resolverHash = await walletClient.deployContract({
    abi: resolverArtifact.abi,
    bytecode: resolverArtifact.bytecode as `0x${string}`,
    args: [EAS_ADDRESS, SCHEMA_REGISTRY_ADDRESS, crediblesAddress],
  });

  console.log(`AttestationResolver deployment transaction: ${resolverHash}`);
  
  const resolverReceipt = await waitForTransactionReceipt(publicClient, { hash: resolverHash });
  const resolverAddress = resolverReceipt.contractAddress;
  
  if (!resolverAddress) {
    throw new Error("AttestationResolver deployment failed - no contract address");
  }

  console.log(`AttestationResolver deployed to: ${resolverAddress}`);

  // Get schema UID from the resolver contract
  // Wait a bit for the contract to be fully deployed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { abi: resolverABI } = resolverArtifact;
  let schemaUID: string;
  
  try {
    schemaUID = await publicClient.readContract({
      address: resolverAddress,
      abi: resolverABI,
      functionName: "schemaUID",
    }) as string;
    console.log(`Schema UID: ${schemaUID}`);
  } catch (error) {
    console.warn("Could not read schemaUID from contract, trying to get from registry...");
    // Try to get it from the registry by checking events or calculating it
    // For now, we'll note that it needs to be retrieved manually
    schemaUID = "0x0000000000000000000000000000000000000000000000000000000000000000";
    console.warn("Schema UID could not be automatically retrieved. Please check the contract on BaseScan.");
    console.warn("You can find it by calling schemaUID() on the AttestationResolver contract.");
  }

  // Set the resolver as the authorized address in Credibles
  const crediblesABI = crediblesArtifact.abi;
  const setResolverHash = await walletClient.writeContract({
    address: crediblesAddress,
    abi: crediblesABI,
    functionName: "setAttestationResolver",
    args: [resolverAddress],
  });

  await waitForTransactionReceipt(publicClient, { hash: setResolverHash });
  console.log("AttestationResolver set in Credibles contract");

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
    schemaUID?: string;
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
        name: "Credibles",
        address: crediblesAddress,
        txHash: crediblesHash,
      },
      {
        name: "AttestationResolver",
        address: resolverAddress,
        txHash: resolverHash,
      },
    ],
    schemaUID: schemaUID as string,
  };

  deployments.push(deployment);
  writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log(`\n✅ Deployment saved to ${deploymentFile}`);

  // Verify contracts if BASESCAN_API_KEY is set
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nVerifying contracts on BaseScan...");
    try {
      // Verify Credibles (skip if already verified)
      try {
        execSync(
          `npx hardhat verify --network baseSepolia ${crediblesAddress} "${account.address}"`,
          { stdio: "inherit" }
        );
      } catch (error: any) {
        if (error.message?.includes("already verified") || error.message?.includes("Already Verified")) {
          console.log("✅ Credibles already verified");
        } else {
          console.warn("⚠️  Credibles verification failed (may already be verified)");
        }
      }

      // Verify AttestationResolver
      try {
        execSync(
          `npx hardhat verify --network baseSepolia ${resolverAddress} "${EAS_ADDRESS}" "${SCHEMA_REGISTRY_ADDRESS}" "${crediblesAddress}"`,
          { stdio: "inherit" }
        );
      } catch (error: any) {
        if (error.message?.includes("already verified") || error.message?.includes("Already Verified")) {
          console.log("✅ AttestationResolver already verified");
        } else {
          console.warn("⚠️  AttestationResolver verification failed (may already be verified)");
        }
      }
    } catch (error) {
      console.warn("Verification had some issues, but contracts are deployed. You can verify manually later.");
    }
  } else {
    console.log("\n⚠️  BASESCAN_API_KEY not set. Skipping verification.");
    console.log("   To verify manually, run:");
    console.log(`   npx hardhat verify --network baseSepolia ${crediblesAddress} "${account.address}"`);
    console.log(`   npx hardhat verify --network baseSepolia ${resolverAddress} "${EAS_ADDRESS}" "${SCHEMA_REGISTRY_ADDRESS}" "${crediblesAddress}"`);
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`Credibles: ${crediblesAddress}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${crediblesAddress}`);
  console.log(`AttestationResolver: ${resolverAddress}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${resolverAddress}`);
  console.log(`Schema UID: ${schemaUID}`);
  console.log("\n📝 Add these to your Credibles/.env.local file:");
  console.log(`NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=${crediblesAddress}`);
  console.log(`NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=${resolverAddress}`);
  console.log(`NEXT_PUBLIC_SCHEMA_UID=${schemaUID}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

