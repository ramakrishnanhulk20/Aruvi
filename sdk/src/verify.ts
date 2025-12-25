/**
 * Aruvi Payment Verification
 * Server-side utilities for verifying payments
 */

import type { VerificationResult, PaymentResult } from './types';
import { CONTRACTS, PAYMENT_GATEWAY_ABI } from './constants';

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
export async function verifyPayment(options: VerifyOptions): Promise<VerificationResult> {
  const env = options.environment || 'testnet';
  const rpcUrl = options.rpcUrl || CONTRACTS[env].rpcUrl;
  const contractAddress = CONTRACTS[env].PaymentGateway;

  try {
    // Encode the function call for getPaymentInfo(bytes32 paymentId)
    // Function selector: keccak256("getPaymentInfo(bytes32)").slice(0, 10)
    const functionSelector = '0xc6610657'; // getPaymentInfo(bytes32)
    const encodedPaymentId = options.paymentId.slice(2).padStart(64, '0');
    const data = functionSelector + encodedPaymentId;

    // Make RPC call
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: data,
          },
          'latest',
        ],
      }),
    });

    const result = await response.json();

    if (result.error) {
      return {
        verified: false,
        error: result.error.message || 'RPC error',
      };
    }

    // Decode the result
    const decoded = decodePaymentResult(result.result);

    if (!decoded) {
      return {
        verified: false,
        error: 'Payment not found',
      };
    }

    // Validate merchant address
    if (decoded.recipient.toLowerCase() !== options.merchantAddress.toLowerCase()) {
      return {
        verified: false,
        error: 'Merchant address mismatch',
      };
    }

    // Check if payment was refunded
    if (decoded.isRefunded) {
      return {
        verified: false,
        error: 'Payment was refunded',
      };
    }

    // Note: Amount is encrypted on-chain, so we cannot verify it here
    // The amount validation must be done through other means if needed

    const payment: PaymentResult = {
      success: true,
      paymentId: options.paymentId,
      transactionHash: '0x' as `0x${string}`, // Would need additional lookup
      amount: '0', // Amount is encrypted - cannot be read from chain
      customerAddress: decoded.sender as `0x${string}`,
      merchantAddress: decoded.recipient as `0x${string}`,
      blockNumber: 0, // Would need additional lookup
      timestamp: decoded.timestamp,
    };

    return {
      verified: true,
      payment,
    };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Decode payment result from RPC response
 * Returns: (address sender, address recipient, address token, uint256 timestamp, bool isRefunded)
 */
function decodePaymentResult(hexData: string): {
  sender: string;
  recipient: string;
  token: string;
  timestamp: number;
  isRefunded: boolean;
} | null {
  if (!hexData || hexData === '0x' || hexData.length < 66) {
    return null;
  }

  // Remove '0x' prefix
  const data = hexData.slice(2);

  // Decode: (address sender, address recipient, address token, uint256 timestamp, bool isRefunded)
  const sender = '0x' + data.slice(24, 64);
  const recipient = '0x' + data.slice(88, 128);
  const token = '0x' + data.slice(152, 192);
  const timestamp = parseInt(data.slice(192, 256), 16);
  const isRefunded = parseInt(data.slice(256, 320), 16) !== 0;

  // Check if payment exists (sender should not be zero address)
  if (sender === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  return { sender, recipient, token, timestamp, isRefunded };
}

/**
 * Parse units (like ethers.parseUnits)
 */
function parseUnits(value: string, decimals: number): bigint {
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Format units (like ethers.formatUnits)
 */
function formatUnits(value: bigint, decimals: number): string {
  const str = value.toString().padStart(decimals + 1, '0');
  const whole = str.slice(0, -decimals) || '0';
  const fraction = str.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * Verify payment by transaction hash
 */
export async function verifyPaymentByTxHash(
  transactionHash: `0x${string}`,
  options: {
    merchantAddress: `0x${string}`;
    environment?: 'testnet' | 'mainnet';
    rpcUrl?: string;
  }
): Promise<VerificationResult> {
  const env = options.environment || 'testnet';
  const rpcUrl = options.rpcUrl || CONTRACTS[env].rpcUrl;

  try {
    // Get transaction receipt
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
      }),
    });

    const receiptResult = await receiptResponse.json();

    if (receiptResult.error || !receiptResult.result) {
      return {
        verified: false,
        error: 'Transaction not found',
      };
    }

    const receipt = receiptResult.result;

    // Check transaction status
    if (receipt.status !== '0x1') {
      return {
        verified: false,
        error: 'Transaction failed',
      };
    }

    // Look for PaymentSent event
    // PaymentSent(bytes32 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount)
    const paymentSentTopic = '0x' + 'PaymentSent(bytes32,address,address,uint256)'
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '')
      .padEnd(64, '0'); // Simplified - in production, use proper keccak256

    const paymentLog = receipt.logs?.find((log: any) => 
      log.address.toLowerCase() === CONTRACTS[env].PaymentGateway.toLowerCase()
    );

    if (!paymentLog) {
      return {
        verified: false,
        error: 'Payment event not found in transaction',
      };
    }

    // Extract payment details from log
    const paymentId = paymentLog.topics[1] as `0x${string}`;
    const sender = ('0x' + paymentLog.topics[2].slice(26)) as `0x${string}`;
    const recipient = ('0x' + paymentLog.topics[3].slice(26)) as `0x${string}`;
    const amount = BigInt(paymentLog.data);

    // Validate merchant
    if (recipient.toLowerCase() !== options.merchantAddress.toLowerCase()) {
      return {
        verified: false,
        error: 'Merchant address mismatch',
      };
    }

    const payment: PaymentResult = {
      success: true,
      paymentId,
      transactionHash,
      amount: formatUnits(amount, 6),
      customerAddress: sender,
      merchantAddress: recipient,
      blockNumber: parseInt(receipt.blockNumber, 16),
      timestamp: Date.now(),
    };

    return {
      verified: true,
      payment,
    };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Create a webhook signature for secure callbacks
 */
export function createWebhookSignature(
  payload: string,
  secret: string
): string {
  // In production, use proper HMAC-SHA256
  // This is a placeholder - actual implementation would use crypto library
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  return 'sha256=' + Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return signature === expectedSignature;
}
