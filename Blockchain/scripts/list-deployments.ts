import { readFileSync, existsSync } from "fs";

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
  
  if (!existsSync(deploymentFile)) {
    console.log("❌ No deployment history found.");
    console.log("   Deploy contracts first using: npx hardhat run scripts/deploy.ts --network baseSepolia");
    return;
  }

  const deployments: Deployment[] = JSON.parse(
    readFileSync(deploymentFile, "utf-8")
  );

  console.log("\n📋 Deployment History\n");
  console.log("=".repeat(80));
  
  const sorted = deployments.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  sorted.forEach((deployment, index) => {
    const date = new Date(deployment.timestamp);
    console.log(`\n${index + 1}. ${deployment.network.toUpperCase()} - ${date.toLocaleString()}`);
    console.log("-".repeat(80));
    console.log(`   Owner: ${deployment.owner}`);
    deployment.contracts.forEach(contract => {
      console.log(`\n   📄 ${contract.name}:`);
      console.log(`      Address: ${contract.address}`);
      console.log(`      TX: ${contract.txHash}`);
      console.log(`      Explorer: https://sepolia.basescan.org/address/${contract.address}`);
    });
    if (deployment.schemaUID) {
      console.log(`\n   🔑 Schema UID: ${deployment.schemaUID}`);
    }
  });
  
  // Show most recent deployment details
  if (sorted.length > 0) {
    const latest = sorted[0];
    console.log("\n" + "=".repeat(80));
    console.log("\n✨ Most Recent Deployment:");
    console.log(`   Network: ${latest.network}`);
    console.log(`   Date: ${new Date(latest.timestamp).toLocaleString()}`);
    console.log("\n   Environment Variables:");
    console.log(`   NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=${latest.contracts.find(c => c.name === "Credibles")?.address}`);
    console.log(`   NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=${latest.contracts.find(c => c.name === "AttestationResolver")?.address}`);
    if (latest.schemaUID) {
      console.log(`   NEXT_PUBLIC_SCHEMA_UID=${latest.schemaUID}`);
    }
  }
  
  console.log("\n" + "=".repeat(80) + "\n");
}

main().catch(console.error);

