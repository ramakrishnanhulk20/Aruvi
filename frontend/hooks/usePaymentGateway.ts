"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignTypedData,
  usePublicClient,
} from "wagmi";
import { parseAbiItem } from "viem";
import toast from "react-hot-toast";
import { CONTRACTS, GATEWAY_ABI } from "@/lib/contracts";
import { useFhevmEncrypt } from "./useFhevm";
import { trackTransaction, captureError, trackEvent } from "@/lib/monitoring";
import { getDefaultToken, type ConfidentialToken } from "@/lib/tokenRegistry";

// Payment Gateway Hook
export function usePaymentGateway(token?: ConfidentialToken) {
  const { address } = useAccount();
  const { encryptAmount, isEncrypting, isReady: fhevmReady } = useFhevmEncrypt();
  const [isPaying, setIsPaying] = useState(false);

  // Use provided token or default from registry
  const activeToken = token || getDefaultToken();
  const GATEWAY_ADDRESS = CONTRACTS.GATEWAY as `0x${string}`; // TODO: Make this token-specific too

  // Check if address is a registered merchant
  const { data: isMerchant, refetch: refetchMerchant } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchants(address) view returns (bool)")],
    functionName: "merchants",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get merchant total (encrypted handle)
  const { data: merchantTotalHandle } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchantTotals(address) view returns (bytes32)")],
    functionName: "merchantTotals",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!isMerchant },
  });

  // Get merchant refund total (encrypted handle)
  const { data: merchantRefundTotalHandle } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchantRefundTotals(address) view returns (bytes32)")],
    functionName: "merchantRefundTotals",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!isMerchant },
  });

  // Get nonce for EIP-712 signing
  const { data: nonce } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function nonces(address) view returns (uint256)")],
    functionName: "nonces",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Write contract hooks
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Process payment (customer → merchant)
  const processPayment = useCallback(
    async (
      merchantAddress: `0x${string}`,
      tokenAddress: `0x${string}`,
      amountInCents: bigint,
      orderId: string = "",
      paymentType: number = 0, // 0 = P2P (default)
      productId: bigint = 0n
    ): Promise<`0x${string}` | null> => {
      if (!address || !fhevmReady) {
        toast.error("Please connect wallet and wait for FHEVM to initialize");
        return null;
      }

      if (!amountInCents || amountInCents <= 0n) {
        toast.error("Invalid payment amount");
        return null;
      }

      if (!merchantAddress || merchantAddress === '0x0000000000000000000000000000000000000000') {
        toast.error("Invalid merchant address");
        return null;
      }

      setIsPaying(true);
      const toastId = toast.loading("Encrypting payment amount...");

      try {
        // Step 1: Encrypt the amount
        const encrypted = await encryptAmount(amountInCents, GATEWAY_ADDRESS);
        if (!encrypted) {
          toast.error("Failed to encrypt amount", { id: toastId });
          return null;
        }

        toast.loading("Processing payment...", { id: toastId });

        // Step 2: Call processPayment with payment type and product ID
        const hash = await writeContractAsync({
          address: GATEWAY_ADDRESS,
          abi: [
            parseAbiItem(
              "function processPayment(address merchant, address token, bytes32 encryptedAmount, bytes proof, string orderId, uint8 paymentType, uint256 productId) returns (bytes32)"
            ),
          ],
          functionName: "processPayment",
          args: [
            merchantAddress,
            tokenAddress,
            encrypted.handles[0] as `0x${string}`,
            encrypted.inputProof as `0x${string}`,
            orderId,
            paymentType,
            productId,
          ],
          gas: 800000n,
        });

        toast.loading("Transaction sent...", { id: toastId });
        
        // Track successful payment
        trackTransaction(hash, "payment", {
          merchant: merchantAddress,
          token: tokenAddress,
          amountInCents: amountInCents.toString(),
          paymentType: paymentType.toString(),
          productId: productId.toString(),
        });
        
        toast.dismiss(toastId); // Dismiss loading toast, let caller handle success
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { message?: string; shortMessage?: string };
        console.error("[PaymentGateway] Payment failed:", error);
        
        // Capture error to monitoring
        captureError(error as Error, {
          context: "processPayment",
          merchant: merchantAddress,
          token: tokenAddress,
          amountInCents: amountInCents.toString(),
        });
        
        // Parse error message
        let errorMsg = "Payment failed";
        if (error?.message?.includes("ACL")) {
          errorMsg = "Permission denied - please set operator first";
        } else if (error?.message?.includes("proof")) {
          errorMsg = "Encryption verification failed - please retry";
        } else if (error?.message?.includes("Not registered")) {
          errorMsg = "Merchant not registered";
        } else if (error?.shortMessage) {
          errorMsg = error.shortMessage;
        }

        toast.error(errorMsg, { id: toastId });
        return null;
      } finally {
        setIsPaying(false);
      }
    },
    [address, fhevmReady, encryptAmount, writeContractAsync]
  );

  return {
    // State
    isMerchant: !!isMerchant,
    merchantTotalHandle: merchantTotalHandle as `0x${string}` | undefined,
    merchantRefundTotalHandle: merchantRefundTotalHandle as `0x${string}` | undefined,
    nonce: nonce as bigint | undefined,
    // Transaction state
    isPaying: isPaying || isPending || isEncrypting,
    isConfirming,
    isSuccess,
    txHash,
    // Actions
    processPayment,
    refetchMerchant,
    fhevmReady,
  };
}

// Hook for merchant-specific operations
export function useMerchantOperations() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const GATEWAY_ADDRESS = CONTRACTS.GATEWAY as `0x${string}`;

  // Get payment details
  const getPayment = useCallback(
    async (paymentId: `0x${string}`) => {
      // This would need to be a read call - simplified for now
      return null;
    },
    []
  );

  // Make total public for tax disclosure
  const makeTotalPublic = useCallback(async () => {
    if (!address) {
      toast.error("Please connect wallet");
      return null;
    }

    const toastId = toast.loading("Making total publicly decryptable...");

    try {
      const hash = await writeContractAsync({
        address: GATEWAY_ADDRESS,
        abi: [parseAbiItem("function makeMerchantTotalPublic()")],
        functionName: "makeMerchantTotalPublic",
        gas: 200000n,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      toast.success("Total is now publicly decryptable", { id: toastId });
      return hash;
    } catch (err: any) {
      console.error("[MerchantOps] Failed:", err);
      toast.error(err?.shortMessage || "Failed to make total public", {
        id: toastId,
      });
      return null;
    }
  }, [address, publicClient, writeContractAsync]);

  // Make refund total public for tax disclosure
  const makeRefundTotalPublic = useCallback(async () => {
    if (!address) {
      toast.error("Please connect wallet");
      return null;
    }

    const toastId = toast.loading("Making refund total publicly decryptable...");

    try {
      const hash = await writeContractAsync({
        address: GATEWAY_ADDRESS,
        abi: [parseAbiItem("function makeMerchantRefundTotalPublic()")],
        functionName: "makeMerchantRefundTotalPublic",
        gas: 200000n,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      toast.success("Refund total is now publicly decryptable", { id: toastId });
      return hash;
    } catch (err: any) {
      console.error("[MerchantOps] Failed:", err);
      toast.error(err?.shortMessage || "Failed to make refund total public", {
        id: toastId,
      });
      return null;
    }
  }, [address, publicClient, writeContractAsync]);

  return {
    getPayment,
    makeTotalPublic,
    makeRefundTotalPublic,
    isPending,
  };
}
