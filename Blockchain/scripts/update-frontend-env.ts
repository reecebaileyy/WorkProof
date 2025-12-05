import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

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
  const deploymentFile = "./deployments.json";
  const frontendEnvFile = "../Credibles/.env.local";
  
  if (!existsSync(deploymentFile)) {
    console.log("❌ No deployment history found.");
    console.log("   Using latest deployment from terminal output:");
    console.log("   Credibles: 0x02f071022fa105d61c1c4565aa2bb66fdc32d45b");
    console.log("   AttestationResolver: 0x509bdbe1376d74ce697fb15583a4d998c0f9a24e");
    console.log("   Schema UID: 0x899b0b5e7083ba093eb70ae38e45a0743599beb04b74a8904e4f9d9a1717878f");
    
    // Use the latest deployment from terminal
    const envContent = `# Updated from latest deployment
NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=0x02f071022fa105d61c1c4565aa2bb66fdc32d45b
NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=0x509bdbe1376d74ce697fb15583a4d998c0f9a24e
NEXT_PUBLIC_SCHEMA_UID=0x899b0b5e7083ba093eb70ae38e45a0743599beb04b74a8904e4f9d9a1717878f
`;
    
    writeFileSync(frontendEnvFile, envContent);
    console.log(`\n✅ Updated ${frontendEnvFile} with latest addresses`);
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
  const schemaUID = latest.schemaUID;

  if (!crediblesAddress || !resolverAddress) {
    console.log("❌ Could not find contract addresses");
    return;
  }

  // Read existing .env.local if it exists
  let existingEnv = "";
  if (existsSync(frontendEnvFile)) {
    existingEnv = readFileSync(frontendEnvFile, "utf-8");
  }

  // Update or add contract addresses
  const lines = existingEnv.split("\n");
  const updatedLines = lines.map(line => {
    if (line.startsWith("NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=")) {
      return `NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=${crediblesAddress}`;
    }
    if (line.startsWith("NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=")) {
      return `NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=${resolverAddress}`;
    }
    if (line.startsWith("NEXT_PUBLIC_SCHEMA_UID=")) {
      return `NEXT_PUBLIC_SCHEMA_UID=${schemaUID || ""}`;
    }
    return line;
  });

  // Add missing lines
  if (!updatedLines.some(l => l.startsWith("NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS="))) {
    updatedLines.push(`NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=${crediblesAddress}`);
  }
  if (!updatedLines.some(l => l.startsWith("NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS="))) {
    updatedLines.push(`NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=${resolverAddress}`);
  }
  if (schemaUID && !updatedLines.some(l => l.startsWith("NEXT_PUBLIC_SCHEMA_UID="))) {
    updatedLines.push(`NEXT_PUBLIC_SCHEMA_UID=${schemaUID}`);
  }

  writeFileSync(frontendEnvFile, updatedLines.join("\n"));
  console.log(`\n✅ Updated ${frontendEnvFile} with latest deployment addresses`);
  console.log(`   Credibles: ${crediblesAddress}`);
  console.log(`   AttestationResolver: ${resolverAddress}`);
  if (schemaUID) {
    console.log(`   Schema UID: ${schemaUID}`);
  }
}

main().catch(console.error);

