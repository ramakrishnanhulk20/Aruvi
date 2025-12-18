"use client";

import { useCallback, useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
  useSignTypedData,
} from "wagmi";
import { parseAbiItem, formatUnits } from "viem";
import toast from "react-hot-toast";
import { CONTRACTS, WRAPPER_ABI, ERC20_ABI } from "@/lib/contracts";
import { useFhevmDecrypt } from "./useFhevm";
import { getDefaultToken, type ConfidentialToken } from "@/lib/tokenRegistry";

// ERC7984 Confidential Token Hook
export function useConfidentialToken(token?: ConfidentialToken) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();
  const { decryptHandle, isDecrypting, isReady: fhevmReady } = useFhevmDecrypt();
  const [decryptedBalance, setDecryptedBalance] = useState<bigint | null>(null);
  const [lastOperatorSet, setLastOperatorSet] = useState<number>(0);
  const [operatorDuration, setOperatorDuration] = useState<number>(3600); // Track duration in seconds

  // Use provided token or default from registry
  const activeToken = token || getDefaultToken();
  const WRAPPER_ADDRESS = activeToken.wrapperAddress as `0x${string}`;
  const UNDERLYING_ADDRESS = activeToken.underlyingAddress as `0x${string}`;

  // Load operator info from localStorage on mount
  useEffect(() => {
    if (address && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`operator_set_${address}_${WRAPPER_ADDRESS}`);
      const storedDuration = localStorage.getItem(`operator_duration_${address}_${WRAPPER_ADDRESS}`);
      if (stored) setLastOperatorSet(parseInt(stored));
      if (storedDuration) setOperatorDuration(parseInt(storedDuration));
      if (stored) setLastOperatorSet(parseInt(stored));
      if (storedDuration) setOperatorDuration(parseInt(storedDuration));
    }
  }, [address]);

  // Get underlying ERC20 balance
  const { data: erc20Balance, refetch: refetchErc20 } = useReadContract({
    address: UNDERLYING_ADDRESS,
    abi: [parseAbiItem("function balanceOf(address) view returns (uint256)")],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get ERC20 allowance to wrapper
  const { data: erc20Allowance, refetch: refetchAllowance } = useReadContract({
    address: UNDERLYING_ADDRESS,
    abi: [parseAbiItem("function allowance(address,address) view returns (uint256)")],
    functionName: "allowance",
    args: address ? [address, WRAPPER_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Get confidential balance handle
  const { data: confidentialBalanceHandle, refetch: refetchConfidential } = useReadContract({
    address: WRAPPER_ADDRESS,
    abi: [parseAbiItem("function confidentialBalanceOf(address) view returns (bytes32)")],
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get operator status for gateway
  const { data: isOperatorValid, refetch: refetchOperator } = useReadContract({
    address: WRAPPER_ADDRESS,
    abi: [parseAbiItem("function isOperator(address,address) view returns (bool)")],
    functionName: "isOperator",
    args: address ? [address, CONTRACTS.GATEWAY] : undefined,
    query: { 
      enabled: !!address,
      refetchOnWindowFocus: true,
      refetchInterval: 5000, // Poll every 5 seconds
    },
  });

  // Token info
  const { data: decimals } = useReadContract({
    address: WRAPPER_ADDRESS,
    abi: [parseAbiItem("function decimals() view returns (uint8)")],
    functionName: "decimals",
  });

  const { data: symbol } = useReadContract({
    address: WRAPPER_ADDRESS,
    abi: [parseAbiItem("function symbol() view returns (string)")],
    functionName: "symbol",
  });

  // Write hooks
  const { writeContractAsync, isPending } = useWriteContract();

  // Approve ERC20 for wrapping
  const approveForWrap = useCallback(
    async (amount: bigint) => {
      if (!address) {
        toast.error("Please connect wallet");
        return null;
      }

      const toastId = toast.loading("Approving tokens...");

      try {
        // Reset to 0 first (for tokens like USDT that require this)
        if ((erc20Allowance as bigint) > 0n) {
          await writeContractAsync({
            address: UNDERLYING_ADDRESS,
            abi: [parseAbiItem("function approve(address,uint256) returns (bool)")],
            functionName: "approve",
            args: [WRAPPER_ADDRESS, 0n],
            gas: 80000n,
          });
        }

        const hash = await writeContractAsync({
          address: UNDERLYING_ADDRESS,
          abi: [parseAbiItem("function approve(address,uint256) returns (bool)")],
          functionName: "approve",
          args: [WRAPPER_ADDRESS, amount],
          gas: 80000n,
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Approval successful", { id: toastId });
        await refetchAllowance();
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { shortMessage?: string };
        console.error("[Token] Approval failed:", error);
        toast.error(error?.shortMessage || "Approval failed", { id: toastId });
        return null;
      }
    },
    [address, erc20Allowance, writeContractAsync, refetchAllowance]
  );

  // Wrap ERC20 → Confidential Token
  const wrap = useCallback(
    async (amount: bigint) => {
      if (!address) {
        toast.error("Please connect wallet");
        return null;
      }

      if (!amount || amount <= 0n) {
        toast.error("Invalid amount");
        return null;
      }

      const toastId = toast.loading("Wrapping tokens...");

      try {
        const hash = await writeContractAsync({
          address: WRAPPER_ADDRESS,
          abi: [parseAbiItem("function wrap(address to, uint256 amount)")],
          functionName: "wrap",
          args: [address, amount],
          gas: 500000n, // Increased gas buffer
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Tokens wrapped successfully! 🔐", { id: toastId });
        await Promise.all([refetchErc20(), refetchConfidential()]);
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { shortMessage?: string; message?: string };
        console.error("[Token] Wrap failed:", error);
        
        let errorMsg = "Wrap failed";
        if (error?.message?.includes("insufficient allowance")) {
          errorMsg = "Insufficient allowance - please approve first";
        } else if (error?.message?.includes("insufficient balance")) {
          errorMsg = "Insufficient balance";
        } else if (error?.shortMessage) {
          errorMsg = error.shortMessage;
        }
        
        toast.error(errorMsg, { id: toastId });
        return null;
      }
    },
    [address, writeContractAsync, refetchErc20, refetchConfidential]
  );

  // Set gateway as operator
  const setGatewayAsOperator = useCallback(
    async (durationSeconds: number = 3600) => {
      if (!address) {
        toast.error("Please connect wallet");
        return null;
      }

      if (durationSeconds <= 0) {
        toast.error("Duration must be positive");
        return null;
      }

      const toastId = toast.loading("Setting operator permission...");

      try {
        // Calculate until timestamp
        const currentTime = Math.floor(Date.now() / 1000);
        const until = currentTime + durationSeconds;

        const hash = await writeContractAsync({
          address: WRAPPER_ADDRESS,
          abi: [parseAbiItem("function setOperator(address operator, uint48 until)")],
          functionName: "setOperator",
          args: [CONTRACTS.GATEWAY, until],
          gas: 300000n,
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Gateway authorized! ✅", { id: toastId });
        // Track when operator was set and its duration
        const now = Date.now();
        setLastOperatorSet(now);
        setOperatorDuration(durationSeconds);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`operator_set_${address}_${WRAPPER_ADDRESS}`, now.toString());
          localStorage.setItem(`operator_duration_${address}_${WRAPPER_ADDRESS}`, durationSeconds.toString());
        }
        await refetchOperator();
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { shortMessage?: string; message?: string };
        console.error("[Token] Set operator failed:", error);
        
        let errorMsg = "Failed to set operator";
        if (error?.message?.includes("already operator")) {
          errorMsg = "Gateway is already authorized";
        } else if (error?.shortMessage) {
          errorMsg = error.shortMessage;
        }
        
        toast.error(errorMsg, { id: toastId });
        return null;
      }
    },
    [address, writeContractAsync, refetchOperator]
  );

  // Calculate if operator is expiring soon (less than 15 minutes remaining)
  const operatorExpiryWarning = (() => {
    if (!isOperatorValid || !lastOperatorSet || !operatorDuration) return false;
    const now = Date.now();
    const elapsed = now - lastOperatorSet; // milliseconds
    const remaining = (operatorDuration * 1000) - elapsed; // milliseconds
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    return remaining > 0 && remaining < fifteenMinutes;
  })();

  // Decrypt balance
  const decryptBalance = useCallback(
    async () => {
      if (!confidentialBalanceHandle || !fhevmReady) {
        return null;
      }

      const signTypedData = async (typedData: any) => {
        return signTypedDataAsync(typedData);
      };

      const decrypted = await decryptHandle(
        confidentialBalanceHandle as string,
        WRAPPER_ADDRESS,
        signTypedData
      );

      if (decrypted !== null) {
        setDecryptedBalance(decrypted);
      }

      return decrypted;
    },
    [confidentialBalanceHandle, fhevmReady, decryptHandle, signTypedDataAsync]
  );

  // Direct transfer (bypasses gateway)
  const { writeContractAsync: writeTransfer, isPending: isTransferPending } = useWriteContract();
  const directTransfer = useCallback(
    async (recipient: `0x${string}`, amount: bigint) => {
      if (!address) {
        toast.error("Connect wallet first");
        return;
      }

      try {
        const hash = await writeTransfer({
          address: WRAPPER_ADDRESS,
          abi: WRAPPER_ABI,
          functionName: "transfer",
          args: [recipient, amount],
        });

        toast.loading("Transfer in progress...", { id: hash });

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          toast.success("Transfer successful!", { id: hash });
          // Refresh balances
          await Promise.all([refetchConfidential(), refetchErc20()]);
        } else {
          toast.error("Transfer failed", { id: hash });
        }

        return hash;
      } catch (error: any) {
        console.error("Transfer error:", error);
        toast.error(error.message || "Transfer failed");
        throw error;
      }
    },
    [address, writeTransfer, WRAPPER_ADDRESS, publicClient, refetchConfidential, refetchErc20]
  );

  return {
    // Balances
    erc20Balance: erc20Balance as bigint | undefined,
    confidentialBalanceHandle: confidentialBalanceHandle as `0x${string}` | undefined,
    decryptedBalance,
    // Allowance & Operator
    erc20Allowance: erc20Allowance as bigint | undefined,
    isOperatorValid: Boolean(isOperatorValid),
    operatorExpiryWarning,
    // Token info
    decimals: (decimals as number) || 6,
    symbol: (symbol as string) || "cUSDC",
    // State
    isPending,
    isDecrypting,
    fhevmReady,
    isTransferPending,
    // Actions
    approveForWrap,
    wrap,
    setGatewayAsOperator,
    decryptBalance,
    directTransfer,
    // Refresh
    refetch: () =>
      Promise.all([
        refetchErc20(),
        refetchAllowance(),
        refetchConfidential(),
        refetchOperator(),
      ]),
  };
}

// Mint test tokens (for xUSD faucet)
export function useMintTestTokens(token?: ConfidentialToken) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  // Use provided token or default from registry
  const activeToken = token || getDefaultToken();
  const UNDERLYING_ADDRESS = activeToken.underlyingAddress as `0x${string}`;

  const mint = useCallback(
    async (amount: bigint) => {
      if (!address) {
        toast.error("Please connect wallet");
        return null;
      }

      const toastId = toast.loading("Minting test tokens...");

      try {
        const hash = await writeContractAsync({
          address: UNDERLYING_ADDRESS,
          abi: [parseAbiItem("function mintTo(uint256)")],
          functionName: "mintTo",
          args: [amount],
          gas: 200000n, // Increased gas limit
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Test tokens minted! 🪙", { id: toastId });
        return hash;
      } catch (err: unknown) {
        const error = err as Error & { shortMessage?: string; message?: string };
        console.error("[Token] Mint failed:", error);
        console.error("[Token] Full error:", {
          message: error?.message,
          shortMessage: error?.shortMessage,
          amount: amount.toString(),
          address: UNDERLYING_ADDRESS,
        });
        
        let errorMsg = "Mint failed";
        if (error?.message?.includes("execution reverted")) {
          errorMsg = "Transaction reverted - check if mint limit exceeded";
        } else if (error?.message?.includes("user rejected")) {
          errorMsg = "Transaction rejected";
        } else if (error?.shortMessage) {
          errorMsg = error.shortMessage;
        }
        
        toast.error(errorMsg, { id: toastId });
        return null;
      }
    },
    [address, publicClient, writeContractAsync, UNDERLYING_ADDRESS]
  );

  return { mint, isPending };
}
