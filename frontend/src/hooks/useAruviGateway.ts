/**
 * Aruvi Payment Gateway Hook
 * Complete hook for all payment operations: send, request, subscribe, refund
 */

import { useCallback, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { parseAbi, keccak256, toBytes } from 'viem';
import { CONTRACTS, ARUVI_GATEWAY_ABI, WRAPPER_ABI } from '../lib/contracts';
import { useFhevmEncrypt } from './useFhevmEncrypt';
import { useFhevm } from '../providers/useFhevmContext';

// Parse the ABIs once
const GATEWAY_ABI = parseAbi(ARUVI_GATEWAY_ABI);
const WRAPPER_ABI_PARSED = parseAbi(WRAPPER_ABI);

// Operator expiry - 10 years from now (effectively permanent)
// uint48 max is ~8.9 million years from Unix epoch, so this is safe
const OPERATOR_EXPIRY = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60;

// ============================================================
// Types
// ============================================================

export interface SendParams {
  recipient: `0x${string}`;
  amount: bigint;
}

export interface MultiSendParams {
  recipients: `0x${string}`[];
  amounts: bigint[];
}

export interface RequestParams {
  amount: bigint;
  expiresIn?: number; // seconds, 0 = never expires
}

export interface SubscriptionParams {
  recipient: `0x${string}`;
  amount: bigint;
  interval: number; // seconds (e.g., 30 days = 2592000)
}

export interface PaymentInfo {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  timestamp: bigint;
  isRefunded: boolean;
}

export interface RequestInfo {
  requester: `0x${string}`;
  token: `0x${string}`;
  createdAt: bigint;
  expiresAt: bigint;
  fulfilled: boolean;
}

export interface SubscriptionInfo {
  subscriber: `0x${string}`;
  recipient: `0x${string}`;
  interval: bigint;
  nextPayment: bigint;
  active: boolean;
}

export interface TransactionResult {
  hash: `0x${string}`;
  id: `0x${string}`; // paymentId, requestId, or subscriptionId
}

// ============================================================
// Hook
// ============================================================

export function useAruviGateway() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const { isReady: fhevmReady } = useFhevm();
  const { encryptAmount, isEncrypting } = useFhevmEncrypt();

  // Local state
  const [isProcessing, setIsProcessing] = useState(false);

  // Read user's payment count
  const { data: paymentCount } = useReadContract({
    address: CONTRACTS.ARUVI_GATEWAY,
    abi: GATEWAY_ABI,
    functionName: 'paymentCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user's request count
  const { data: requestCount } = useReadContract({
    address: CONTRACTS.ARUVI_GATEWAY,
    abi: GATEWAY_ABI,
    functionName: 'requestCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user's subscription count
  const { data: subscriptionCount } = useReadContract({
    address: CONTRACTS.ARUVI_GATEWAY,
    abi: GATEWAY_ABI,
    functionName: 'subscriptionCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Check if gateway is approved as operator for wrapper
  const { data: isOperator, refetch: refetchOperator } = useReadContract({
    address: CONTRACTS.WRAPPER,
    abi: WRAPPER_ABI_PARSED,
    functionName: 'isOperator',
    args: address ? [address, CONTRACTS.ARUVI_GATEWAY] : undefined,
    query: { enabled: !!address },
  });

  // ============================================================
  // OPERATOR APPROVAL (Required for transfers)
  // ============================================================

  /**
   * Approve the gateway as an operator for confidential transfers
   * Must be called before sending any payments
   */
  const approveGateway = useCallback(async (): Promise<`0x${string}` | null> => {
    if (!address || !isConnected) {
      console.error('[Aruvi] Not connected');
      return null;
    }

    setIsProcessing(true);
    try {
      console.log('[Aruvi] Approving gateway as operator...');
      const hash = await writeContractAsync({
        address: CONTRACTS.WRAPPER,
        abi: WRAPPER_ABI_PARSED,
        functionName: 'setOperator',
        args: [CONTRACTS.ARUVI_GATEWAY, OPERATOR_EXPIRY],
      });

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        await refetchOperator();
      }

      console.log('[Aruvi] Gateway approved as operator');
      return hash;
    } catch (err) {
      console.error('[Aruvi] Approval failed:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [address, isConnected, writeContractAsync, publicClient, refetchOperator]);

  // ============================================================
  // SEND MONEY
  // ============================================================

  /**
   * Send encrypted payment to anyone
   * Will automatically request operator approval if not already approved
   */
  const send = useCallback(
    async (params: SendParams): Promise<TransactionResult | null> => {
      const { recipient, amount } = params;

      if (!address || !isConnected || !fhevmReady) {
        console.error('[Aruvi] Not ready for payment');
        return null;
      }

      setIsProcessing(true);

      try {
        // Check operator approval first
        if (!isOperator) {
          console.log('[Aruvi] Gateway not approved, requesting approval...');
          await approveGateway();
          // Wait for state to propagate on-chain before proceeding
          console.log('[Aruvi] Waiting for approval to propagate...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('[Aruvi] Encrypting amount for GATEWAY...');
        // TWO-STEP FHE PATTERN: Encrypt for GATEWAY, not Wrapper!
        // Gateway calls FHE.fromExternal() itself (msg.sender = user = correct)
        // Then Gateway uses the verified handle for transfer
        const encrypted = await encryptAmount(amount, CONTRACTS.ARUVI_GATEWAY);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        console.log('[Aruvi] Sending to', recipient);
        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'send',
          args: [recipient, encrypted.handles[0], encrypted.inputProof],
          gas: 2000000n, // FHE operations are gas-intensive
        });

        // Extract paymentId from event
        let paymentId: `0x${string}` = '0x0';
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          const event = receipt.logs.find(
            log => log.topics[0] === keccak256(toBytes('PaymentSent(bytes32,address,address)'))
          );
          if (event?.topics[1]) {
            paymentId = event.topics[1] as `0x${string}`;
          }
        }

        console.log('[Aruvi] Payment sent! ID:', paymentId);
        return { hash, id: paymentId };
      } catch (err) {
        console.error('[Aruvi] Send failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, fhevmReady, isOperator, approveGateway, encryptAmount, writeContractAsync, publicClient]
  );

  /**
   * Send to multiple recipients at once (split bills)
   */
  const multiSend = useCallback(
    async (params: MultiSendParams): Promise<TransactionResult | null> => {
      const { recipients, amounts } = params;

      if (!address || !isConnected || !fhevmReady) {
        console.error('[Aruvi] Not ready');
        return null;
      }

      if (recipients.length !== amounts.length) {
        throw new Error('Recipients and amounts must have same length');
      }

      setIsProcessing(true);

      try {
        console.log('[Aruvi] Encrypting', amounts.length, 'amounts for GATEWAY...');
        
        const encryptedAmounts: `0x${string}`[] = [];
        const proofs: `0x${string}`[] = [];

        for (const amount of amounts) {
          // TWO-STEP FHE PATTERN: Encrypt for GATEWAY!
          const encrypted = await encryptAmount(amount, CONTRACTS.ARUVI_GATEWAY);
          if (!encrypted || !encrypted.handles[0]) {
            throw new Error('Failed to encrypt amount');
          }
          encryptedAmounts.push(encrypted.handles[0]);
          proofs.push(encrypted.inputProof);
        }

        console.log('[Aruvi] Multi-sending to', recipients.length, 'recipients');
        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'multiSend',
          args: [recipients, encryptedAmounts, proofs],
          gas: BigInt(500000 * recipients.length),
        });

        console.log('[Aruvi] Multi-send complete!');
        return { hash, id: hash }; // Use tx hash as ID for multi-send
      } catch (err) {
        console.error('[Aruvi] Multi-send failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync]
  );

  // ============================================================
  // REQUEST MONEY
  // ============================================================

  /**
   * Create a payment request (shareable link/QR)
   */
  const createRequest = useCallback(
    async (params: RequestParams): Promise<TransactionResult | null> => {
      const { amount, expiresIn = 0 } = params;

      if (!address || !isConnected || !fhevmReady) {
        console.error('[Aruvi] Not ready');
        return null;
      }

      setIsProcessing(true);

      try {
        console.log('[Aruvi] Creating payment request...');
        const encrypted = await encryptAmount(amount, CONTRACTS.ARUVI_GATEWAY);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'createRequest',
          args: [encrypted.handles[0], encrypted.inputProof, BigInt(expiresIn)],
          gas: 500000n,
        });

        // Extract requestId from event
        let requestId: `0x${string}` = '0x0';
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          const event = receipt.logs.find(
            log => log.topics[0] === keccak256(toBytes('RequestCreated(bytes32,address)'))
          );
          if (event?.topics[1]) {
            requestId = event.topics[1] as `0x${string}`;
          }
        }

        console.log('[Aruvi] Request created! ID:', requestId);
        return { hash, id: requestId };
      } catch (err) {
        console.error('[Aruvi] Create request failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync, publicClient]
  );

  /**
   * Pay someone's request
   */
  const fulfillRequest = useCallback(
    async (requestId: `0x${string}`, amount: bigint): Promise<TransactionResult | null> => {
      if (!address || !isConnected || !fhevmReady) {
        console.error('[Aruvi] Not ready');
        return null;
      }

      setIsProcessing(true);

      try {
        console.log('[Aruvi] Fulfilling request', requestId);
        // TWO-STEP FHE PATTERN: Encrypt for GATEWAY!
        const encrypted = await encryptAmount(amount, CONTRACTS.ARUVI_GATEWAY);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'fulfillRequest',
          args: [requestId, encrypted.handles[0], encrypted.inputProof],
          gas: 800000n,
        });

        // Extract paymentId from event
        let paymentId: `0x${string}` = '0x0';
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          const event = receipt.logs.find(
            log => log.topics[0] === keccak256(toBytes('RequestFulfilled(bytes32,bytes32)'))
          );
          if (event?.topics[2]) {
            paymentId = event.topics[2] as `0x${string}`;
          }
        }

        console.log('[Aruvi] Request fulfilled! Payment ID:', paymentId);
        return { hash, id: paymentId };
      } catch (err) {
        console.error('[Aruvi] Fulfill request failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync, publicClient]
  );

  /**
   * Cancel your own request
   */
  const cancelRequest = useCallback(
    async (requestId: `0x${string}`): Promise<`0x${string}` | null> => {
      if (!address || !isConnected) {
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'cancelRequest',
          args: [requestId],
        });
        console.log('[Aruvi] Request cancelled');
        return hash;
      } catch (err) {
        console.error('[Aruvi] Cancel request failed:', err);
        throw err;
      }
    },
    [address, isConnected, writeContractAsync]
  );

  // ============================================================
  // SUBSCRIPTIONS
  // ============================================================

  /**
   * Create a recurring payment subscription
   */
  const createSubscription = useCallback(
    async (params: SubscriptionParams): Promise<TransactionResult | null> => {
      const { recipient, amount, interval } = params;

      if (!address || !isConnected || !fhevmReady) {
        console.error('[Aruvi] Not ready');
        return null;
      }

      setIsProcessing(true);

      try {
        console.log('[Aruvi] Creating subscription to', recipient);
        const encrypted = await encryptAmount(amount, CONTRACTS.ARUVI_GATEWAY);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'createSubscription',
          args: [recipient, encrypted.handles[0], encrypted.inputProof, BigInt(interval)],
          gas: 600000n,
        });

        // Extract subscriptionId from event
        let subscriptionId: `0x${string}` = '0x0';
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          const event = receipt.logs.find(
            log => log.topics[0] === keccak256(toBytes('SubscriptionCreated(bytes32,address,address)'))
          );
          if (event?.topics[1]) {
            subscriptionId = event.topics[1] as `0x${string}`;
          }
        }

        console.log('[Aruvi] Subscription created! ID:', subscriptionId);
        return { hash, id: subscriptionId };
      } catch (err) {
        console.error('[Aruvi] Create subscription failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync, publicClient]
  );

  /**
   * Execute a subscription payment (can be called by subscriber or recipient)
   */
  const executeSubscription = useCallback(
    async (subscriptionId: `0x${string}`): Promise<TransactionResult | null> => {
      if (!address || !isConnected) {
        return null;
      }

      setIsProcessing(true);

      try {
        console.log('[Aruvi] Executing subscription', subscriptionId);
        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'executeSubscription',
          args: [subscriptionId],
          gas: 800000n,
        });

        // Extract paymentId from event
        let paymentId: `0x${string}` = '0x0';
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          const event = receipt.logs.find(
            log => log.topics[0] === keccak256(toBytes('SubscriptionPaid(bytes32,bytes32)'))
          );
          if (event?.topics[2]) {
            paymentId = event.topics[2] as `0x${string}`;
          }
        }

        console.log('[Aruvi] Subscription payment made! ID:', paymentId);
        return { hash, id: paymentId };
      } catch (err) {
        console.error('[Aruvi] Execute subscription failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, writeContractAsync, publicClient]
  );

  /**
   * Cancel subscription (only subscriber can cancel)
   */
  const cancelSubscription = useCallback(
    async (subscriptionId: `0x${string}`): Promise<`0x${string}` | null> => {
      if (!address || !isConnected) {
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'cancelSubscription',
          args: [subscriptionId],
        });
        console.log('[Aruvi] Subscription cancelled');
        return hash;
      } catch (err) {
        console.error('[Aruvi] Cancel subscription failed:', err);
        throw err;
      }
    },
    [address, isConnected, writeContractAsync]
  );

  // ============================================================
  // REFUNDS
  // ============================================================

  /**
   * Refund a payment (only recipient can refund)
   */
  const refund = useCallback(
    async (paymentId: `0x${string}`): Promise<`0x${string}` | null> => {
      if (!address || !isConnected) {
        return null;
      }

      setIsProcessing(true);

      try {
        console.log('[Aruvi] Refunding payment', paymentId);
        const hash = await writeContractAsync({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'refund',
          args: [paymentId],
          gas: 500000n,
        });

        console.log('[Aruvi] Refund processed!');
        return hash;
      } catch (err) {
        console.error('[Aruvi] Refund failed:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, writeContractAsync]
  );

  // ============================================================
  // QUERIES
  // ============================================================

  /**
   * Get payment info by ID
   */
  const getPaymentInfo = useCallback(
    async (paymentId: `0x${string}`): Promise<PaymentInfo | null> => {
      if (!publicClient) return null;

      try {
        const result = await publicClient.readContract({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'getPaymentInfo',
          args: [paymentId],
        });

        const [sender, recipient, token, timestamp, isRefunded] = result as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          bigint,
          boolean
        ];

        return { sender, recipient, token, timestamp, isRefunded };
      } catch (err) {
        console.error('[Aruvi] Get payment info failed:', err);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Get request info by ID
   */
  const getRequestInfo = useCallback(
    async (requestId: `0x${string}`): Promise<RequestInfo | null> => {
      if (!publicClient) return null;

      try {
        const result = await publicClient.readContract({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'getRequestInfo',
          args: [requestId],
        });

        const [requester, token, createdAt, expiresAt, fulfilled] = result as [
          `0x${string}`,
          `0x${string}`,
          bigint,
          bigint,
          boolean
        ];

        return { requester, token, createdAt, expiresAt, fulfilled };
      } catch (err) {
        console.error('[Aruvi] Get request info failed:', err);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Get subscription info by ID
   */
  const getSubscriptionInfo = useCallback(
    async (subscriptionId: `0x${string}`): Promise<SubscriptionInfo | null> => {
      if (!publicClient) return null;

      try {
        const result = await publicClient.readContract({
          address: CONTRACTS.ARUVI_GATEWAY,
          abi: GATEWAY_ABI,
          functionName: 'getSubscriptionInfo',
          args: [subscriptionId],
        });

        const [subscriber, recipient, interval, nextPayment, active] = result as [
          `0x${string}`,
          `0x${string}`,
          bigint,
          bigint,
          boolean
        ];

        return { subscriber, recipient, interval, nextPayment, active };
      } catch (err) {
        console.error('[Aruvi] Get subscription info failed:', err);
        return null;
      }
    },
    [publicClient]
  );

  // ============================================================
  // Return
  // ============================================================

  return {
    // State
    isProcessing,
    isEncrypting,
    isWritePending,
    fhevmReady,
    paymentCount: paymentCount ?? 0n,
    requestCount: requestCount ?? 0n,
    subscriptionCount: subscriptionCount ?? 0n,
    isOperatorApproved: !!isOperator,

    // Approval
    approveGateway,

    // Send Money
    send,
    multiSend,

    // Request Money
    createRequest,
    fulfillRequest,
    cancelRequest,

    // Subscriptions
    createSubscription,
    executeSubscription,
    cancelSubscription,

    // Refunds
    refund,

    // Queries
    getPaymentInfo,
    getRequestInfo,
    getSubscriptionInfo,
  };
}

export default useAruviGateway;
