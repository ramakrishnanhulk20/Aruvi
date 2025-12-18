"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

// Custom Sepolia chain with better RPC
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org",
      ],
    },
    public: {
      http: ["https://rpc.sepolia.org"],
    },
  },
};

export const config = getDefaultConfig({
  appName: "Aruvi",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [customSepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
  },
  ssr: true,
});

// Export chain for use elsewhere
export { customSepolia as sepolia };
