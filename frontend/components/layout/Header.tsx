"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { motion } from "framer-motion";
import { Menu, X, Wallet, LayoutDashboard, CreditCard, Home, Shield, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggleMinimal } from "@/components/ui/ThemeToggle";
import { CONTRACTS, GATEWAY_ABI } from "@/lib/contracts";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/checkout", label: "Pay", icon: CreditCard },
  { href: "/donations", label: "Donate", icon: Heart },
  { href: "/tokens", label: "Tokens", icon: Wallet },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected, address, chain } = useAccount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if connected wallet is the gateway owner
  const { data: gatewayOwner, isError, error, isLoading } = useReadContract({
    address: CONTRACTS.GATEWAY as `0x${string}`,
    abi: GATEWAY_ABI,
    functionName: "owner",
    query: { enabled: !!address },
  });

  const isOwner: boolean = Boolean(
    address && gatewayOwner && 
    address.toLowerCase() === (gatewayOwner as string).toLowerCase()
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-black dark:border-white bg-white/95 dark:bg-dark-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-dark-900/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
              className="w-8 h-8 bg-pink-500 flex items-center justify-center"
            >
              <span className="font-pixel text-white text-xs">A</span>
            </motion.div>
            <span
              className="font-pixel text-sm uppercase tracking-wider hidden sm:block glitch"
              data-text="Aruvi"
            >
              Aruvi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 font-pixel text-[10px] uppercase tracking-wider",
                    "border-2 border-transparent transition-all duration-150",
                    "hover:border-pink-500 hover:text-pink-500",
                    isActive && "bg-pink-500 text-white border-pink-500"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <link.icon className="w-3 h-3" />
                    {link.label}
                  </span>
                </Link>
              );
            })}
            
            {/* Admin link - only show for gateway owner */}
            {isOwner && (
              <Link
                href="/admin"
                className={cn(
                  "px-4 py-2 font-pixel text-[10px] uppercase tracking-wider",
                  "border-2 border-transparent transition-all duration-150",
                  "hover:border-yellow-500 hover:text-yellow-500",
                  pathname === "/admin" && "bg-yellow-500 text-black border-yellow-500"
                )}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <ThemeToggleMinimal />

            {/* RainbowKit Connect Button - Custom styled */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="btn-pixel-primary flex items-center gap-2"
                          >
                            <Wallet className="w-3 h-3" />
                            <span className="hidden sm:inline">Connect</span>
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="btn-pixel bg-red-500 text-white border-black"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            className="hidden sm:flex items-center gap-1 px-3 py-2 border-2 border-black dark:border-white font-mono text-xs hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                src={chain.iconUrl}
                                alt={chain.name ?? "Chain"}
                                className="w-4 h-4"
                              />
                            )}
                            {chain.name}
                          </button>
                          <button
                            onClick={openAccountModal}
                            className="btn-pixel-primary flex items-center gap-2"
                          >
                            <span className="font-mono">
                              {account.displayName}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 border-2 border-black dark:border-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{
          height: isMobileMenuOpen ? "auto" : 0,
          opacity: isMobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="md:hidden overflow-hidden border-t-2 border-black dark:border-white"
      >
        <nav className="container mx-auto px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 font-pixel text-[10px] uppercase tracking-wider",
                  "border-2 border-black dark:border-white transition-all duration-150",
                  isActive
                    ? "bg-pink-500 text-white"
                    : "hover:bg-pink-100 dark:hover:bg-pink-900/30"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          
          {/* Admin link - mobile - only for owner */}
          {isOwner && (
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 font-pixel text-[10px] uppercase tracking-wider",
                "border-2 border-black dark:border-white transition-all duration-150",
                pathname === "/admin"
                  ? "bg-yellow-500 text-black"
                  : "hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
              )}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>
      </motion.div>
    </header>
  );
}
