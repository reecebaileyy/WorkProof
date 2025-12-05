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

  // Deploy CrediblesV2 contract
  console.log("\n1. Deploying CrediblesV2 contract...");
  const CrediblesV2 = await ethers.getContractFactory("CrediblesV2");
  const crediblesV2 = await CrediblesV2.deploy(deployer.address);
  await crediblesV2.waitForDeployment();
  const crediblesV2Address = await crediblesV2.getAddress();
  console.log("CrediblesV2 deployed to:", crediblesV2Address);

  // Deploy AttestationNFT first (needed for AttestationResolver)
  console.log("\n2. Deploying AttestationNFT...");
  const AttestationNFT = await ethers.getContractFactory("AttestationNFT");
  const attestationNFT = await AttestationNFT.deploy(
    deployer.address,
    crediblesV2Address
  );
  await attestationNFT.waitForDeployment();
  const attestationNFTAddress = await attestationNFT.getAddress();
  console.log("AttestationNFT deployed to:", attestationNFTAddress);

  // Deploy AttestationResolver
  console.log("\n3. Deploying AttestationResolver...");
  const AttestationResolver = await ethers.getContractFactory("AttestationResolver");
  const attestationResolver = await AttestationResolver.deploy(
    EAS_ADDRESS,
    SCHEMA_REGISTRY_ADDRESS,
    crediblesV2Address,
    attestationNFTAddress,
    deployer.address
  );
  await attestationResolver.waitForDeployment();
  const resolverAddress = await attestationResolver.getAddress();
  console.log("AttestationResolver deployed to:", resolverAddress);
  
  // Set AttestationResolver in AttestationNFT
  console.log("\n4. Setting AttestationResolver in AttestationNFT...");
  const setResolverTx = await attestationNFT.setAttestationResolver(resolverAddress);
  await setResolverTx.wait();
  console.log("AttestationResolver set in AttestationNFT");

  // Set AttestationResolver as authorized caller in CrediblesV2
  console.log("\n5. Setting AttestationResolver in CrediblesV2...");
  const setResolverInCrediblesTx = await crediblesV2.setAttestationResolver(resolverAddress);
  await setResolverInCrediblesTx.wait();
  console.log("AttestationResolver set in CrediblesV2");

  // Get schema UID from the resolver (it registers the schema in constructor)
  console.log("\n6. Getting schema UID from AttestationResolver...");
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
  console.log("\n7. Deploying PaymentSplitter...");
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
    console.log("\n8. Verifying contracts on BaseScan...");
    try {
      console.log("Verifying CrediblesV2...");
      await hre.run("verify:verify", {
        address: crediblesV2Address,
        constructorArguments: [deployer.address],
      });
      
      console.log("Verifying AttestationNFT...");
      await hre.run("verify:verify", {
        address: attestationNFTAddress,
        constructorArguments: [deployer.address, crediblesV2Address],
      });
      
      console.log("Verifying AttestationResolver...");
      await hre.run("verify:verify", {
        address: resolverAddress,
        constructorArguments: [EAS_ADDRESS, SCHEMA_REGISTRY_ADDRESS, crediblesV2Address, attestationNFTAddress, deployer.address],
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
    console.log("\n8. Skipping verification (BASESCAN_API_KEY not set)");
  }

  // Save deployment addresses to JSON file
  const schema = "uint256 studentId, string category, uint256 xpValue, string title, string issuerInfo";
  const deploymentInfo = {
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    contracts: {
      crediblesV2: crediblesV2Address,
      attestationResolver: resolverAddress,
      attestationNFT: attestationNFTAddress,
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
  console.log("\n9. Deployment info saved to:", outputPath);

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
  console.log("  CrediblesV2:", crediblesV2Address);
  console.log("  AttestationResolver:", resolverAddress);
  console.log("  AttestationNFT:", attestationNFTAddress);
  console.log("  PaymentSplitter:", splitterAddress);
  console.log("  Schema UID:", schemaUID);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

