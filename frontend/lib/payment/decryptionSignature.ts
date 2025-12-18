/**
 * @fileoverview Decryption Signature Utilities
 *
 * Provides utilities for creating and managing decryption signatures
 * that authorize server-side FHE decryption.
 */

import { ethers } from 'ethers';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk';
import type { DecryptionSignature } from './types';

// =============================================================================
// Types
// =============================================================================

interface GenericStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// =============================================================================
// Storage Key Generation
// =============================================================================

function getStorageKey(
  userAddress: string,
  contractAddresses: string[]
): string {
  const sortedAddresses = [...contractAddresses].sort().map(a => a.toLowerCase());
  return `aruvi_decrypt_sig_${userAddress.toLowerCase()}_${sortedAddresses.join('_')}`;
}

// =============================================================================
// Signature Creation
// =============================================================================

/**
 * Creates a new decryption signature for authorizing server-side decryption.
 *
 * This signature allows the server to decrypt encrypted values on behalf
 * of the user for specific contracts.
 *
 * @param instance - FHEVM instance
 * @param contractAddresses - Contracts to authorize for decryption
 * @param signer - User's signer (ethers JsonRpcSigner)
 * @param durationDays - Validity duration (default: 365 days)
 * @returns Decryption signature
 */
export async function createDecryptionSignature(
  instance: FhevmInstance,
  contractAddresses: string[],
  signer: ethers.JsonRpcSigner,
  durationDays: number = 365
): Promise<DecryptionSignature> {
  const userAddress = await signer.getAddress() as `0x${string}`;
  
  // Generate ephemeral keypair
  const ephemeralWallet = ethers.Wallet.createRandom();
  const publicKey = ephemeralWallet.publicKey;
  const privateKey = ephemeralWallet.privateKey;

  // Get current timestamp
  const startTimestamp = Math.floor(Date.now() / 1000);

  // Create EIP-712 signature
  const eip712 = (instance as any).createEIP712(
    publicKey,
    contractAddresses,
    startTimestamp,
    durationDays
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );

  return {
    signature,
    publicKey,
    privateKey,
    userAddress,
    contractAddresses: contractAddresses as `0x${string}`[],
    startTimestamp,
    durationDays,
  };
}

/**
 * Creates a short-lived decryption signature for payment verification.
 *
 * This signature is NOT cached and has a very short validity period.
 * It should be created AFTER a transaction is made and sent to the
 * server for payment verification.
 *
 * @param instance - FHEVM instance
 * @param contractAddresses - Contracts to authorize for decryption
 * @param signer - User's signer
 * @param durationDays - Validity duration (default: 1 day)
 * @returns Short-lived decryption signature
 */
export async function createShortLivedSignature(
  instance: FhevmInstance,
  contractAddresses: string[],
  signer: ethers.JsonRpcSigner,
  durationDays: number = 1
): Promise<DecryptionSignature> {
  return createDecryptionSignature(instance, contractAddresses, signer, durationDays);
}

// =============================================================================
// Signature Validation
// =============================================================================

/**
 * Checks if a decryption signature is still valid.
 */
export function isSignatureValid(signature: DecryptionSignature): boolean {
  const now = Math.floor(Date.now() / 1000);
  const expiryTime = signature.startTimestamp + (signature.durationDays * 24 * 60 * 60);
  return now < expiryTime;
}

/**
 * Gets the expiry timestamp of a signature.
 */
export function getSignatureExpiry(signature: DecryptionSignature): number {
  return signature.startTimestamp + (signature.durationDays * 24 * 60 * 60);
}

// =============================================================================
// Storage Management
// =============================================================================

/**
 * Saves a decryption signature to storage.
 */
export function saveSignatureToStorage(
  signature: DecryptionSignature,
  storage: GenericStorage = localStorage
): void {
  const key = getStorageKey(signature.userAddress, signature.contractAddresses);
  storage.setItem(key, JSON.stringify(signature));
}

/**
 * Loads a decryption signature from storage.
 */
export function loadSignatureFromStorage(
  userAddress: string,
  contractAddresses: string[],
  storage: GenericStorage = localStorage
): DecryptionSignature | null {
  const key = getStorageKey(userAddress, contractAddresses);
  const stored = storage.getItem(key);
  
  if (!stored) {
    return null;
  }

  try {
    const signature = JSON.parse(stored) as DecryptionSignature;
    
    // Check if still valid
    if (!isSignatureValid(signature)) {
      storage.removeItem(key);
      return null;
    }

    return signature;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

/**
 * Removes a decryption signature from storage.
 */
export function removeSignatureFromStorage(
  userAddress: string,
  contractAddresses: string[],
  storage: GenericStorage = localStorage
): void {
  const key = getStorageKey(userAddress, contractAddresses);
  storage.removeItem(key);
}

// =============================================================================
// Load or Create Pattern
// =============================================================================

/**
 * Loads an existing valid signature from storage, or creates a new one.
 *
 * This is the recommended way to get a decryption signature, as it:
 * - Reuses existing valid signatures (better UX, fewer wallet prompts)
 * - Automatically creates new signatures when needed
 * - Handles expiry automatically
 *
 * @param instance - FHEVM instance
 * @param contractAddresses - Contracts to authorize
 * @param signer - User's signer
 * @param storage - Storage to use (default: localStorage)
 * @param durationDays - Validity duration for new signatures
 * @returns Decryption signature
 */
export async function loadOrCreateSignature(
  instance: FhevmInstance,
  contractAddresses: string[],
  signer: ethers.JsonRpcSigner,
  storage: GenericStorage = localStorage,
  durationDays: number = 365
): Promise<DecryptionSignature> {
  const userAddress = await signer.getAddress();
  
  // Try to load existing signature
  const existing = loadSignatureFromStorage(userAddress, contractAddresses, storage);
  if (existing) {
    console.log('[Aruvi] Using cached decryption signature');
    return existing;
  }

  // Create new signature
  console.log('[Aruvi] Creating new decryption signature');
  const signature = await createDecryptionSignature(
    instance,
    contractAddresses,
    signer,
    durationDays
  );

  // Save for future use
  saveSignatureToStorage(signature, storage);

  return signature;
}
