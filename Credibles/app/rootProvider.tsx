'use client';
import { ReactNode, useEffect } from 'react';
import { baseSepolia } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import '@coinbase/onchainkit/styles.css';
import { initializeBaseAccountSDK } from './lib/baseAccount';

export function RootProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize Base Account SDK on mount
    initializeBaseAccountSDK();
  }, []);

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || "manually set in rootProvider.tsx i was having issues with the .env file"}
      chain={baseSepolia}
      rpcUrl={process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"}
      config={{
        appearance: {
          mode: 'auto',
        },
        wallet: {
          display: 'modal',
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}