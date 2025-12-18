/**
 * Hook to manage custom ERC7984 tokens
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import toast from "react-hot-toast";
import { CONTRACTS } from "@/lib/contracts";
import type { ConfidentialToken } from "@/lib/tokenRegistry";

const CUSTOM_TOKENS_KEY = "aruvi_custom_tokens";

export function useCustomTokens() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [customTokens, setCustomTokens] = useState<ConfidentialToken[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Load custom tokens from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
      if (stored) {
        try {
          setCustomTokens(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to load custom tokens:", e);
        }
      }
    }
  }, []);

  // Save custom tokens to localStorage
  const saveCustomTokens = useCallback((tokens: ConfidentialToken[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens));
      setCustomTokens(tokens);
    }
  }, []);

  /**
   * Validate if address is a legitimate ERC7984 token
   */
  const validateToken = useCallback(
    async (wrapperAddress: `0x${string}`): Promise<ConfidentialToken | null> => {
      if (!publicClient) {
        toast.error("Wallet not connected");
        return null;
      }

      setIsValidating(true);

      try {
        // 1. Check if contract exists
        const code = await publicClient.getBytecode({ address: wrapperAddress });
        if (!code || code === "0x") {
          toast.error("No contract found at this address");
          return null;
        }

        // 2. Check if it implements ERC7984 interface
        const [symbol, decimals, underlying] = await Promise.all([
          publicClient.readContract({
            address: wrapperAddress,
            abi: [parseAbiItem("function symbol() view returns (string)")],
            functionName: "symbol",
          }),
          publicClient.readContract({
            address: wrapperAddress,
            abi: [parseAbiItem("function decimals() view returns (uint8)")],
            functionName: "decimals",
          }),
          publicClient.readContract({
            address: wrapperAddress,
            abi: [parseAbiItem("function underlying() view returns (address)")],
            functionName: "underlying",
          }),
        ]);

        // 3. Verify it has confidentialBalanceOf (ERC7984 specific)
        await publicClient.readContract({
          address: wrapperAddress,
          abi: [parseAbiItem("function confidentialBalanceOf(address) view returns (bytes32)")],
          functionName: "confidentialBalanceOf",
          args: [address || "0x0000000000000000000000000000000000000000"],
        });

        // 4. Get underlying token info
        const [underlyingSymbol, name] = await Promise.all([
          publicClient.readContract({
            address: underlying as `0x${string}`,
            abi: [parseAbiItem("function symbol() view returns (string)")],
            functionName: "symbol",
          }),
          publicClient.readContract({
            address: wrapperAddress,
            abi: [parseAbiItem("function name() view returns (string)")],
            functionName: "name",
          }),
        ]);

        // 5. Check if token is whitelisted in PaymentGateway (optional but recommended)
        // Note: This assumes gateway has acceptedTokens mapping
        // If gateway accepts all ERC7984 tokens, skip this check
        try {
          const isAccepted = await publicClient.readContract({
            address: CONTRACTS.GATEWAY,
            abi: [parseAbiItem("function acceptedTokens(address) view returns (bool)")],
            functionName: "acceptedTokens",
            args: [wrapperAddress],
          });

          if (!isAccepted) {
            toast.error("⚠️ Token not whitelisted in gateway. Payments may fail.", { duration: 5000 });
            // Don't return null - allow adding but warn user
          }
        } catch (e) {
          // Gateway might not have acceptedTokens mapping - that's OK
          console.log("Gateway doesn't have token whitelist (accepting all tokens)");
        }

        const token: ConfidentialToken = {
          name: name as string,
          symbol: symbol as string,
          wrapperAddress,
          underlyingAddress: underlying as `0x${string}`,
          underlyingSymbol: underlyingSymbol as string,
          decimals: Number(decimals),
          isDefault: false,
        };

        return token;
      } catch (error: any) {
        console.error("Token validation failed:", error);
        
        if (error.message?.includes("confidentialBalanceOf")) {
          toast.error("Not a valid ERC7984 token - missing confidentialBalanceOf");
        } else if (error.message?.includes("underlying")) {
          toast.error("Not a wrapper token - missing underlying()");
        } else {
          toast.error("Invalid token contract");
        }
        
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    [publicClient, address]
  );

  /**
   * Add a custom token - submits for admin approval
   */
  const addCustomToken = useCallback(
    async (wrapperAddress: `0x${string}`) => {
      if (!address) {
        toast.error("Please connect wallet");
        return false;
      }

      const validated = await validateToken(wrapperAddress);
      if (!validated) {
        return false;
      }

      // Submit to admin for approval
      try {
        const response = await fetch("/api/tokens/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wrapperAddress: validated.wrapperAddress,
            underlyingAddress: validated.underlyingAddress,
            symbol: validated.symbol,
            name: validated.name,
            decimals: validated.decimals,
            underlyingSymbol: validated.underlyingSymbol,
            submittedBy: address,
            validationResults: {
              isLegitContract: true,
              hasERC7984Interface: true,
              hasUnderlyingToken: true,
              isWhitelistedInGateway: false, // Will be checked by admin
              validationErrors: [],
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            toast.error("Token already submitted. Awaiting admin approval.");
          } else {
            toast.error(data.error || "Failed to submit token");
          }
          return false;
        }

        toast.success(`${validated.symbol} submitted for admin approval! 🎉`);
        return true;
      } catch (error) {
        console.error("Submission error:", error);
        toast.error("Failed to submit token");
        return false;
      }
    },
    [address, validateToken]
  );

  /**
   * Remove a custom token
   */
  const removeCustomToken = useCallback(
    (wrapperAddress: string) => {
      const newTokens = customTokens.filter(
        (t) => t.wrapperAddress.toLowerCase() !== wrapperAddress.toLowerCase()
      );
      saveCustomTokens(newTokens);
      toast.success("Token removed");
    },
    [customTokens, saveCustomTokens]
  );

  return {
    customTokens,
    isValidating,
    addCustomToken,
    removeCustomToken,
    validateToken,
  };
}
