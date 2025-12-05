import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // EAS Contract Addresses (Base Sepolia)
  const EAS_ADDRESS = process.env.EAS_ADDRESS || "0x4200000000000000000000000000000000000021";
  const SCHEMA_REGISTRY_ADDRESS = process.env.SCHEMA_REGISTRY_ADDRESS || "0x4200000000000000000000000000000000000020";
  
  // USDC address on Base Sepolia (update with actual address)
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  // Platform wallet address (update with actual address)
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;

  // Deploy Credibles contract
  console.log("\n1. Deploying Credibles contract...");
  const Credibles = await ethers.getContractFactory("Credibles");
  const credibles = await Credibles.deploy(deployer.address);
  await credibles.waitForDeployment();
  const crediblesAddress = await credibles.getAddress();
  console.log("Credibles deployed to:", crediblesAddress);

  // Deploy AttestationResolver
  console.log("\n2. Deploying AttestationResolver...");
  const AttestationResolver = await ethers.getContractFactory("AttestationResolver");
  const attestationResolver = await AttestationResolver.deploy(
    EAS_ADDRESS,
    SCHEMA_REGISTRY_ADDRESS,
    crediblesAddress
  );
  await attestationResolver.waitForDeployment();
  const resolverAddress = await attestationResolver.getAddress();
  console.log("AttestationResolver deployed to:", resolverAddress);

  // Set AttestationResolver as authorized caller in Credibles
  console.log("\n3. Setting AttestationResolver in Credibles...");
  const setResolverTx = await credibles.setAttestationResolver(resolverAddress);
  await setResolverTx.wait();
  console.log("AttestationResolver set in Credibles");

  // Get schema UID from the resolver (it registers the schema in constructor)
  console.log("\n4. Getting schema UID from AttestationResolver...");
  await attestationResolver.waitForDeployment();
  
  // Wait a bit for the contract to be fully deployed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  let schemaUID: string;
  try {
    schemaUID = await attestationResolver.schemaUID();
    console.log("Schema UID:", schemaUID);
  } catch (error) {
    console.warn("Could not read schemaUID from contract:", error);
    schemaUID = "0x0000000000000000000000000000000000000000000000000000000000000000";
    console.warn("Schema UID could not be automatically retrieved. Please check the contract on BaseScan.");
  }

  // Deploy PaymentSplitter
  console.log("\n5. Deploying PaymentSplitter...");
  const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
  const paymentSplitter = await PaymentSplitter.deploy(
    USDC_ADDRESS,
    PLATFORM_WALLET,
    deployer.address
  );
  await paymentSplitter.waitForDeployment();
  const splitterAddress = await paymentSplitter.getAddress();
  console.log("PaymentSplitter deployed to:", splitterAddress);

  // Verify contracts on BaseScan (if API key is set)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n6. Verifying contracts on BaseScan...");
    try {
      console.log("Verifying Credibles...");
      await hre.run("verify:verify", {
        address: crediblesAddress,
        constructorArguments: [deployer.address],
      });
      
      console.log("Verifying AttestationResolver...");
      await hre.run("verify:verify", {
        address: resolverAddress,
        constructorArguments: [EAS_ADDRESS, SCHEMA_REGISTRY_ADDRESS, crediblesAddress],
      });
      
      console.log("Verifying PaymentSplitter...");
      await hre.run("verify:verify", {
        address: splitterAddress,
        constructorArguments: [USDC_ADDRESS, PLATFORM_WALLET, deployer.address],
      });
    } catch (error) {
      console.log("Verification failed (contracts may already be verified):", error);
    }
  } else {
    console.log("\n6. Skipping verification (BASESCAN_API_KEY not set)");
  }

  // Save deployment addresses to JSON file
  const deploymentInfo = {
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    contracts: {
      credibles: crediblesAddress,
      attestationResolver: resolverAddress,
      paymentSplitter: splitterAddress,
    },
    eas: {
      easAddress: EAS_ADDRESS,
      schemaRegistryAddress: SCHEMA_REGISTRY_ADDRESS,
      schemaUID: schemaUID,
      schema: schema,
    },
    usdc: USDC_ADDRESS,
    platformWallet: PLATFORM_WALLET,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n7. Deployment info saved to:", outputPath);

  // Also save to app/lib for frontend access
  const appLibPath = path.join(__dirname, "../../app/lib/deployments.json");
  const appLibDir = path.dirname(appLibPath);
  if (!fs.existsSync(appLibDir)) {
    fs.mkdirSync(appLibDir, { recursive: true });
  }
  fs.writeFileSync(appLibPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info also saved to:", appLibPath);

  console.log("\n✅ Deployment complete!");
  console.log("\nContract Addresses:");
  console.log("  Credibles:", crediblesAddress);
  console.log("  AttestationResolver:", resolverAddress);
  console.log("  PaymentSplitter:", splitterAddress);
  console.log("  Schema UID:", schemaUID);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

