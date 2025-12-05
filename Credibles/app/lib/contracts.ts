import { Address } from "viem";

// Contract addresses (will be populated after deployment)
// These should be loaded from deployments.json or environment variables
// Note: Use NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS for CrediblesV2 (with all features)
//       Use NEXT_PUBLIC_CREDIBLES_ADDRESS as fallback for simpler Credibles contract
export const CONTRACT_ADDRESSES = {
  CREDIBLES_V2: (process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS || 
                  process.env.NEXT_PUBLIC_CREDIBLES_ADDRESS || 
                  "0x0000000000000000000000000000000000000000") as Address,
  CREDIBLES: (process.env.NEXT_PUBLIC_CREDIBLES_ADDRESS || "0x0000000000000000000000000000000000000000") as Address,
  ATTESTATION_RESOLVER: (process.env.NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS || "0x0000000000000000000000000000000000000000") as Address,
  PAYMENT_SPLITTER: (process.env.NEXT_PUBLIC_PAYMENT_SPLITTER_ADDRESS || "0x0000000000000000000000000000000000000000") as Address,
};

// EAS Contract Addresses (Base Sepolia)
export const EAS_ADDRESSES = {
  EAS: "0x4200000000000000000000000000000000000021" as Address,
  SCHEMA_REGISTRY: "0x4200000000000000000000000000000000000020" as Address,
};

// USDC address on Base Sepolia
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address;

// Credibles ABI (minimal for frontend interactions)
export const CREDIBLES_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "characterStats",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "dev", type: "uint256" },
          { internalType: "uint256", name: "defi", type: "uint256" },
          { internalType: "uint256", name: "gov", type: "uint256" },
          { internalType: "uint256", name: "social", type: "uint256" },
        ],
        internalType: "struct Credibles.Stats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "levels",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PaymentSplitter ABI
export const PAYMENT_SPLITTER_ABI = [
  {
    inputs: [{ internalType: "address", name: "student", type: "address" }],
    name: "getStudentBalance",
    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawStudent",
    outputs: [],
    stateMutability: "nonReentrant",
    type: "function",
  },
] as const;

/**
 * Load deployment info from JSON file
 * This will be populated after contract deployment
 */
export async function loadDeploymentInfo() {
  try {
    const response = await fetch("/lib/deployments.json");
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.warn("Could not load deployment info:", error);
  }
  return null;
}

