import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import * as dotenv from "dotenv";

dotenv.config();

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

async function main() {
  if (!process.env.BASESCAN_API_KEY) {
    console.log("❌ BASESCAN_API_KEY not set in .env file");
    console.log("   Get an API key from: https://sepolia.basescan.org/apis");
    return;
  }

  const deploymentFile = "./deployments.json";
  
  if (!existsSync(deploymentFile)) {
    console.log("❌ No deployment history found.");
    console.log("   Using latest deployment addresses:");
    console.log("   Credibles: 0x02f071022fa105d61c1c4565aa2bb66fdc32d45b");
    console.log("   AttestationResolver: 0x509bdbe1376d74ce697fb15583a4d998c0f9a24e");
    
    // Use latest from terminal
    await verifyContract(
      "Credibles",
      "0x02f071022fa105d61c1c4565aa2bb66fdc32d45b",
      ["0x41b1e204e9c15fF5894bd47C6Dc3a7Fa98C775C7"]
    );
    
    await verifyContract(
      "AttestationResolver",
      "0x509bdbe1376d74ce697fb15583a4d998c0f9a24e",
      [
        "0x4200000000000000000000000000000000000021",
        "0x4200000000000000000000000000000000000020",
        "0x02f071022fa105d61c1c4565aa2bb66fdc32d45b"
      ]
    );
    return;
  }

  const deployments: Deployment[] = JSON.parse(
    readFileSync(deploymentFile, "utf-8")
  );

  const latest = deployments.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  const crediblesAddress = latest.contracts.find(c => c.name === "Credibles")?.address;
  const resolverAddress = latest.contracts.find(c => c.name === "AttestationResolver")?.address;

  if (!crediblesAddress || !resolverAddress) {
    console.log("❌ Could not find contract addresses");
    return;
  }

  console.log("\n🔍 Verifying contracts on BaseScan...\n");

  // Verify Credibles
  await verifyContract("Credibles", crediblesAddress, [latest.owner]);

  // Verify AttestationResolver
  await verifyContract(
    "AttestationResolver",
    resolverAddress,
    [
      "0x4200000000000000000000000000000000000021", // EAS
      "0x4200000000000000000000000000000000000020", // Schema Registry
      crediblesAddress
    ]
  );
}

async function verifyContract(name: string, address: string, args: string[]) {
  console.log(`📄 Verifying ${name}...`);
  try {
    const argsString = args.map(a => `"${a}"`).join(" ");
    execSync(
      `npx hardhat verify --network baseSepolia ${address} ${argsString}`,
      { stdio: "inherit" }
    );
    console.log(`✅ ${name} verified successfully!\n`);
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    if (errorMsg.includes("already verified") || errorMsg.includes("Already Verified")) {
      console.log(`✅ ${name} already verified on BaseScan\n`);
    } else if (errorMsg.includes("Sourcify")) {
      console.log(`✅ ${name} verified on Sourcify (alternative verification)\n`);
    } else {
      console.log(`⚠️  ${name} verification failed. You can verify manually on BaseScan.\n`);
      console.log(`   Command: npx hardhat verify --network baseSepolia ${address} ${args.map(a => `"${a}"`).join(" ")}\n`);
    }
  }
}

main().catch(console.error);

