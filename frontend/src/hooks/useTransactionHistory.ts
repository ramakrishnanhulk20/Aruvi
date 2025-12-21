/**
 * useTransactionHistory Hook
 * Fetches payment events from the Aruvi Gateway contract
 * Uses chunked queries to avoid RPC block limits
 */

import { useCallback, useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { CONTRACTS } from '../lib/contracts';

// Define the log type with args
interface PaymentLog {
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  args: {
    paymentId: `0x${string}`;
    sender?: `0x${string}`;
    recipient?: `0x${string}`;
  };
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'refund';
  counterparty: `0x${string}`;
  timestamp: number;
  status: 'completed' | 'refunded';
  txHash: `0x${string}`;
  paymentId: `0x${string}`;
  blockNumber: bigint;
}

// Event signatures
const PAYMENT_SENT_EVENT = parseAbiItem('event PaymentSent(bytes32 indexed paymentId, address indexed sender, address indexed recipient)');
const REFUND_ISSUED_EVENT = parseAbiItem('event RefundIssued(bytes32 indexed paymentId, address indexed recipient, address indexed sender)');

// Max blocks per query (RPC limit is usually 1000)
const MAX_BLOCKS_PER_QUERY = 500n;
// How many blocks to look back (~1 day on Sepolia)
const LOOKBACK_BLOCKS = 7200n;

export function useTransactionHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper to add delay between requests
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to fetch logs in chunks to avoid RPC limits
  const fetchLogsInChunks = useCallback(async (
    event: typeof PAYMENT_SENT_EVENT | typeof REFUND_ISSUED_EVENT,
    args: Record<string, `0x${string}` | undefined>,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<PaymentLog[]> => {
    if (!publicClient) return [];
    
    const allLogs: PaymentLog[] = [];
    let currentFrom = fromBlock;
    let consecutiveErrors = 0;
    
    while (currentFrom < toBlock) {
      const currentTo = currentFrom + MAX_BLOCKS_PER_QUERY > toBlock 
        ? toBlock 
        : currentFrom + MAX_BLOCKS_PER_QUERY;
      
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACTS.ARUVI_GATEWAY,
          event,
          args,
          fromBlock: currentFrom,
          toBlock: currentTo,
        });
        allLogs.push(...(logs as unknown as PaymentLog[]));
        consecutiveErrors = 0;
        // Small delay between requests to avoid rate limiting
        await delay(100);
      } catch (err) {
        consecutiveErrors++;
        console.warn(`Log query failed for blocks ${currentFrom}-${currentTo}:`, err);
        
        // If we hit 3 consecutive errors, abort to avoid infinite loops
        if (consecutiveErrors >= 3) {
          console.warn('Too many consecutive errors, stopping log fetch');
          break;
        }
        
        // Longer delay after error
        await delay(1000);
      }
      
      currentFrom = currentTo + 1n;
    }
    
    return allLogs;
  }, [publicClient]);

  const fetchTransactions = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get current block
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > LOOKBACK_BLOCKS ? currentBlock - LOOKBACK_BLOCKS : 0n;

      // Fetch sent payments (where user is sender) - chunked
      const sentLogs = await fetchLogsInChunks(
        PAYMENT_SENT_EVENT,
        { sender: address },
        fromBlock,
        currentBlock
      );

      // Fetch received payments (where user is recipient) - chunked
      const receivedLogs = await fetchLogsInChunks(
        PAYMENT_SENT_EVENT,
        { recipient: address },
        fromBlock,
        currentBlock
      );

      // Fetch refunds where user received refund (original sender) - chunked
      const refundLogs = await fetchLogsInChunks(
        REFUND_ISSUED_EVENT,
        { sender: address },
        fromBlock,
        currentBlock
      );

      // Get block timestamps (batch unique blocks)
      const blockNumbers = new Set<bigint>();
      [...sentLogs, ...receivedLogs, ...refundLogs].forEach(log => {
        blockNumbers.add(log.blockNumber);
      });

      const blockTimestamps: Record<string, number> = {};
      
      // Fetch timestamps in parallel batches of 10
      const blockArray = Array.from(blockNumbers);
      for (let i = 0; i < blockArray.length; i += 10) {
        const batch = blockArray.slice(i, i + 10);
        await Promise.all(
          batch.map(async (blockNumber) => {
            try {
              const block = await publicClient.getBlock({ blockNumber });
              blockTimestamps[blockNumber.toString()] = Number(block.timestamp);
            } catch {
              blockTimestamps[blockNumber.toString()] = Math.floor(Date.now() / 1000);
            }
          })
        );
      }

      // Create transaction list
      const txList: Transaction[] = [];

      // Process sent
      sentLogs.forEach((log) => {
        const paymentId = log.args.paymentId;
        const recipient = log.args.recipient;
        if (!recipient) return;
        
        txList.push({
          id: `sent-${paymentId}`,
          type: 'sent',
          counterparty: recipient,
          timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
          status: 'completed',
          txHash: log.transactionHash,
          paymentId,
          blockNumber: log.blockNumber,
        });
      });

      // Process received
      receivedLogs.forEach((log) => {
        const paymentId = log.args.paymentId;
        const sender = log.args.sender;
        if (!sender) return;
        
        txList.push({
          id: `received-${paymentId}`,
          type: 'received',
          counterparty: sender,
          timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
          status: 'completed',
          txHash: log.transactionHash,
          paymentId,
          blockNumber: log.blockNumber,
        });
      });

      // Process refunds
      refundLogs.forEach((log) => {
        const paymentId = log.args.paymentId;
        const recipient = log.args.recipient;
        if (!recipient) return;
        
        // Mark original sent transaction as refunded
        const originalTx = txList.find(tx => tx.paymentId === paymentId && tx.type === 'sent');
        if (originalTx) {
          originalTx.status = 'refunded';
        }
        
        txList.push({
          id: `refund-${paymentId}`,
          type: 'refund',
          counterparty: recipient,
          timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
          status: 'completed',
          txHash: log.transactionHash,
          paymentId,
          blockNumber: log.blockNumber,
        });
      });

      // Sort by timestamp (newest first)
      txList.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(txList);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, fetchLogsInChunks]);

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Stats
  const stats = {
    totalSent: transactions.filter(tx => tx.type === 'sent').length,
    totalReceived: transactions.filter(tx => tx.type === 'received').length,
    totalRefunds: transactions.filter(tx => tx.type === 'refund').length,
    total: transactions.length,
  };

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    stats,
  };
}

export default useTransactionHistory;
