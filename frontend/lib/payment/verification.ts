/**
 * @fileoverview Payment Verification Service
 *
 * Core verification logic for Aruvi confidential payments.
 * Provides secure payment verification by:
 *
 * 1. Extracting transfer events directly from the blockchain (not trusting client data)
 * 2. Decrypting encrypted amounts using user-authorized decryption signatures
 * 3. Verifying that payments meet the required amounts
 */

import { ethers } from 'ethers';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/node';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/node';
import type {
  PaymentPayload,
  PaymentRequirement,
  VerifyResponse,
  DecryptionSignature,
  ConfidentialTransferEvent,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/**
 * ERC7984 ConfidentialTransfer event signature
 * Event: ConfidentialTransfer(address indexed from, address indexed to, euint64 indexed amount)
 *
 * The amount parameter is a bytes32 handle pointing to the encrypted value,
 * not the actual amount (which remains confidential on-chain).
 */
const CONFIDENTIAL_TRANSFER_EVENT = 'ConfidentialTransfer(address,address,bytes32)';

/** Keccak256 hash of the event signature for log filtering */
const CONFIDENTIAL_TRANSFER_TOPIC = ethers.id(CONFIDENTIAL_TRANSFER_EVENT);

// =============================================================================
// Network Configuration
// =============================================================================

const NETWORK_RPC_URLS: Record<string, string> = {
  'sepolia': process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.infura.io/v3/demo',
  'ethereum-sepolia': process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.infura.io/v3/demo',
};

function getRpcUrl(network: string): string | null {
  return NETWORK_RPC_URLS[network.toLowerCase()] || null;
}

// =============================================================================
// FHEVM Instance Management
// =============================================================================

/**
 * Cached FHEVM instance for server-side decryption operations.
 * Reused across requests to avoid expensive re-initialization.
 */
let fhevmInstance: FhevmInstance | null = null;

/**
 * Gets or creates the FHEVM instance for server-side decryption.
 */
async function getFhevmInstance(): Promise<FhevmInstance> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  console.log('[Aruvi] Creating FHEVM instance...');
  fhevmInstance = await createInstance(SepoliaConfig);
  console.log('[Aruvi] FHEVM instance created successfully');

  return fhevmInstance;
}

// =============================================================================
// Transaction Event Extraction
// =============================================================================

/**
 * Extracts ConfidentialTransfer event data from a transaction.
 *
 * This is a SECURITY-CRITICAL function because it ensures we get the
 * transfer data from the chain rather than trusting client-provided data.
 */
async function extractTransferFromTx(
  txHash: string,
  tokenAddress: string,
  rpcUrl: string
): Promise<ConfidentialTransferEvent | null> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Get transaction receipt from the blockchain
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    return null;
  }

  // Verify transaction was successful (status === 1 means success)
  if (receipt.status !== 1) {
    return null;
  }

  // Find ConfidentialTransfer event from the expected token contract
  // We filter by both contract address and event signature for security
  const transferLog = receipt.logs.find(
    (log) =>
      log.address.toLowerCase() === tokenAddress.toLowerCase() &&
      log.topics[0] === CONFIDENTIAL_TRANSFER_TOPIC
  );

  if (!transferLog) {
    return null;
  }

  // Decode indexed parameters from topics
  // Topic layout for ConfidentialTransfer:
  //   topics[0] = event signature hash
  //   topics[1] = from (indexed address, padded to 32 bytes)
  //   topics[2] = to (indexed address, padded to 32 bytes)
  //   topics[3] = amount handle (indexed bytes32)
  const from = ethers.getAddress('0x' + transferLog.topics[1]!.slice(26)) as `0x${string}`;
  const to = ethers.getAddress('0x' + transferLog.topics[2]!.slice(26)) as `0x${string}`;
  const handle = transferLog.topics[3]! as `0x${string}`;

  return { from, to, handle };
}

// =============================================================================
// FHE Decryption
// =============================================================================

/**
 * Decrypts an encrypted handle using the user's decryption signature.
 *
 * Security Notes:
 * - The decryption signature is generated client-side by the user's wallet
 * - It's scoped to specific contract addresses and has an expiration
 * - The actual decryption happens through ZAMA's secure relayer infrastructure
 */
async function decryptHandle(
  handle: string,
  decryptionSignature: DecryptionSignature,
  tokenAddress: string
): Promise<bigint | null> {
  try {
    console.log('[Aruvi] Decrypting handle...');
    console.log('[Aruvi] Handle:', handle);
    console.log('[Aruvi] Token address:', tokenAddress);
    console.log('[Aruvi] User address:', decryptionSignature.userAddress);

    const instance = await getFhevmInstance();

    // Call userDecrypt with the handle and decryption signature
    const decrypted = await instance.userDecrypt(
      [{ handle, contractAddress: tokenAddress }],
      decryptionSignature.privateKey,
      decryptionSignature.publicKey,
      decryptionSignature.signature,
      decryptionSignature.contractAddresses,
      decryptionSignature.userAddress,
      decryptionSignature.startTimestamp,
      decryptionSignature.durationDays
    );

    console.log('[Aruvi] Decryption result:', decrypted);

    // Handle key might be lowercased depending on the SDK version
    const handleKey = Object.keys(decrypted).find(
      (key) => key.toLowerCase() === handle.toLowerCase()
    );

    if (!handleKey) {
      console.error('[Aruvi] Handle not found in decryption result');
      return null;
    }

    const value = decrypted[handleKey as `0x${string}`];
    console.log('[Aruvi] Decrypted value:', value);

    // Convert the decrypted value to bigint
    if (typeof value === 'bigint') {
      return value;
    } else if (typeof value === 'string') {
      return BigInt(value);
    } else if (typeof value === 'boolean') {
      return BigInt(value ? 1 : 0);
    }

    return null;
  } catch (error) {
    console.error('[Aruvi] Decryption error:', error);
    throw error;
  }
}

// =============================================================================
// Payment Verification
// =============================================================================

/**
 * Verifies a confidential payment for Aruvi.
 *
 * SECURITY MODEL:
 * 1. Handle from chain: The encrypted amount handle is extracted from the
 *    blockchain event logs, NOT from client-provided data
 * 2. Sender verification: Confirms the transfer sender matches the
 *    decryption signature owner
 * 3. Recipient verification: Confirms the transfer was sent to the
 *    expected merchant address
 * 4. Server-side decryption: The actual amount is decrypted server-side
 *    using the user's authorization
 *
 * VERIFICATION STEPS:
 * 1. Get transaction receipt from chain
 * 2. Extract ConfidentialTransfer event (handle comes from chain, not client!)
 * 3. Verify transfer recipient matches payTo
 * 4. Verify sender matches the decryption signature user
 * 5. Verify token contract is authorized for decryption
 * 6. Decrypt the handle using decryption signature
 * 7. Verify decrypted amount >= required amount
 */
export async function verifyPayment(
  paymentPayload: PaymentPayload,
  requirement: Omit<PaymentRequirement, 'verifier'>
): Promise<VerifyResponse> {
  const { payload } = paymentPayload;

  try {
    // Get RPC URL for the network
    const rpcUrl = getRpcUrl(paymentPayload.network);
    if (!rpcUrl) {
      return {
        isValid: false,
        invalidReason: `Unsupported network: ${paymentPayload.network}`,
      };
    }

    // 1. Extract transfer event from transaction (SECURE - from chain)
    console.log('[Aruvi] Extracting transfer from tx:', payload.txHash);
    const transferData = await extractTransferFromTx(
      payload.txHash,
      requirement.asset,
      rpcUrl
    );

    if (!transferData) {
      return {
        isValid: false,
        invalidReason: 'Transaction not found or no ConfidentialTransfer event',
      };
    }

    console.log('[Aruvi] Transfer data extracted:', transferData);

    // 2. Verify recipient matches payTo
    if (transferData.to.toLowerCase() !== requirement.payTo.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: `Transfer recipient mismatch. Expected: ${requirement.payTo}, Got: ${transferData.to}`,
      };
    }

    // 3. Verify sender matches decryption signature user
    if (transferData.from.toLowerCase() !== payload.decryptionSignature.userAddress.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: `Transfer sender doesn't match decryption signature user`,
      };
    }

    // 4. Verify token contract is in the allowed contracts for decryption
    const tokenInAllowedContracts = payload.decryptionSignature.contractAddresses.some(
      (addr) => addr.toLowerCase() === requirement.asset.toLowerCase()
    );
    if (!tokenInAllowedContracts) {
      return {
        isValid: false,
        invalidReason: 'Token contract not in decryption signature allowed contracts',
      };
    }

    // 5. Decrypt the handle to get actual amount
    let decryptedAmount: bigint | null = null;
    try {
      decryptedAmount = await decryptHandle(
        transferData.handle,
        payload.decryptionSignature,
        requirement.asset
      );
    } catch (decryptError) {
      console.error('[Aruvi] Decryption failed:', decryptError);
      return {
        isValid: false,
        invalidReason: `FHE decryption failed: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`,
      };
    }

    if (decryptedAmount === null) {
      return {
        isValid: false,
        invalidReason: 'Failed to decrypt payment amount - decryption returned null',
      };
    }

    // 6. Verify amount meets requirement
    const requiredAmount = BigInt(requirement.maxAmountRequired);
    if (decryptedAmount < requiredAmount) {
      return {
        isValid: false,
        invalidReason: `Insufficient payment. Required: ${requiredAmount}, Got: ${decryptedAmount}`,
      };
    }

    // All checks passed
    console.log('[Aruvi] Payment verified successfully! Amount:', decryptedAmount.toString());
    return {
      isValid: true,
      txHash: payload.txHash,
      amount: decryptedAmount.toString(),
    };

  } catch (error) {
    console.error('[Aruvi] Verification error:', error);
    return {
      isValid: false,
      invalidReason: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}
