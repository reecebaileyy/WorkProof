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

  try {
    console.log('Initializing Base Account SDK with chain:', baseSepolia.id);
    
    sdkInstance = createBaseAccountSDK({
      appName: 'Credibles',
      appLogoUrl: '/sphere.svg',
      appChainIds: [baseSepolia.id], // Only allow Base Sepolia
      subAccounts: {
        creation: 'on-connect', // Auto-create on first connect
        defaultAccount: 'sub', // Use sub-account by default
        funding: 'spend-permissions', // Auto-fund from universal account
      },
    });

    console.log('Base Account SDK initialized successfully');
    return sdkInstance;
  } catch (error) {
    console.error('Failed to initialize Base Account SDK:', error);
    throw error;
  }
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
    console.log('Getting resume wallet...');
    const sdk = initializeBaseAccountSDK();
    const subAccount = await sdk.subAccount.get();
    
    if (subAccount) {
      console.log('Found existing sub-account:', subAccount.address);
      return subAccount.address;
    }
    
    console.log('No sub-account found');
    // If no sub-account exists, return null
    // The 'on-connect' setting should auto-create, but we can also create manually
    return null;
  } catch (error) {
    console.error('Error getting resume wallet:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return null;
  }
}

/**
 * Create resume wallet (sub-account) manually
 */
export async function createResumeWallet(): Promise<string | null> {
  try {
    console.log('Starting resume wallet creation...');
    const sdk = initializeBaseAccountSDK();
    
    // Get the current account (universal account)
    const provider = sdk.getProvider();
    console.log('Got provider, fetching accounts...');
    const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
    
    if (accounts.length === 0) {
      console.error('No accounts connected');
      throw new Error('No account connected. Please connect your wallet first.');
    }

    console.log('Connected account:', accounts[0]);

    // Try to get existing sub-account first
    console.log('Checking for existing sub-account...');
    const existingSubAccount = await sdk.subAccount.get();
    if (existingSubAccount) {
      console.log('Found existing sub-account:', existingSubAccount.address);
      return existingSubAccount.address;
    }

    console.log('No existing sub-account found, creating new one...');
    
    // Create sub-account using the connected account
    // Note: The creation might fail if the SDK isn't properly initialized
    // or if the user hasn't approved the creation
    const subAccount = await sdk.subAccount.create({
      type: 'undeployed',
      account: accounts[0] as `0x${string}`,
    } as Parameters<typeof sdk.subAccount.create>[0]);

    console.log('Sub-account created successfully:', subAccount.address);
    return subAccount.address;
  } catch (error) {
    console.error('Error creating resume wallet - Full error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

