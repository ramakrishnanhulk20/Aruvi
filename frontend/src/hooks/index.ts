/**
 * Hooks Index
 * Re-exports all custom hooks for easy importing
 */

// Core fhEVM hooks
export { useFhevm } from '../providers/useFhevmContext';
export { useFhevmEncrypt } from './useFhevmEncrypt';
export { useFhevmDecrypt } from './useFhevmDecrypt';

// Token hooks
export { useConfidentialToken } from './useConfidentialToken';

// Simple P2P transfer (recommended for basic sends - no operator approval needed!)
export { useSimpleTransfer } from './useSimpleTransfer';

// Main Aruvi payment gateway hook (for advanced features: requests, subscriptions, refunds)
export { useAruviGateway } from './useAruviGateway';

// Transaction history hook
export { useTransactionHistory } from './useTransactionHistory';

// Legacy hook (deprecated - use useAruviGateway instead)
export { usePaymentGateway } from './usePaymentGateway';

// Types
export type { EncryptedAmount } from './useFhevmEncrypt';
export type { HandleContractPair } from './useFhevmDecrypt';
export type { TransferResult } from './useSimpleTransfer';
export type { Transaction } from './useTransactionHistory';
export type { 
  SendParams,
  MultiSendParams,
  RequestParams,
  SubscriptionParams,
  PaymentInfo,
  RequestInfo,
  SubscriptionInfo,
  TransactionResult,
} from './useAruviGateway';
