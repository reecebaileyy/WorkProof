import { createWalletClient, createPublicClient, http } from "../node_modules/viem/_types/index.js";
import { waitForTransactionReceipt } from "../node_modules/viem/_types/actions/index.js";
import { privateKeyToAccount } from "../node_modules/viem/_types/accounts/index.js";
import { baseSepolia } from "../node_modules/viem/_types/chains/index.js";
import * as dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";

dotenv.config();

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

  // Get contract address from deployment history or use latest
  const deploymentFile = "./deployments.json";
  let crediblesAddress: string;

  if (existsSync(deploymentFile)) {
    const deployments = JSON.parse(readFileSync(deploymentFile, "utf-8"));
    const latest = deployments.sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    crediblesAddress = latest.contracts.find((c: any) => c.name === "Credibles")?.address;
  } else {
    // Use latest deployment
    crediblesAddress = "0x02f071022fa105d61c1c4565aa2bb66fdc32d45b";
  }

  if (!crediblesAddress) {
    throw new Error("Could not find Credibles contract address");
  }

  // Get recipient and token ID from args or use defaults
  const recipient = (process.env.RECIPIENT_ADDRESS || account.address) as `0x${string}`;
  const tokenId = BigInt(process.env.TOKEN_ID || "1");

  console.log(`\n🎫 Minting Credible NFT...`);
  console.log(`   Contract: ${crediblesAddress}`);
  console.log(`   Recipient: ${recipient}`);
  console.log(`   Token ID: ${tokenId}\n`);

  const artifact = JSON.parse(
    readFileSync("./artifacts/contracts/Credibles.sol/Credibles.json", "utf-8")
  );

  const hash = await walletClient.writeContract({
    address: crediblesAddress as `0x${string}`,
    abi: artifact.abi,
    functionName: "mint",
    args: [recipient, tokenId],
  });

  console.log(`Transaction hash: ${hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await waitForTransactionReceipt(publicClient, { hash });
  
  console.log(`\n✅ Token ${tokenId} minted successfully!`);
  console.log(`   Transaction: ${hash}`);
  console.log(`   Explorer: https://sepolia.basescan.org/tx/${hash}`);
  console.log(`   View NFT: https://sepolia.basescan.org/address/${crediblesAddress}#readContract`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

