/**
 * Payment Gateway Hook (DEPRECATED)
 * 
 * This hook is deprecated. Please use useAruviGateway instead.
 * This file provides backwards compatibility only.
 * 
 * Migration guide:
 * - processPayment() -> send()
 * - sendToUser() -> send()
 * - No more merchant registration (privacy-first design)
 */

import { useAruviGateway } from './useAruviGateway';

export interface PaymentParams {
  recipient: `0x${string}`;
  amount: bigint;
  note?: string;
}

export interface PaymentResult {
  hash: `0x${string}`;
  paymentId: `0x${string}`;
}

/**
 * @deprecated Use useAruviGateway instead
 */
export function usePaymentGateway() {
  const aruvi = useAruviGateway();

  // Map old interface to new
  const processPayment = async (params: PaymentParams): Promise<PaymentResult | null> => {
    const result = await aruvi.send({
      recipient: params.recipient,
      amount: params.amount,
    });
    
    if (!result) return null;
    
    return {
      hash: result.hash,
      paymentId: result.id,
    };
  };

  const sendToUser = async (
    recipient: `0x${string}`,
    amount: bigint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _note?: string
  ): Promise<PaymentResult | null> => {
    return processPayment({ recipient, amount });
  };

  return {
    // State
    isMerchant: false, // No merchants in new design
    isProcessing: aruvi.isProcessing,
    isEncrypting: aruvi.isEncrypting,
    isWritePending: aruvi.isWritePending,
    fhevmReady: aruvi.fhevmReady,
    lastPayment: null,

    // Actions (mapped to new hook)
    registerAsMerchant: async () => {
      console.warn('[DEPRECATED] Merchant registration removed in privacy-first design');
      return null;
    },
    processPayment,
    sendToUser,
    refetchMerchant: () => Promise.resolve(),
  };
}

export default usePaymentGateway;
