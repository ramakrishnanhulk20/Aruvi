"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Lock, ArrowRight, Home } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";

export default function LoginPage() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated, isAuthenticating, login } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Don't auto-redirect - causes refresh loop with persisted state
  // Only redirect after successful login in handleLogin

  const handleLogin = async () => {
    if (hasRedirected.current) {
      return;
    }
    
    const token = await login();
    
    if (token) {
      hasRedirected.current = true;
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 p-4">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="w-3 h-3 mr-1" />
            Home
          </Button>
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-pink-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle>
              <span className="glitch" data-text="Merchant Login">
                Merchant Login
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-4">
                <p className="font-sans text-sm text-dark-500 dark:text-dark-400 mb-4">
                  Connect your wallet to access the merchant dashboard
                </p>
                {/* RainbowKit ConnectButton would go here */}
                <Button variant="primary" onClick={() => {}}>
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-dark-50 dark:bg-dark-900 border-2 border-black dark:border-white">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm text-dark-500">
                      Connected Wallet
                    </span>
                    <span className="font-mono text-sm">
                      {formatAddress(address || "", 6)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500">
                  <div className="flex gap-3">
                    <Lock className="w-5 h-5 flex-shrink-0 text-accent-600" />
                    <p className="font-sans text-xs text-accent-600 dark:text-accent-400">
                      You'll be asked to sign a message to verify wallet
                      ownership. This doesn't cost any gas.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleLogin}
                  isLoading={isAuthenticating}
                  glitch
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-3">
          <p className="font-mono text-xs text-dark-500">
            Secure authentication via EIP-712 signature
          </p>
          <div className="text-sm text-muted-foreground">
            Not a merchant yet?{" "}
            <button
              onClick={() => (window.location.href = "/register")}
              className="text-pink-500 hover:text-pink-600 font-semibold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
