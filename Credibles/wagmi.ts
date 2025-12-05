// wagmi.ts
import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia], // This explicitly tells hooks that this chain is valid
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    coinbaseWallet({
      appName: 'Credibles',
      preference: 'smartWalletOnly', // Force smart wallet which respects chain config
      version: '4',
      chainId: baseSepolia.id, // Explicitly set default chain to Base Sepolia
    }),
  ],
  ssr: true,
});