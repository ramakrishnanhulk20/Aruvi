/**
 * @fileoverview Aruvi Payment Type Definitions
 *
 * Defines TypeScript interfaces for secure confidential payment verification.
 * These types support server-side extraction and decryption of payment amounts.
 */

// =============================================================================
// Payment Requirement
// =============================================================================

/**
 * Payment requirements returned by server in 402 response.
 * Included in the `X-Accept-Payment` header.
 */
export interface PaymentRequirement {
  /** Payment scheme - always 'confidential-transfer' for FHE payments */
  scheme: 'confidential-transfer';
  /** Network name (e.g., 'ethereum-sepolia') */
  network: string;
  /** Blockchain chain ID */
  chainId: number;
  /** Merchant address to receive the payment */
  payTo: `0x${string}`;
  /** Required amount in token decimals (e.g., "1000000" for 1 cUSDC) */
  maxAmountRequired: string;
  /** Confidential token contract address */
  asset: `0x${string}`;
  /** URL of the protected resource */
  resource: string;
  /** Human-readable description of the payment */
  description: string;
  /** MIME type of the protected resource */
  mimeType: string;
  /** Maximum time in seconds for payment completion */
  maxTimeoutSeconds: number;
  /** URL of the verification service */
  verifier?: string;
}

// =============================================================================
// Decryption Signature
// =============================================================================

/**
 * User authorization for server-side FHE decryption.
 *
 * This signature allows the server to decrypt encrypted values on behalf
 * of the user. Generated client-side when the user makes a payment.
 *
 * SECURITY NOTES:
 * - The `privateKey` is an EPHEMERAL key, NOT the user's wallet private key
 * - The signature is scoped to specific contract addresses
 * - It has a limited validity period (durationDays)
 */
export interface DecryptionSignature {
  /** User's wallet signature authorizing decryption */
  signature: string;
  /** Ephemeral public key for the operation */
  publicKey: string;
  /** Ephemeral private key (NOT the wallet key!) */
  privateKey: string;
  /** User's Ethereum address */
  userAddress: `0x${string}`;
  /** Contracts authorized for decryption */
  contractAddresses: `0x${string}`[];
  /** When authorization starts (Unix timestamp) */
  startTimestamp: number;
  /** How long authorization is valid */
  durationDays: number;
}

// =============================================================================
// Payment Payload
// =============================================================================

/**
 * Payment payload sent to server after making a confidential transfer.
 *
 * SECURITY MODEL:
 * The payload intentionally does NOT include:
 * - The encrypted handle (server extracts from chain)
 * - The cleartext amount (server decrypts it)
 *
 * This prevents clients from lying about payment amounts.
 */
export interface PaymentPayload {
  /** Protocol version - always 1 */
  version: 1;
  /** Payment scheme identifier */
  scheme: 'confidential-transfer';
  /** Network where payment was made */
  network: string;
  /** Chain ID of the network */
  chainId: number;
  /** Payment data */
  payload: {
    /** Transaction hash of the confidentialTransfer (server looks up on-chain) */
    txHash: `0x${string}`;
    /** User's decryption authorization for server-side verification */
    decryptionSignature: DecryptionSignature;
  };
}

// =============================================================================
// Verification Results
// =============================================================================

/**
 * Result of payment verification from the server.
 */
export interface PaymentVerifyResult {
  /** Whether the payment passed all verification checks */
  isValid: boolean;
  /** Human-readable reason if payment is invalid */
  invalidReason?: string;
  /** Transaction hash of the verified payment */
  txHash?: `0x${string}`;
  /** Decrypted amount (verified by server, not client-provided) */
  amount?: string;
}

// =============================================================================
// Verify Request/Response
// =============================================================================

/**
 * Request body for POST /api/payment/verify
 */
export interface VerifyRequest {
  /** Protocol version */
  version: 1;
  /** Payment payload from the client */
  paymentPayload: PaymentPayload;
  /** Payment requirements for the resource */
  paymentRequirements: Omit<PaymentRequirement, 'verifier'>;
}

/**
 * Response from POST /api/payment/verify
 */
export interface VerifyResponse {
  /** Whether the payment passed all verification checks */
  isValid: boolean;
  /** Human-readable reason if payment is invalid */
  invalidReason?: string;
  /** Transaction hash of the verified payment */
  txHash?: string;
  /** Decrypted payment amount (verified by server, not client-provided) */
  amount?: string;
}

// =============================================================================
// Transfer Event Data
// =============================================================================

/**
 * Data extracted from a ConfidentialTransfer event on-chain.
 */
export interface ConfidentialTransferEvent {
  /** Sender address */
  from: `0x${string}`;
  /** Recipient address */
  to: `0x${string}`;
  /** Encrypted amount handle (bytes32, NOT the actual amount) */
  handle: `0x${string}`;
}
