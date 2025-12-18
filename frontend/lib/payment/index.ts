/**
 * @fileoverview Payment Module Barrel Export
 *
 * Re-exports all payment-related utilities and types.
 */

// Types
export type {
  PaymentRequirement,
  DecryptionSignature,
  PaymentPayload,
  PaymentVerifyResult,
  ConfidentialTransferEvent,
} from './types';

// Verification
export { verifyPayment } from './verification';

// Middleware
export {
  requirePayment,
  createPaymentRequiredResponse,
  extractPaymentFromHeader,
  verifyPaymentWithService,
} from './middleware';

// Decryption Signatures
export {
  createDecryptionSignature,
  createShortLivedSignature,
  isSignatureValid,
  getSignatureExpiry,
  saveSignatureToStorage,
  loadSignatureFromStorage,
  removeSignatureFromStorage,
  loadOrCreateSignature,
} from './decryptionSignature';
