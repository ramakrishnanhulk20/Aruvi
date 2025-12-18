import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format address for display
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format amount from smallest unit (cents) to display
export function formatAmount(
  amount: bigint | number,
  decimals = 6,
  currency = "USD"
): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format raw token amount
export function formatTokenAmount(
  amount: bigint | number,
  decimals = 6,
  symbol = "cUSDC"
): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${symbol}`;
}

// Parse display amount to smallest unit
export function parseAmount(amount: string, decimals = 6): bigint {
  const cleaned = amount.replace(/[^0-9.]/g, "");
  const [whole, fraction = ""] = cleaned.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

// Get month bucket from timestamp (for merchant totals)
export function getMonthBucket(timestamp: number = Date.now()): number {
  return Math.floor(timestamp / 1000 / 2592000);
}

// Format timestamp to readable date
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Delay helper for animations
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate random glitch offset
export function randomGlitch(): { x: number; y: number } {
  return {
    x: (Math.random() - 0.5) * 4,
    y: (Math.random() - 0.5) * 4,
  };
}
