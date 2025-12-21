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
import type { AruviConfig, PaymentRequest, AruviCallbacks, AruviButtonOptions, AruviEventType, AruviEventHandler } from './types';
import { AruviButton } from './AruviButton';
export type * from './types';
export { verifyPayment, verifyPaymentByTxHash } from './verify';
export { createAruviButton, AruviButton } from './AruviButton';
/**
 * Main Aruvi SDK class
 */
export declare class Aruvi {
    private config;
    private modal;
    private eventListeners;
    /**
     * SDK Version
     */
    static readonly VERSION = "1.0.0";
    /**
     * Create a new Aruvi SDK instance
     */
    constructor(config: AruviConfig);
    /**
     * Open the checkout modal
     */
    checkout(payment: PaymentRequest & AruviCallbacks): void;
    /**
     * Close the checkout modal
     */
    closeCheckout(): void;
    /**
     * Check if checkout is open
     */
    isCheckoutOpen(): boolean;
    /**
     * Create a payment button
     */
    createButton(container: HTMLElement | string, payment: PaymentRequest & AruviCallbacks, buttonOptions?: AruviButtonOptions): AruviButton;
    /**
     * Generate a payment link
     */
    createPaymentLink(payment: PaymentRequest): string;
    /**
     * Verify a payment
     */
    verifyPayment(paymentId: `0x${string}`, expectedAmount?: string): Promise<boolean>;
    /**
     * Verify a payment by transaction hash
     */
    verifyTransaction(transactionHash: `0x${string}`): Promise<boolean>;
    /**
     * Add event listener
     */
    on(event: AruviEventType, handler: AruviEventHandler): () => void;
    /**
     * Remove event listener
     */
    off(event: AruviEventType, handler: AruviEventHandler): void;
    /**
     * Emit an event
     */
    private emit;
    /**
     * Get current configuration
     */
    getConfig(): AruviConfig;
    /**
     * Get contract addresses
     */
    getContracts(): {
        readonly PaymentGateway: "0x05798f2304A5B9263243C8002c87D4f59546958D";
        readonly ConfidentialUSDCWrapper: "0x...";
        readonly chainId: 11155111;
        readonly chainName: "Sepolia";
        readonly rpcUrl: "https://rpc.sepolia.org";
    } | {
        readonly PaymentGateway: "0x...";
        readonly ConfidentialUSDCWrapper: "0x...";
        readonly chainId: 1;
        readonly chainName: "Ethereum";
        readonly rpcUrl: "https://eth.llamarpc.com";
    };
    /**
     * Destroy the SDK instance
     */
    destroy(): void;
}
/**
 * Initialize the global Aruvi instance
 */
export declare function init(config: AruviConfig): Aruvi;
/**
 * Get the global instance (must call init first)
 */
export declare function getInstance(): Aruvi;
/**
 * Quick checkout using global instance
 */
export declare function checkout(payment: PaymentRequest & AruviCallbacks): void;
/**
 * Quick button creation using global instance
 */
export declare function button(container: HTMLElement | string, payment: PaymentRequest & AruviCallbacks, options?: AruviButtonOptions): AruviButton;
export default Aruvi;
