'use client';
import { ReactNode, useEffect } from 'react';
import { baseSepolia } from 'wagmi/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@coinbase/onchainkit/styles.css';
import { initializeBaseAccountSDK } from './lib/baseAccount';
import { config } from '../wagmi'; 

const queryClient = new QueryClient();

export function RootProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize Base specific logic
    initializeBaseAccountSDK();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ""}
          chain={baseSepolia}
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}