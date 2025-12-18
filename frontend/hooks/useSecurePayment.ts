/**
 * @fileoverview React Hook for Secure Payment Verification
 *
 * Provides a React hook for making confidential payments with
 * server-side verification.
 */

'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useFhevm } from './useFhevm';
import type { DecryptionSignature, PaymentVerifyResult, PaymentRequirement } from '@/lib/payment';

// Contract addresses
const GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_GATEWAY_ADDRESS || '0xEcC6317E60C3115A782D577d02322eDc3c27119a';
const CUSD_ADDRESS = process.env.NEXT_PUBLIC_CUSD_ADDRESS || '0x0e564030B638EA79307a54b7B7f8105f27d04E80';

// ABI fragments for the contracts we need
const TOKEN_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

const GATEWAY_ABI = [
  'function pay(uint256 productId, uint256 quantity, address token) external returns (bytes32)',
  'event PaymentReceived(bytes32 indexed paymentId, address indexed buyer, uint256 indexed productId, uint256 quantity, address token, uint256 amount)',
];

interface UseSecurePaymentOptions {
  gatewayAddress?: string;
  tokenAddress?: string;
}

interface PaymentState {
  isPaying: boolean;
  isVerifying: boolean;
  error: string | null;
  txHash: string | null;
  verifiedAmount: bigint | null;
}

export function useSecurePayment(options: UseSecurePaymentOptions = {}) {
  const { instance: fhevmInstance } = useFhevm();
  const gatewayAddress = options.gatewayAddress || GATEWAY_ADDRESS;
  const tokenAddress = options.tokenAddress || CUSD_ADDRESS;

  const [state, setState] = useState<PaymentState>({
    isPaying: false,
    isVerifying: false,
    error: null,
    txHash: null,
    verifiedAmount: null,
  });

  /**
   * Creates a decryption signature for payment verification.
   */
  const createDecryptionSignature = useCallback(async (
    signer: ethers.JsonRpcSigner
  ): Promise<DecryptionSignature> => {
    if (!fhevmInstance) {
      throw new Error('FHEVM not initialized');
    }

    const userAddress = await signer.getAddress() as `0x${string}`;
    const contractAddresses = [gatewayAddress, tokenAddress];

    // Generate ephemeral keypair
    const ephemeralWallet = ethers.Wallet.createRandom();
    const publicKey = ephemeralWallet.publicKey;
    const privateKey = ephemeralWallet.privateKey;

    // Get current timestamp
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1; // Short-lived for security

    // Create EIP-712 signature
    const eip712 = (fhevmInstance as any).createEIP712(
      publicKey,
      contractAddresses,
      startTimestamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message
    );

    return {
      signature,
      publicKey,
      privateKey,
      userAddress,
      contractAddresses: contractAddresses as `0x${string}`[],
      startTimestamp,
      durationDays,
    };
  }, [fhevmInstance, gatewayAddress, tokenAddress]);

  /**
   * Makes a confidential payment and verifies it server-side.
   */
  const pay = useCallback(async (
    signer: ethers.JsonRpcSigner,
    productId: bigint | number,
    quantity: bigint | number,
    maxAmount: bigint
  ): Promise<PaymentVerifyResult> => {
    setState(prev => ({ ...prev, isPaying: true, error: null }));

    try {
      const provider = signer.provider;
      if (!provider) {
        throw new Error('Signer has no provider');
      }

      const userAddress = await signer.getAddress();

      // 1. Check and approve token if needed
      const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
      const allowance = await token.allowance(userAddress, gatewayAddress);
      
      if (BigInt(allowance) < maxAmount) {
        console.log('[SecurePayment] Approving token spend...');
        const approveTx = await token.approve(gatewayAddress, maxAmount);
        await approveTx.wait();
      }

      // 2. Make the payment
      console.log('[SecurePayment] Making payment...');
      const gateway = new ethers.Contract(gatewayAddress, GATEWAY_ABI, signer);
      const payTx = await gateway.pay(productId, quantity, tokenAddress);
      const receipt = await payTx.wait();

      if (!receipt) {
        throw new Error('Transaction failed');
      }

      const txHash = receipt.hash;
      setState(prev => ({ ...prev, txHash, isPaying: false, isVerifying: true }));

      // 3. Create decryption signature
      console.log('[SecurePayment] Creating decryption signature...');
      const decryptionSignature = await createDecryptionSignature(signer);

      // 4. Verify payment server-side
      console.log('[SecurePayment] Verifying payment...');
      const network = await provider.getNetwork();
      
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txHash,
          chainId: Number(network.chainId),
          userAddress,
          network: 'sepolia',
          decryptionSignature,
        }),
      });

      const result: PaymentVerifyResult = await response.json();

      if (result.isValid) {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          verifiedAmount: BigInt(result.amount!),
        }));
      } else {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          error: result.invalidReason || 'Payment verification failed',
        }));
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState(prev => ({
        ...prev,
        isPaying: false,
        isVerifying: false,
        error: errorMessage,
      }));

      return {
        isValid: false,
        invalidReason: errorMessage,
      };
    }
  }, [gatewayAddress, tokenAddress, createDecryptionSignature]);

  /**
   * Makes a confidential payment for an HTTP 402 protected resource.
   */
  const payForResource = useCallback(async (
    signer: ethers.JsonRpcSigner,
    resourceUrl: string,
    requirement: PaymentRequirement
  ): Promise<{ success: boolean; resource?: Response; error?: string }> => {
    const result = await pay(
      signer,
      0n, // productId - default to 0
      1n, // quantity - default to 1
      BigInt(requirement.maxAmountRequired)
    );

    if (!result.isValid) {
      return { success: false, error: result.invalidReason };
    }

    // Create payment proof header
    const paymentProof = btoa(JSON.stringify({
      txHash: state.txHash,
      chainId: requirement.chainId,
    }));

    // Fetch the protected resource
    const response = await fetch(resourceUrl, {
      headers: {
        'X-Payment-Proof': paymentProof,
      },
    });

    if (response.ok) {
      return { success: true, resource: response };
    }

    return { success: false, error: `Failed to access resource: ${response.status}` };
  }, [pay, state.txHash]);

  /**
   * Resets the payment state.
   */
  const reset = useCallback(() => {
    setState({
      isPaying: false,
      isVerifying: false,
      error: null,
      txHash: null,
      verifiedAmount: null,
    });
  }, []);

  return {
    ...state,
    pay,
    payForResource,
    reset,
    isLoading: state.isPaying || state.isVerifying,
  };
}

export default useSecurePayment;
