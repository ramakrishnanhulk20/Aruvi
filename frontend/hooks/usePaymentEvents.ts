"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACTS } from "@/lib/contracts";

export interface PaymentEvent {
  id: string;
  paymentId: string;
  merchant: string;
  payer: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: bigint;
  isRefunded?: boolean;
}

interface UsePaymentEventsOptions {
  fromBlock?: bigint;
  limit?: number;
}

export function usePaymentEvents(
  merchantAddress?: string, 
  options: UsePaymentEventsOptions = {}
) {
  const publicClient = usePublicClient();
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Calculate fromBlock - default to last 10000 blocks (~1.5 days on Sepolia)
  const defaultFromBlock = options.fromBlock || BigInt(0);
  const limit = options.limit || 50;

  useEffect(() => {
    if (!publicClient || !merchantAddress) {
      setIsLoading(false);
      return;
    }

    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch PaymentProcessed events with pagination
        const logs = await publicClient.getLogs({
          address: CONTRACTS.GATEWAY,
          event: parseAbiItem("event PaymentProcessed(bytes32 indexed paymentId, address indexed merchant)"),
          args: {
            merchant: merchantAddress as `0x${string}`,
          },
          fromBlock: defaultFromBlock,
          toBlock: "latest",
        });

        // Get block timestamps, transaction details, and refund status for each payment
        const paymentsWithTimestamps = await Promise.all(
          logs.map(async (log) => {
            const [block, transaction, isRefunded] = await Promise.all([
              publicClient.getBlock({ blockNumber: log.blockNumber }),
              publicClient.getTransaction({ hash: log.transactionHash }),
              // Check refund status
              publicClient.readContract({
                address: CONTRACTS.GATEWAY,
                abi: [parseAbiItem("function refunded(bytes32) view returns (bool)")],
                functionName: "refunded",
                args: [log.args.paymentId as `0x${string}`],
              }).catch(() => false), // Default to false if read fails
            ]);
            return {
              id: log.transactionHash,
              paymentId: log.args.paymentId as string,
              merchant: log.args.merchant as string,
              payer: transaction.from,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              timestamp: block.timestamp,
              isRefunded: isRefunded as boolean,
            };
          })
        );

        // Sort by timestamp descending (newest first)
        paymentsWithTimestamps.sort((a, b) => Number(b.timestamp - a.timestamp));

        // Apply limit
        const hasMorePayments = paymentsWithTimestamps.length > limit;
        const limitedPayments = paymentsWithTimestamps.slice(0, limit);
        
        setPayments(limitedPayments);
        setHasMore(hasMorePayments);
      } catch (err) {
        console.error("[PaymentEvents] Error fetching payments:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [publicClient, merchantAddress]);

  const refetch = async () => {
    if (!publicClient || !merchantAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      const logs = await publicClient.getLogs({
        address: CONTRACTS.GATEWAY,
        event: parseAbiItem("event PaymentProcessed(bytes32 indexed paymentId, address indexed merchant)"),
        args: {
          merchant: merchantAddress as `0x${string}`,
        },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });

      const paymentsWithTimestamps = await Promise.all(
        logs.map(async (log) => {
          const [block, transaction] = await Promise.all([
            publicClient.getBlock({ blockNumber: log.blockNumber }),
            publicClient.getTransaction({ hash: log.transactionHash }),
          ]);
          return {
            id: log.transactionHash,
            paymentId: log.args.paymentId as string,
            merchant: log.args.merchant as string,
            payer: transaction.from,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp: block.timestamp,
          };
        })
      );

      paymentsWithTimestamps.sort((a, b) => Number(b.timestamp - a.timestamp));
      setPayments(paymentsWithTimestamps);
    } catch (err) {
      console.error("[PaymentEvents] Error refetching payments:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    payments,
    isLoading,
    error,
    refetch,
    hasMore,
  };
}
