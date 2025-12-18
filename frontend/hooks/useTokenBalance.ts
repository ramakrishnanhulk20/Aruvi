/**
 * Hook to get balance for any ERC7984 token
 */

import { useAccount, useReadContract } from "wagmi";
import { parseAbiItem } from "viem";
import type { ConfidentialToken } from "@/lib/tokenRegistry";

export function useTokenBalance(token: ConfidentialToken) {
  const { address } = useAccount();

  // Get underlying ERC20 balance
  const { data: erc20Balance, refetch: refetchErc20 } = useReadContract({
    address: token.underlyingAddress,
    abi: [parseAbiItem("function balanceOf(address) view returns (uint256)")],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get confidential balance handle
  const { data: confidentialBalanceHandle, refetch: refetchConfidential } = useReadContract({
    address: token.wrapperAddress,
    abi: [parseAbiItem("function confidentialBalanceOf(address) view returns (bytes32)")],
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get ERC20 allowance to wrapper
  const { data: erc20Allowance, refetch: refetchAllowance } = useReadContract({
    address: token.underlyingAddress,
    abi: [parseAbiItem("function allowance(address,address) view returns (uint256)")],
    functionName: "allowance",
    args: address ? [address, token.wrapperAddress] : undefined,
    query: { enabled: !!address },
  });

  const hasConfidentialTokens = confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64));

  return {
    erc20Balance,
    confidentialBalanceHandle,
    erc20Allowance,
    hasConfidentialTokens,
    refetch: async () => {
      await Promise.all([refetchErc20(), refetchConfidential(), refetchAllowance()]);
    },
  };
}
