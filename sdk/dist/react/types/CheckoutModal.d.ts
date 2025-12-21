/**
 * Aruvi Checkout Modal
 * Handles the checkout popup/modal for processing payments
 */
import type { AruviConfig, PaymentRequest, AruviCallbacks } from './types';
export declare class CheckoutModal {
    private config;
    private modal;
    private iframe;
    private callbacks;
    private styleElement;
    private messageHandler;
    constructor(config: AruviConfig);
    /**
     * Inject modal styles into the document
     */
    private injectStyles;
    /**
     * Get the app URL based on environment
     */
    private getAppUrl;
    /**
     * Build the checkout URL with parameters
     */
    private buildCheckoutUrl;
    /**
     * Create the modal DOM structure
     */
    private createModal;
    /**
     * Setup message listener for iframe communication
     */
    private setupMessageListener;
    /**
     * Open the checkout modal
     */
    open(payment: PaymentRequest, callbacks?: AruviCallbacks): void;
    /**
     * Close the checkout modal
     */
    close(cancelled?: boolean): void;
    /**
     * Check if modal is currently open
     */
    isOpen(): boolean;
    /**
     * Destroy the checkout modal and cleanup
     */
    destroy(): void;
}
