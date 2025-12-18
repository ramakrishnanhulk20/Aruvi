"use client";

import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { config } from "@/lib/wagmi";
import { FhevmProvider } from "@/hooks/useFhevm";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Custom RainbowKit theme to match Aruvi's pixel aesthetic
const aruviLightTheme = lightTheme({
  accentColor: "#FF6B8A",
  accentColorForeground: "white",
  borderRadius: "none",
  fontStack: "system",
});

const aruviDarkTheme = darkTheme({
  accentColor: "#FF6B8A",
  accentColorForeground: "white",
  borderRadius: "none",
  fontStack: "system",
  overlayBlur: "small",
});

function RainbowKitWrapper({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always wrap in RainbowKitProvider to ensure hooks work
  // Just use a default theme until mounted
  return (
    <RainbowKitProvider
      theme={mounted && resolvedTheme === "dark" ? aruviDarkTheme : aruviLightTheme}
      modalSize="compact"
      appInfo={{
        appName: "Aruvi",
        learnMoreUrl: "https://aruvi.xyz/docs",
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWrapper>
            <FhevmProvider>{children}</FhevmProvider>
          </RainbowKitWrapper>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              className: "toast-pixel",
              style: {
                background: "var(--toast-bg, #fff)",
                color: "var(--toast-color, #121218)",
                border: "2px solid #000",
                borderRadius: "0",
                boxShadow: "4px 4px 0 0 rgba(0,0,0,0.2)",
                fontFamily: '"Press Start 2P", cursive',
                fontSize: "10px",
                padding: "16px",
              },
              success: {
                iconTheme: {
                  primary: "#FF6B8A",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#FFE500",
                  secondary: "#121218",
                },
              },
            }}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
