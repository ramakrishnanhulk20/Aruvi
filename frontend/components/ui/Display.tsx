"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { formatAddress, cn } from "@/lib/utils";
import { Tooltip } from "./Badge";

interface AddressDisplayProps {
  address: string;
  truncateLength?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  truncateLength = 4,
  showCopy = true,
  showExplorer = true,
  className = "",
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `https://sepolia.etherscan.io/address/${address}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Tooltip content={address}>
        <span className="font-mono text-sm">
          {formatAddress(address, truncateLength)}
        </span>
      </Tooltip>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-dark-500" />
          )}
        </button>
      )}

      {showExplorer && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-dark-500" />
        </a>
      )}
    </div>
  );
}

interface TransactionLinkProps {
  hash: string;
  label?: string;
  className?: string;
}

export function TransactionLink({
  hash,
  label = "View transaction",
  className = "",
}: TransactionLinkProps) {
  const explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-pink-500 hover:text-pink-600 transition-colors font-mono text-sm",
        className
      )}
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className = "",
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-2 border-black dark:border-white", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-dark-50 dark:bg-dark-900 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
      >
        <span className="font-pixel text-xs uppercase tracking-wider">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-3 border-t-2 border-black dark:border-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface EncryptedValueProps {
  isDecrypted: boolean;
  decryptedValue?: string | number;
  onDecrypt?: () => void;
  isDecrypting?: boolean;
  className?: string;
}

export function EncryptedValue({
  isDecrypted,
  decryptedValue,
  onDecrypt,
  isDecrypting = false,
  className = "",
}: EncryptedValueProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {isDecrypted ? (
        <span className="font-mono">{decryptedValue}</span>
      ) : (
        <>
          <span className="font-mono text-dark-400 blur-sm select-none">
            ●●●●●●
          </span>
          {onDecrypt && (
            <button
              onClick={onDecrypt}
              disabled={isDecrypting}
              className="text-xs text-pink-500 hover:text-pink-600 font-pixel uppercase tracking-wider disabled:opacity-50"
            >
              {isDecrypting ? "..." : "Decrypt"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

interface TokenAmountProps {
  amount: string | number;
  symbol?: string;
  decimals?: number;
  className?: string;
}

export function TokenAmount({
  amount,
  symbol = "cUSDC",
  decimals = 6,
  className = "",
}: TokenAmountProps) {
  // Format amount from smallest unit to display unit
  const displayAmount = typeof amount === "string" 
    ? parseFloat(amount) / Math.pow(10, decimals)
    : amount / Math.pow(10, decimals);

  return (
    <span className={cn("font-mono", className)}>
      {displayAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
      <span className="text-dark-500">{symbol}</span>
    </span>
  );
}
