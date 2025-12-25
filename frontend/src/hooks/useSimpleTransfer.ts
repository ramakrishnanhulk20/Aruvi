/**
 * Simple Confidential Transfer Hook
 * Direct P2P transfers using ERC7984 confidentialTransfer
 * No gateway, no operator approval needed - just encrypt and send!
 * 
 * Pattern borrowed from Z-Payment project
 */

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { CONTRACTS, WRAPPER_ABI } from '../lib/contracts';
import { useFhevmEncrypt } from './useFhevmEncrypt';
import { useFhevm } from '../providers/useFhevmContext';

// Use ABI directly (JSON format doesn't need parseAbi)
const WRAPPER_ABI_PARSED = WRAPPER_ABI;

export interface TransferResult {
  hash: `0x${string}`;
  transferredHandle?: `0x${string}`;
}

/**
 * Simple hook for direct confidential transfers
 * Uses confidentialTransfer directly on wrapper - no operator approval needed
 */
export function useSimpleTransfer() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { isReady: fhevmReady } = useFhevm();
  const { encryptAmount, isEncrypting } = useFhevmEncrypt();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Send confidential tokens directly (P2P)
   * @param recipient - Address to send to
   * @param amount - Amount in smallest units (e.g., 10000000 for 10 cUSDC)
   */
  const send = useCallback(
    async (recipient: `0x${string}`, amount: bigint): Promise<TransferResult | null> => {
      if (!address || !isConnected) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      if (!fhevmReady) {
        setError(new Error('FHE not ready'));
        return null;
      }

      if (recipient === address) {
        setError(new Error('Cannot send to yourself'));
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        console.log('[SimpleTransfer] Encrypting amount:', amount.toString());
        
        // Encrypt for the WRAPPER contract (not gateway)
        const encrypted = await encryptAmount(amount, CONTRACTS.WRAPPER);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        console.log('[SimpleTransfer] Sending to', recipient);
        console.log('[SimpleTransfer] Handle:', encrypted.handles[0]);
        console.log('[SimpleTransfer] Proof length:', encrypted.inputProof.length);

        // Call confidentialTransfer directly on wrapper
        // No operator approval needed!
        const hash = await writeContractAsync({
          address: CONTRACTS.WRAPPER,
          abi: WRAPPER_ABI_PARSED,
          functionName: 'confidentialTransfer',
          args: [recipient, encrypted.handles[0], encrypted.inputProof],
          gas: 500000n, // Lower gas since simpler operation
        });

        console.log('[SimpleTransfer] Transaction sent:', hash);

        // Wait for confirmation and check status
        let transferredHandle: `0x${string}` | undefined;
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log('[SimpleTransfer] Confirmed! Status:', receipt.status);
          
          // Check transaction status - CRITICAL!
          if (receipt.status === 'reverted') {
            throw new Error('Transfer reverted on-chain. Check your cUSDC balance.');
          }
          
          // Look for ConfidentialTransfer event
          const eventSig = keccak256(toBytes('ConfidentialTransfer(address,address,bytes32)'));
          const event = receipt.logs.find(log => log.topics[0] === eventSig);
          if (event?.data) {
            transferredHandle = event.data as `0x${string}`;
          }
        }

        return { hash, transferredHandle };
      } catch (err) {
        console.error('[SimpleTransfer] Failed:', err);
        const error = err instanceof Error ? err : new Error('Transfer failed');
        setError(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync, publicClient]
  );

  return {
    send,
    isProcessing: isProcessing || isEncrypting || isPending,
    error,
    isReady: fhevmReady && isConnected,
  };
}

export default useSimpleTransfer;
