"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { parseAbiItem } from "viem";
import toast from "react-hot-toast";
import { CONTRACTS, REFUND_MANAGER_ABI } from "@/lib/contracts";
import { trackTransaction, captureError, trackEvent } from "@/lib/monitoring";

export function useRefundManager() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);

  // Queue a refund
  const queueRefund = useCallback(
    async (paymentId: `0x${string}`, customerAddress: `0x${string}`) => {
      if (!address) {
        toast.error("Please connect wallet");
        return null;
      }

      const toastId = toast.loading("Queueing refund...");
      setIsProcessing(true);

      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.REFUND_MANAGER,
          abi: [
            parseAbiItem(
              "function queueRefund(bytes32 paymentId, address customer) returns (bytes32)"
            ),
          ],
          functionName: "queueRefund",
          args: [paymentId, customerAddress],
          gas: 200000n,
        });

        trackTransaction(hash, "refund_queue", {
          paymentId,
          customer: customerAddress,
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Refund queued successfully", { id: toastId });
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { message?: string; shortMessage?: string };
        console.error("[RefundManager] Queue failed:", error);
        
        captureError(error as Error, {
          context: "queueRefund",
          paymentId,
          customer: customerAddress,
        });
        
        let errorMsg = "Failed to queue refund";
        if (error?.message?.includes("Not registered")) {
          errorMsg = "You are not a registered merchant";
        } else if (error?.message?.includes("Already queued")) {
          errorMsg = "Refund already queued";
        } else if (error?.shortMessage) {
          errorMsg = error.shortMessage;
        }

        toast.error(errorMsg, { id: toastId });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, publicClient, writeContractAsync]
  );

  // Process a queued refund
  const processRefund = useCallback(
    async (requestId: `0x${string}`) => {
      if (!address) {
        toast.error("Please connect wallet");
        return null;
      }

      const toastId = toast.loading("Processing refund...");
      setIsProcessing(true);

      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.REFUND_MANAGER,
          abi: [parseAbiItem("function processQueuedRefund(bytes32 requestId)")],
          functionName: "processQueuedRefund",
          args: [requestId],
          gas: 500000n,
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Refund processed successfully! 💸", { id: toastId });
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { message?: string; shortMessage?: string };
        console.error("[RefundManager] Process failed:", error);
        
        let errorMsg = "Failed to process refund";
        if (error?.message?.includes("Unknown request")) {
          errorMsg = "Refund request not found";
        } else if (error?.message?.includes("Already processed")) {
          errorMsg = "Refund already processed";
        } else if (error?.message?.includes("Not your request")) {
          errorMsg = "You can only process your own refunds";
        } else if (error?.shortMessage) {
          errorMsg = error.shortMessage;
        }

        toast.error(errorMsg, { id: toastId });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, publicClient, writeContractAsync]
  );

  // Get refund request details
  const getRefundRequest = useCallback(
    async (requestId: `0x${string}`) => {
      // This would be implemented with a read contract call
      return null;
    },
    []
  );

  return {
    queueRefund,
    processRefund,
    getRefundRequest,
    isProcessing: isProcessing || isPending,
  };
}
