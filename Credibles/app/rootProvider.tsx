'use client';
import { ReactNode, useEffect, useState } from 'react';
import { baseSepolia } from 'wagmi/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@coinbase/onchainkit/styles.css';
import { initializeBaseAccountSDK } from './lib/baseAccount';
import { config } from '../wagmi'; 
import sdk from '@farcaster/frame-sdk'; // <--- 1. IMPORT THIS

export function RootProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isSDKLoaded, setIsSDKLoaded] = useState(false); // <--- 2. Add state to track loading

  useEffect(() => {
    // Initialize Base specific logic
    initializeBaseAccountSDK();

    // 3. Initialize Farcaster Frame logic
    const load = async () => {
      const context = await sdk.context;
      sdk.actions.ready(); // <--- THIS FIXES THE "NOT READY" ERROR
    };

    // Load SDK only once
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

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