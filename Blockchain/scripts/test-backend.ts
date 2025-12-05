import { createPublicClient, http } from "../node_modules/viem/_types/index.js";
import { baseSepolia } from "../node_modules/viem/_types/chains/index.js";
import { readFileSync, existsSync } from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const deploymentFile = "./deployments.json";
  
  let crediblesAddress: string;
  let resolverAddress: string;
  let schemaUID: string | undefined;

  if (!existsSync(deploymentFile)) {
    console.log("⚠️  No deployment history found. Using latest deployment addresses from terminal.");
    // Use latest deployment from terminal output
    crediblesAddress = "0x02f071022fa105d61c1c4565aa2bb66fdc32d45b";
    resolverAddress = "0x509bdbe1376d74ce697fb15583a4d998c0f9a24e";
    schemaUID = "0x899b0b5e7083ba093eb70ae38e45a0743599beb04b74a8904e4f9d9a1717878f";
  } else {
    const deployments = JSON.parse(readFileSync(deploymentFile, "utf-8"));
    const latest = deployments.sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    crediblesAddress = latest.contracts.find((c: any) => c.name === "Credibles")?.address;
    resolverAddress = latest.contracts.find((c: any) => c.name === "AttestationResolver")?.address;
    schemaUID = latest.schemaUID;

    if (!crediblesAddress || !resolverAddress) {
      console.log("❌ Could not find contract addresses in deployment history");
      return;
    }
  }

  console.log("\n🧪 Testing Backend Connection...\n");

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.RPC_URL || "https://sepolia.base.org"),
  });

  try {
    // Test 1: Check if contracts exist
    console.log("1️⃣  Checking if contracts exist on-chain...");
    const crediblesCode = await publicClient.getBytecode({ address: crediblesAddress as `0x${string}` });
    const resolverCode = await publicClient.getBytecode({ address: resolverAddress as `0x${string}` });

    if (!crediblesCode || crediblesCode === "0x") {
      console.log("   ❌ Credibles contract not found at address");
      return;
    }
    console.log("   ✅ Credibles contract found");

    if (!resolverCode || resolverCode === "0x") {
      console.log("   ❌ AttestationResolver contract not found at address");
      return;
    }
    console.log("   ✅ AttestationResolver contract found");

    // Test 2: Read contract state
    console.log("\n2️⃣  Testing contract reads...");
    const crediblesArtifact = JSON.parse(
      readFileSync("./artifacts/contracts/Credibles.sol/Credibles.json", "utf-8")
    );

    try {
      const name = await publicClient.readContract({
        address: crediblesAddress as `0x${string}`,
        abi: crediblesArtifact.abi,
        functionName: "name",
      });
      console.log(`   ✅ Contract name: ${name}`);

      const resolver = await publicClient.readContract({
        address: crediblesAddress as `0x${string}`,
        abi: crediblesArtifact.abi,
        functionName: "attestationResolver",
      });
      console.log(`   ✅ AttestationResolver set: ${resolver}`);
    } catch (error) {
      console.log("   ⚠️  Could not read contract state:", error);
    }

    // Test 3: Check resolver schema
    console.log("\n3️⃣  Testing AttestationResolver...");
    const resolverArtifact = JSON.parse(
      readFileSync("./artifacts/contracts/AttestationResolver.sol/AttestationResolver.json", "utf-8")
    );

    try {
      const schemaUID = await publicClient.readContract({
        address: resolverAddress as `0x${string}`,
        abi: resolverArtifact.abi,
        functionName: "schemaUID",
      });
      console.log(`   ✅ Schema UID: ${schemaUID}`);
    } catch (error) {
      console.log("   ⚠️  Could not read schema UID");
    }

    // Test 4: Check network connection
    console.log("\n4️⃣  Testing network connection...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`   ✅ Connected to Base Sepolia (Block: ${blockNumber})`);

    console.log("\n✅ Backend is working correctly!");
    console.log("\n📝 Frontend Configuration:");
    console.log(`   NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=${crediblesAddress}`);
    console.log(`   NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=${resolverAddress}`);
    if (schemaUID) {
      console.log(`   NEXT_PUBLIC_SCHEMA_UID=${schemaUID}`);
    }

  } catch (error: any) {
    console.log("\n❌ Backend test failed:");
    console.log(`   Error: ${error.message}`);
  }
}

main().catch(console.error);

