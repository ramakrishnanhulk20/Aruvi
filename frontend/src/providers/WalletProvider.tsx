'use client';

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Create query client
const queryClient = new QueryClient();

// Configure chains and wallet connectors from environment variables
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'cf5d11022a642e528f427d4210e992db';

// RPC endpoint from environment variable (falls back to public RPC)
const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

const config = getDefaultConfig({
  appName: 'Aruvi',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  ssr: false,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          appInfo={{
            appName: 'Aruvi',
            learnMoreUrl: 'https://aruvi.app/about',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
