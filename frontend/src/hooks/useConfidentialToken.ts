/**
 * Confidential Token Hook
 * Manages ERC7984 confidential wrapper operations:
 * - Balance queries (ERC20 and confidential)
 * - Wrap/Unwrap operations
 * - Operator management
 * - Balance decryption
 */

import { useCallback, useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { parseAbi, formatUnits } from 'viem';
import { CONTRACTS, TOKEN_CONFIG } from '../lib/contracts';
import { useFhevmEncrypt } from './useFhevmEncrypt';
import { useFhevmDecrypt } from './useFhevmDecrypt';
import { useFhevm } from '../providers/useFhevmContext';

// ABIs
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

const WRAPPER_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function confidentialBalanceOf(address) view returns (bytes32)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function isOperator(address owner, address operator) view returns (bool)',
  'function wrap(address to, uint256 amount)',
  'function unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof)',
  'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)',
  'function setOperator(address operator, uint48 until)',
]);

export function useConfidentialToken() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const { isReady: fhevmReady } = useFhevm();
  const { encryptAmount, isEncrypting } = useFhevmEncrypt();
  const { decryptHandle, isDecrypting } = useFhevmDecrypt();

  // Local state
  const [decryptedBalance, setDecryptedBalance] = useState<bigint | null>(null);
  const [isWrapping, setIsWrapping] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [isSettingOperator, setIsSettingOperator] = useState(false);

  // Read ERC20 USDC balance
  const { 
    data: erc20Balance, 
    refetch: refetchErc20,
    isLoading: isLoadingErc20 
  } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read ERC20 allowance for wrapper
  const { 
    data: erc20Allowance, 
    refetch: refetchAllowance 
  } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.WRAPPER] : undefined,
    query: { enabled: !!address },
  });

  // Read confidential balance handle
  const { 
    data: confidentialBalanceHandle, 
    refetch: refetchConfidential,
    isLoading: isLoadingConfidential 
  } = useReadContract({
    address: CONTRACTS.WRAPPER,
    abi: WRAPPER_ABI,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Check if Zama gateway is set as operator (required for decryption)
  const { 
    data: isOperatorValid, 
    refetch: refetchOperator 
  } = useReadContract({
    address: CONTRACTS.WRAPPER,
    abi: WRAPPER_ABI,
    functionName: 'isOperator',
    args: address ? [address, CONTRACTS.ZAMA_GATEWAY] : undefined,
    query: { enabled: !!address },
  });

  // Formatted balances
  const formattedErc20Balance = useMemo(() => {
    if (!erc20Balance) return '0.00';
    return formatUnits(erc20Balance as bigint, TOKEN_CONFIG.decimals);
  }, [erc20Balance]);

  const formattedDecryptedBalance = useMemo(() => {
    if (decryptedBalance === null || decryptedBalance === undefined) return null;
    return formatUnits(decryptedBalance, TOKEN_CONFIG.decimals);
  }, [decryptedBalance]);

  // Approve USDC for wrapping
  const approveForWrap = useCallback(
    async (amount: bigint) => {
      if (!address || !isConnected) {
        console.error('[Token] Not connected');
        return null;
      }

      try {
        console.log('[Token] Approving', amount.toString(), 'for wrapper...');
        
        const hash = await writeContractAsync({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.WRAPPER, amount],
        });

        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === 'reverted') {
            throw new Error('USDC approval transaction reverted.');
          }
        }

        await refetchAllowance();
        console.log('[Token] Approval successful');
        return hash;
      } catch (err) {
        console.error('[Token] Approval failed:', err);
        throw err;
      }
    },
    [address, isConnected, writeContractAsync, publicClient, refetchAllowance]
  );

  // Wrap USDC to confidential cUSDC
  const wrap = useCallback(
    async (amount: bigint) => {
      if (!address || !isConnected) {
        console.error('[Token] Not connected');
        return null;
      }

      setIsWrapping(true);

      try {
        // Check allowance
        const currentAllowance = (erc20Allowance as bigint) || 0n;
        if (currentAllowance < amount) {
          console.log('[Token] Insufficient allowance, approving...');
          await approveForWrap(amount);
        }

        console.log('[Token] Wrapping', amount.toString(), 'USDC...');
        
        const hash = await writeContractAsync({
          address: CONTRACTS.WRAPPER,
          abi: WRAPPER_ABI,
          functionName: 'wrap',
          args: [address, amount],
          gas: 500000n,
        });

        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === 'reverted') {
            throw new Error('Wrap transaction reverted. Check USDC balance and approval.');
          }
        }

        await Promise.all([refetchErc20(), refetchConfidential()]);
        console.log('[Token] Wrap successful');
        return hash;
      } catch (err) {
        console.error('[Token] Wrap failed:', err);
        throw err;
      } finally {
        setIsWrapping(false);
      }
    },
    [address, isConnected, erc20Allowance, approveForWrap, writeContractAsync, publicClient, refetchErc20, refetchConfidential]
  );

  // Unwrap cUSDC to USDC
  const unwrap = useCallback(
    async (amount: bigint) => {
      if (!address || !isConnected || !fhevmReady) {
        console.error('[Token] Not ready for unwrap');
        return null;
      }

      setIsUnwrapping(true);

      try {
        console.log('[Token] Encrypting amount for unwrap...');
        
        const encrypted = await encryptAmount(amount, CONTRACTS.WRAPPER);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        console.log('[Token] Unwrapping', amount.toString(), 'cUSDC...');
        
        const hash = await writeContractAsync({
          address: CONTRACTS.WRAPPER,
          abi: WRAPPER_ABI,
          functionName: 'unwrap',
          args: [address, address, encrypted.handles[0], encrypted.inputProof],
          gas: 800000n,
        });

        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === 'reverted') {
            throw new Error('Unwrap transaction reverted. Check cUSDC balance.');
          }
        }

        await Promise.all([refetchErc20(), refetchConfidential()]);
        console.log('[Token] Unwrap successful');
        return hash;
      } catch (err) {
        console.error('[Token] Unwrap failed:', err);
        throw err;
      } finally {
        setIsUnwrapping(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync, publicClient, refetchErc20, refetchConfidential]
  );

  // Set Zama gateway as operator (required for decryption)
  const setGatewayAsOperator = useCallback(async () => {
    if (!address || !isConnected) {
      console.error('[Token] Not connected');
      return null;
    }

    setIsSettingOperator(true);

    try {
      // Set operator for 1 year
      const until = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      
      console.log('[Token] Setting Zama gateway as operator until:', new Date(until * 1000));
      
      const hash = await writeContractAsync({
        address: CONTRACTS.WRAPPER,
        abi: WRAPPER_ABI,
        functionName: 'setOperator',
        args: [CONTRACTS.ZAMA_GATEWAY, until],
        gas: 100000n,
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === 'reverted') {
          throw new Error('Set operator transaction reverted.');
        }
      }

      await refetchOperator();
      console.log('[Token] Operator set successfully');
      return hash;
    } catch (err) {
      console.error('[Token] Set operator failed:', err);
      throw err;
    } finally {
      setIsSettingOperator(false);
    }
  }, [address, isConnected, writeContractAsync, publicClient, refetchOperator]);

  // Decrypt confidential balance
  const decryptBalance = useCallback(async () => {
    if (!confidentialBalanceHandle || !fhevmReady) {
      console.log('[Token] Cannot decrypt: no handle or FHEVM not ready');
      return null;
    }

    try {
      console.log('[Token] Decrypting balance...');
      
      const decrypted = await decryptHandle(
        confidentialBalanceHandle as string,
        CONTRACTS.WRAPPER
      );

      if (decrypted !== null) {
        setDecryptedBalance(decrypted);
        console.log('[Token] Balance decrypted:', decrypted.toString());
      }

      return decrypted;
    } catch (err) {
      console.error('[Token] Decrypt failed:', err);
      return null;
    }
  }, [confidentialBalanceHandle, fhevmReady, decryptHandle]);

  // Confidential transfer (cUSDC to cUSDC, stays encrypted)
  const [isTransferring, setIsTransferring] = useState(false);
  
  const confidentialTransfer = useCallback(
    async (to: `0x${string}`, amount: bigint) => {
      if (!address || !isConnected || !fhevmReady) {
        console.error('[Token] Not ready for transfer');
        return null;
      }

      setIsTransferring(true);

      try {
        console.log('[Token] Encrypting amount for transfer...');
        
        const encrypted = await encryptAmount(amount, CONTRACTS.WRAPPER);
        if (!encrypted || !encrypted.handles[0]) {
          throw new Error('Failed to encrypt amount');
        }

        console.log('[Token] Transferring', amount.toString(), 'cUSDC to', to);
        
        const hash = await writeContractAsync({
          address: CONTRACTS.WRAPPER,
          abi: WRAPPER_ABI,
          functionName: 'confidentialTransfer',
          args: [to, encrypted.handles[0], encrypted.inputProof],
          gas: 800000n,
        });

        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === 'reverted') {
            throw new Error('Transfer reverted on-chain. Check your cUSDC balance.');
          }
        }

        await refetchConfidential();
        console.log('[Token] Transfer successful');
        return hash;
      } catch (err) {
        console.error('[Token] Transfer failed:', err);
        throw err;
      } finally {
        setIsTransferring(false);
      }
    },
    [address, isConnected, fhevmReady, encryptAmount, writeContractAsync, publicClient, refetchConfidential]
  );

  // Refetch all data
  const refetch = useCallback(() => {
    return Promise.all([
      refetchErc20(),
      refetchAllowance(),
      refetchConfidential(),
      refetchOperator(),
    ]);
  }, [refetchErc20, refetchAllowance, refetchConfidential, refetchOperator]);

  return {
    // Balances
    erc20Balance: erc20Balance as bigint | undefined,
    formattedErc20Balance,
    confidentialBalanceHandle: confidentialBalanceHandle as `0x${string}` | undefined,
    decryptedBalance,
    formattedDecryptedBalance,
    
    // Allowance & Operator
    erc20Allowance: erc20Allowance as bigint | undefined,
    isOperatorValid: Boolean(isOperatorValid),
    
    // Token info
    decimals: TOKEN_CONFIG.decimals,
    symbol: TOKEN_CONFIG.symbol,
    underlyingSymbol: TOKEN_CONFIG.underlyingSymbol,
    
    // Loading states
    isLoading: isLoadingErc20 || isLoadingConfidential,
    isWritePending,
    isWrapping,
    isUnwrapping,
    isTransferring,
    isSettingOperator,
    isEncrypting,
    isDecrypting,
    fhevmReady,
    
    // Actions
    approveForWrap,
    wrap,
    unwrap,
    confidentialTransfer,
    setGatewayAsOperator,
    decryptBalance,
    refetch,
  };
}

export default useConfidentialToken;
