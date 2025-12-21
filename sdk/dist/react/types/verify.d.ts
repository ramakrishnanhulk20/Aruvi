/**
 * Aruvi Payment Verification
 * Server-side utilities for verifying payments
 */
import type { VerificationResult } from './types';
export interface VerifyOptions {
    /**
     * Payment ID to verify
     */
    paymentId: `0x${string}`;
    /**
     * Expected merchant address
     */
    merchantAddress: `0x${string}`;
    /**
     * Expected amount (optional - for additional validation)
     */
    expectedAmount?: string;
    /**
     * Environment: 'testnet' or 'mainnet'
     */
    environment?: 'testnet' | 'mainnet';
    /**
     * Custom RPC URL
     */
    rpcUrl?: string;
}
/**
 * Verify a payment on the blockchain
 * Can be used server-side with any HTTP client
 */
export declare function verifyPayment(options: VerifyOptions): Promise<VerificationResult>;
/**
 * Verify payment by transaction hash
 */
export declare function verifyPaymentByTxHash(transactionHash: `0x${string}`, options: {
    merchantAddress: `0x${string}`;
    environment?: 'testnet' | 'mainnet';
    rpcUrl?: string;
}): Promise<VerificationResult>;
/**
 * Create a webhook signature for secure callbacks
 */
export declare function createWebhookSignature(payload: string, secret: string): string;
/**
 * Verify a webhook signature
 */
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
