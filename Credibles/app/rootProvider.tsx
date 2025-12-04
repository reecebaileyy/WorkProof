'use client';
import { ReactNode } from 'react';
import { baseSepolia } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import '@coinbase/onchainkit/styles.css';

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={"xxx"}
      chain={baseSepolia}
      rpcUrl="xxx"
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