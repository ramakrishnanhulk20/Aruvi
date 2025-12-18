/**
 * Token row component for displaying ERC7984 tokens
 */

"use client";

import { ExternalLink, Coins, Lock, Eye, Loader2 } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useFhevmDecrypt } from "@/hooks/useFhevm";
import { useSignTypedData } from "wagmi";
import { formatTokenAmount } from "@/lib/utils";
import type { ConfidentialToken } from "@/lib/tokenRegistry";
import { useState } from "react";

interface TokenRowProps {
  token: ConfidentialToken;
  address: `0x${string}` | undefined;
  showDecryptedBalance: boolean;
}

export function TokenRow({ token, address, showDecryptedBalance }: TokenRowProps) {
  const { erc20Balance, confidentialBalanceHandle, hasConfidentialTokens } = useTokenBalance(token);
  const { decryptHandle, isDecrypting } = useFhevmDecrypt();
  const { signTypedDataAsync } = useSignTypedData();
  const [decryptedBalance, setDecryptedBalance] = useState<bigint | null>(null);
  const [isDecryptingThis, setIsDecryptingThis] = useState(false);

  const handleDecrypt = async () => {
    if (confidentialBalanceHandle && address && decryptHandle) {
      setIsDecryptingThis(true);
      try {
        const result = await decryptHandle(
          confidentialBalanceHandle as `0x${string}`,
          token.wrapperAddress,
          signTypedDataAsync
        );
        if (result !== null) {
          setDecryptedBalance(result);
        }
      } finally {
        setIsDecryptingThis(false);
      }
    }
  };

  if (!address) return null;

  return (
    <>
      {/* Underlying ERC20 */}
      <div className="p-4 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <Coins className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <h4 className="font-pixel text-sm uppercase tracking-wider">{token.underlyingSymbol}</h4>
              <p className="text-xs text-dark-500 dark:text-dark-400">{token.name.replace('Confidential ', '')} (ERC20)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">
              {formatTokenAmount(erc20Balance || 0n, token.decimals, "")}
            </p>
            <a
              href={`https://sepolia.etherscan.io/token/${token.underlyingAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-500 hover:underline flex items-center gap-1 justify-end"
            >
              View on Etherscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Confidential Token */}
      <div className="p-4 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h4 className="font-pixel text-sm uppercase tracking-wider">{token.symbol}</h4>
              <p className="text-xs text-dark-500 dark:text-dark-400">{token.name} (ERC7984)</p>
            </div>
          </div>
          <div className="text-right">
            {decryptedBalance !== null ? (
              <p className="font-mono text-lg font-bold">
                {formatTokenAmount(decryptedBalance, token.decimals, "")}
              </p>
            ) : hasConfidentialTokens ? (
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="info" className="text-xs">🔐 Encrypted</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDecrypt}
                  disabled={isDecryptingThis || isDecrypting}
                  className="h-6 px-2 text-xs"
                >
                  {isDecryptingThis ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ) : (
              <p className="font-mono text-lg text-dark-400">0.00</p>
            )}
            <a
              href={`https://sepolia.etherscan.io/token/${token.wrapperAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-500 hover:underline flex items-center gap-1 justify-end"
            >
              View on Etherscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
