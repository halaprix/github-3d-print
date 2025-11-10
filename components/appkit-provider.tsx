"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from '@reown/appkit/networks';
import { cookieStorage, createStorage } from '@wagmi/core';
import type { Config } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID'; // Get this from https://dashboard.reown.com

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  throw new Error('Project ID is not defined. Set NEXT_PUBLIC_REOWN_PROJECT_ID in your environment variables.');
}

// Set up metadata
const metadata = {
  name: 'GridGit',
  description: 'GitHub Contribution NFTs',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://gridgit.halaprix.com',
  icons: ['https://gridgit.halaprix.com/icon.svg']
};

// Set up the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  networks: [base],
  projectId
});

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base],
  defaultNetwork: base,
  metadata: metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
});

const queryClient = new QueryClient();

export function AppKitProvider({ 
  children,
  cookies 
}: { 
  children: React.ReactNode;
  cookies?: string | null;
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

