/**
 * @aruvi/sdk
 * Official JavaScript SDK for Aruvi - Privacy-First Payments
 * 
 * @example
 * // Initialize SDK
 * const aruvi = new Aruvi({
 *   merchantAddress: '0x...',
 *   environment: 'testnet',
 * });
 * 
 * // Open checkout
 * aruvi.checkout({
 *   amount: '25.00',
 *   description: 'Premium Plan',
 *   onSuccess: (result) => {
 *     console.log('Payment successful!', result.paymentId);
 *   },
 *   onError: (error) => {
 *     console.error('Payment failed:', error.message);
 *   },
 * });
 */

import type {
  AruviConfig,
  PaymentRequest,
  AruviCallbacks,
  AruviButtonOptions,
  PaymentResult,
  PaymentError,
  AruviEventType,
  AruviEventHandler,
  AruviEvent,
} from './types';
import { CheckoutModal } from './CheckoutModal';
import { AruviButton, createAruviButton } from './AruviButton';
import { verifyPayment, verifyPaymentByTxHash } from './verify';
import { CONTRACTS, DEFAULTS } from './constants';

// Re-export types
export type * from './types';

// Re-export utilities
export { verifyPayment, verifyPaymentByTxHash } from './verify';
export { createAruviButton, AruviButton } from './AruviButton';

/**
 * Main Aruvi SDK class
 */
export class Aruvi {
  private config: AruviConfig;
  private modal: CheckoutModal;
  private eventListeners: Map<AruviEventType, Set<AruviEventHandler>> = new Map();

  /**
   * SDK Version
   */
  static readonly VERSION = '1.0.0';

  /**
   * Create a new Aruvi SDK instance
   */
  constructor(config: AruviConfig) {
    if (!config.merchantAddress) {
      throw new Error('Aruvi: merchantAddress is required');
    }

    if (!config.merchantAddress.startsWith('0x') || config.merchantAddress.length !== 42) {
      throw new Error('Aruvi: Invalid merchantAddress format');
    }

    this.config = {
      environment: 'testnet',
      ...config,
    };

    this.modal = new CheckoutModal(this.config);
  }

  /**
   * Open the checkout modal
   */
  checkout(
    payment: PaymentRequest & AruviCallbacks
  ): void {
    const { onSuccess, onError, onCancel, onOpen, onClose, onPending, ...paymentData } = payment;

    // Validate amount
    if (!paymentData.amount || isNaN(parseFloat(paymentData.amount))) {
      throw new Error('Aruvi: Valid amount is required');
    }

    const callbacks: AruviCallbacks = {
      onSuccess: (result) => {
        this.emit('payment:success', result);
        onSuccess?.(result);
      },
      onError: (error) => {
        this.emit('payment:error', error);
        onError?.(error);
      },
      onCancel: () => {
        this.emit('payment:cancel');
        onCancel?.();
      },
      onOpen: () => {
        this.emit('checkout:open');
        onOpen?.();
      },
      onClose: () => {
        this.emit('checkout:close');
        onClose?.();
      },
      onPending: (txHash) => {
        this.emit('payment:pending', { transactionHash: txHash });
        onPending?.(txHash);
      },
    };

    this.modal.open(paymentData, callbacks);
  }

  /**
   * Close the checkout modal
   */
  closeCheckout(): void {
    this.modal.close(true);
  }

  /**
   * Check if checkout is open
   */
  isCheckoutOpen(): boolean {
    return this.modal.isOpen();
  }

  /**
   * Create a payment button
   */
  createButton(
    container: HTMLElement | string,
    payment: PaymentRequest & AruviCallbacks,
    buttonOptions?: AruviButtonOptions
  ): AruviButton {
    const button = createAruviButton(container, buttonOptions);
    
    button.onClick(() => {
      button.setLoading(true);
      
      this.checkout({
        ...payment,
        onSuccess: (result) => {
          button.setLoading(false);
          payment.onSuccess?.(result);
        },
        onError: (error) => {
          button.setLoading(false);
          payment.onError?.(error);
        },
        onCancel: () => {
          button.setLoading(false);
          payment.onCancel?.();
        },
        onClose: () => {
          button.setLoading(false);
          payment.onClose?.();
        },
      });
    });

    return button;
  }

  /**
   * Generate a payment link
   */
  createPaymentLink(payment: PaymentRequest): string {
    const appUrl = this.config.appUrl || DEFAULTS.appUrl[this.config.environment || 'testnet'];
    const params = new URLSearchParams();
    
    params.set('to', this.config.merchantAddress);
    params.set('amount', payment.amount);
    
    if (payment.reference) params.set('ref', payment.reference);
    if (payment.description) params.set('desc', payment.description);
    if (payment.metadata) params.set('meta', JSON.stringify(payment.metadata));
    
    return `${appUrl}/pay?${params.toString()}`;
  }

  /**
   * Verify a payment
   */
  async verifyPayment(paymentId: `0x${string}`, expectedAmount?: string): Promise<boolean> {
    const result = await verifyPayment({
      paymentId,
      merchantAddress: this.config.merchantAddress,
      expectedAmount,
      environment: this.config.environment,
      rpcUrl: this.config.rpcUrl,
    });
    return result.verified;
  }

  /**
   * Verify a payment by transaction hash
   */
  async verifyTransaction(transactionHash: `0x${string}`): Promise<boolean> {
    const result = await verifyPaymentByTxHash(transactionHash, {
      merchantAddress: this.config.merchantAddress,
      environment: this.config.environment,
      rpcUrl: this.config.rpcUrl,
    });
    return result.verified;
  }

  /**
   * Add event listener
   */
  on(event: AruviEventType, handler: AruviEventHandler): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(handler);
    };
  }

  /**
   * Remove event listener
   */
  off(event: AruviEventType, handler: AruviEventHandler): void {
    this.eventListeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event
   */
  private emit(type: AruviEventType, data?: any): void {
    const event: AruviEvent = { type, data };
    this.eventListeners.get(type)?.forEach((handler) => handler(event));
  }

  /**
   * Get current configuration
   */
  getConfig(): AruviConfig {
    return { ...this.config };
  }

  /**
   * Get contract addresses
   */
  getContracts() {
    const env = this.config.environment || 'testnet';
    return CONTRACTS[env as keyof typeof CONTRACTS];
  }

  /**
   * Destroy the SDK instance
   */
  destroy(): void {
    this.modal.destroy();
    this.eventListeners.clear();
  }
}

// ============================================================================
// UMD/Browser Global
// ============================================================================

/**
 * Global instance for simple usage
 */
let globalInstance: Aruvi | null = null;

/**
 * Initialize the global Aruvi instance
 */
export function init(config: AruviConfig): Aruvi {
  if (globalInstance) {
    globalInstance.destroy();
  }
  globalInstance = new Aruvi(config);
  return globalInstance;
}

/**
 * Get the global instance (must call init first)
 */
export function getInstance(): Aruvi {
  if (!globalInstance) {
    throw new Error('Aruvi: Call Aruvi.init() first');
  }
  return globalInstance;
}

/**
 * Quick checkout using global instance
 */
export function checkout(payment: PaymentRequest & AruviCallbacks): void {
  getInstance().checkout(payment);
}

/**
 * Quick button creation using global instance
 */
export function button(
  container: HTMLElement | string,
  payment: PaymentRequest & AruviCallbacks,
  options?: AruviButtonOptions
): AruviButton {
  return getInstance().createButton(container, payment, options);
}

// Default export
export default Aruvi;

// For UMD builds, attach to window
if (typeof window !== 'undefined') {
  (window as any).Aruvi = {
    Aruvi,
    init,
    getInstance,
    checkout,
    button,
    createButton: createAruviButton,
    verifyPayment,
    verifyPaymentByTxHash,
    VERSION: Aruvi.VERSION,
  };
}
