"use client";

import Link from "next/link";
import { Github, Twitter, ExternalLink } from "lucide-react";
import { CONTRACTS } from "@/lib/contracts";
import { formatAddress } from "@/lib/utils";

const footerLinks = {
  product: [
    { label: "Checkout", href: "/checkout" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Docs", href: "/docs" },
  ],
  resources: [
    { label: "Zama FHEVM", href: "https://docs.zama.org/protocol", external: true },
    { label: "GitHub", href: "https://github.com/aruvi", external: true },
  ],
  contracts: [
    {
      label: "Gateway",
      href: `https://sepolia.etherscan.io/address/${CONTRACTS.GATEWAY}`,
      address: CONTRACTS.GATEWAY,
    },
    {
      label: "Wrapper",
      href: `https://sepolia.etherscan.io/address/${CONTRACTS.WRAPPER}`,
      address: CONTRACTS.WRAPPER,
    },
    {
      label: "Refund Manager",
      href: `https://sepolia.etherscan.io/address/${CONTRACTS.REFUND_MANAGER}`,
      address: CONTRACTS.REFUND_MANAGER,
    },
  ],
};

export function Footer() {
  return (
    <footer className="border-t-2 border-black dark:border-white bg-dark-50 dark:bg-dark-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-500 flex items-center justify-center">
                <span className="font-pixel text-white text-xs">M</span>
              </div>
              <span className="font-pixel text-sm uppercase tracking-wider">
                Aruvi
              </span>
            </div>
            <p className="font-sans text-sm text-dark-500 dark:text-dark-400">
              Stripe for confidential tokens. Accept private payments on any
              website.
            </p>
            <div className="flex gap-2">
              <a
                href="https://twitter.com/muthirai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-2 border-black dark:border-white hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/muthirai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-2 border-black dark:border-white hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-dark-500 dark:text-dark-400 hover:text-pink-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="font-sans text-sm text-dark-500 dark:text-dark-400 hover:text-pink-500 transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contracts */}
          <div>
            <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-4">
              Contracts (Sepolia)
            </h4>
            <ul className="space-y-2">
              {footerLinks.contracts.map((link) => (
                <li key={link.address}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-dark-500 dark:text-dark-400 hover:text-pink-500 transition-colors flex items-center gap-1"
                    suppressHydrationWarning
                  >
                    <span className="font-sans">{link.label}:</span>
                    <span suppressHydrationWarning>{formatAddress(link.address || "", 4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-dark-200 dark:border-dark-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-dark-500">
            © 2024 Aruvi. Powered by Zama FHEVM.
          </p>
          <p className="font-pixel text-[8px] uppercase tracking-wider text-pink-500">
            Privacy is a right, not a privilege
          </p>
        </div>
      </div>
    </footer>
  );
}
