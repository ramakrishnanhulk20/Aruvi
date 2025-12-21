import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format wallet address
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format token amount with decimals
export function formatAmount(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.slice(0, 2); // Show 2 decimal places
  
  return `${integerPart.toLocaleString()}.${trimmedFractional}`;
}

// Parse amount string to bigint
export function parseAmount(amount: string, decimals = 6): bigint {
  const [integer, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFraction);
}

// Format currency (USD-style)
export function formatCurrency(amount: bigint, decimals = 6): string {
  return `$${formatAmount(amount, decimals)}`;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Generate payment link
export function generatePaymentLink(
  merchant: string,
  amount?: string,
  orderId?: string
): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  params.set('merchant', merchant);
  if (amount) params.set('amount', amount);
  if (orderId) params.set('orderId', orderId);
  return `${baseUrl}/pay?${params.toString()}`;
}

// Delay utility
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check if valid Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
