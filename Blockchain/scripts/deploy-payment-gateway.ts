import { createWalletClient, createPublicClient, http } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

dotenv.config();

// USDC address on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

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

  console.log("Deploying TalentPaymentGateway contract...");
  console.log(`USDC Address: ${USDC_ADDRESS}`);
  
  // Read compiled contract bytecode
  const paymentGatewayArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/TalentPaymentGateway.sol/TalentPaymentGateway.json", "utf-8")
  );
  
  const paymentGatewayHash = await walletClient.deployContract({
    abi: paymentGatewayArtifact.abi,
    bytecode: paymentGatewayArtifact.bytecode as `0x${string}`,
    args: [account.address, USDC_ADDRESS], // initialOwner, usdc
  });

  console.log(`TalentPaymentGateway deployment transaction: ${paymentGatewayHash}`);
  
  // Wait for transaction receipt
  const paymentGatewayReceipt = await waitForTransactionReceipt(publicClient, { hash: paymentGatewayHash });
  const paymentGatewayAddress = paymentGatewayReceipt.contractAddress;
  
  if (!paymentGatewayAddress) {
    throw new Error("TalentPaymentGateway deployment failed - no contract address");
  }

  console.log(`TalentPaymentGateway deployed to: ${paymentGatewayAddress}`);

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
        name: "TalentPaymentGateway",
        address: paymentGatewayAddress,
        txHash: paymentGatewayHash,
      },
    ],
  };

  deployments.push(deployment);
  writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log(`\n✅ Deployment saved to ${deploymentFile}`);

  // Verify contracts if BASESCAN_API_KEY is set
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nVerifying contract on BaseScan...");
    try {
      execSync(
        `npx hardhat verify --network baseSepolia ${paymentGatewayAddress} "${account.address}" "${USDC_ADDRESS}"`,
        { stdio: "inherit" }
      );
    } catch (error: any) {
      if (error.message?.includes("already verified") || error.message?.includes("Already Verified")) {
        console.log("✅ TalentPaymentGateway already verified");
      } else {
        console.warn("⚠️  TalentPaymentGateway verification failed (may already be verified)");
      }
    }
  } else {
    console.log("\n⚠️  BASESCAN_API_KEY not set. Skipping verification.");
    console.log("   To verify manually, run:");
    console.log(`   npx hardhat verify --network baseSepolia ${paymentGatewayAddress} "${account.address}" "${USDC_ADDRESS}"`);
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`TalentPaymentGateway: ${paymentGatewayAddress}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${paymentGatewayAddress}`);
  console.log("\n📝 Add this to your Credibles/.env.local file:");
  console.log(`NEXT_PUBLIC_PAYMENT_GATEWAY_CONTRACT_ADDRESS=${paymentGatewayAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

