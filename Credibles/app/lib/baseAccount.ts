import { createBaseAccountSDK } from '@base-org/account';
import { baseSepolia } from 'viem/chains';

let sdkInstance: ReturnType<typeof createBaseAccountSDK> | null = null;

/**
 * Initialize Base Account SDK
 */
export function initializeBaseAccountSDK() {
  if (sdkInstance) {
    return sdkInstance;
  }

  sdkInstance = createBaseAccountSDK({
    appName: 'Credibles',
    appLogoUrl: '/sphere.svg',
    appChainIds: [baseSepolia.id],
    subAccounts: {
      creation: 'on-connect', // Auto-create on first connect
      defaultAccount: 'sub', // Use sub-account by default
      funding: 'spend-permissions', // Auto-fund from universal account
    },
  });

  return sdkInstance;
}

/**
 * Get Base Account provider
 */
export function getBaseAccountProvider() {
  const sdk = initializeBaseAccountSDK();
  return sdk.getProvider();
}

/**
 * Get or create resume wallet (sub-account)
 */
export async function getResumeWallet(): Promise<string | null> {
  try {
    const sdk = initializeBaseAccountSDK();
    const subAccount = await sdk.subAccount.get();
    
    if (subAccount) {
      return subAccount.address;
    }
    
    // If no sub-account exists, create one
    // This will be triggered on connect with 'on-connect' setting
    return null;
  } catch (error) {
    console.error('Error getting resume wallet:', error);
    return null;
  }
}

/**
 * Create resume wallet (sub-account) manually
 */
export async function createResumeWallet(): Promise<string | null> {
  try {
    const sdk = initializeBaseAccountSDK();
    
    // Get the current account (universal account)
    const provider = sdk.getProvider();
    const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
    
    if (accounts.length === 0) {
      throw new Error('No account connected');
    }

    // Try to get existing sub-account first
    const existingSubAccount = await sdk.subAccount.get();
    if (existingSubAccount) {
      return existingSubAccount.address;
    }

    // Create sub-account using the connected account
    // The SDK expects an account parameter that can be an address or account object
    const subAccount = await sdk.subAccount.create({
      type: 'undeployed',
      account: accounts[0] as `0x${string}`,
    } as Parameters<typeof sdk.subAccount.create>[0]);

    return subAccount.address;
  } catch (error) {
    console.error('Error creating resume wallet:', error);
    return null;
  }
}

