/**
 * Aruvi Checkout Modal
 * Handles the checkout popup/modal for processing payments
 */

import type {
  AruviConfig,
  PaymentRequest,
  AruviCallbacks,
  PaymentResult,
  PaymentError,
} from './types';
import { DEFAULTS, MESSAGE_TYPES, MODAL_STYLES, ARUVI_LOGO_SVG } from './constants';

export class CheckoutModal {
  private config: AruviConfig;
  private modal: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private callbacks: AruviCallbacks = {};
  private styleElement: HTMLStyleElement | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(config: AruviConfig) {
    this.config = config;
    this.injectStyles();
  }

  /**
   * Inject modal styles into the document
   */
  private injectStyles(): void {
    if (this.styleElement || document.getElementById('aruvi-modal-styles')) {
      return;
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'aruvi-modal-styles';
    this.styleElement.textContent = MODAL_STYLES;
    
    // Apply custom theme
    if (this.config.theme) {
      let customStyles = '';
      if (this.config.theme.primaryColor) {
        customStyles += `
          .aruvi-modal-header {
            background: ${this.config.theme.primaryColor};
          }
          .aruvi-spinner {
            border-top-color: ${this.config.theme.primaryColor};
          }
        `;
      }
      if (this.config.theme.borderRadius !== undefined) {
        customStyles += `
          .aruvi-modal-container {
            border-radius: ${this.config.theme.borderRadius}px;
          }
        `;
      }
      if (this.config.theme.fontFamily) {
        customStyles += `
          .aruvi-modal-overlay, .aruvi-modal-container {
            font-family: ${this.config.theme.fontFamily};
          }
        `;
      }
      this.styleElement.textContent += customStyles;
    }
    
    document.head.appendChild(this.styleElement);
  }

  /**
   * Get the app URL based on environment
   */
  private getAppUrl(): string {
    if (this.config.appUrl) {
      return this.config.appUrl;
    }
    const env = this.config.environment || 'testnet';
    return DEFAULTS.appUrl[env];
  }

  /**
   * Build the checkout URL with parameters
   */
  private buildCheckoutUrl(payment: PaymentRequest): string {
    const baseUrl = this.getAppUrl();
    const params = new URLSearchParams();
    
    // Required parameters
    params.set('merchant', this.config.merchantAddress);
    params.set('amount', payment.amount);
    params.set('sdk', 'true');
    
    // Optional parameters
    if (payment.reference) params.set('ref', payment.reference);
    if (payment.description) params.set('desc', payment.description);
    if (payment.customerEmail) params.set('email', payment.customerEmail);
    if (payment.metadata) params.set('meta', JSON.stringify(payment.metadata));
    if (payment.successUrl) params.set('success', payment.successUrl);
    if (payment.cancelUrl) params.set('cancel', payment.cancelUrl);
    
    return `${baseUrl}/checkout?${params.toString()}`;
  }

  /**
   * Create the modal DOM structure
   */
  private createModal(payment: PaymentRequest): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'aruvi-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'aruvi-modal-title');

    const container = document.createElement('div');
    container.className = 'aruvi-modal-container';

    // Header
    const header = document.createElement('div');
    header.className = 'aruvi-modal-header';

    const title = document.createElement('div');
    title.className = 'aruvi-modal-title';
    title.id = 'aruvi-modal-title';
    title.innerHTML = `${ARUVI_LOGO_SVG} <span>Aruvi Checkout</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'aruvi-modal-close';
    closeBtn.setAttribute('aria-label', 'Close checkout');
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    closeBtn.onclick = () => this.close(true);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement('div');
    content.className = 'aruvi-modal-content';

    // Loading state
    const loading = document.createElement('div');
    loading.className = 'aruvi-modal-loading';
    loading.innerHTML = `
      <div class="aruvi-spinner"></div>
      <p>Loading secure checkout...</p>
    `;
    content.appendChild(loading);

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'aruvi-modal-iframe';
    iframe.style.display = 'none';
    iframe.src = this.buildCheckoutUrl(payment);
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    
    iframe.onload = () => {
      loading.style.display = 'none';
      iframe.style.display = 'block';
    };

    content.appendChild(iframe);
    this.iframe = iframe;

    container.appendChild(header);
    container.appendChild(content);
    overlay.appendChild(container);

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.close(true);
      }
    };

    // Close on Escape key
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close(true);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return overlay;
  }

  /**
   * Setup message listener for iframe communication
   */
  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Validate origin
      const appUrl = this.getAppUrl();
      if (!event.origin.includes(new URL(appUrl).host)) {
        return;
      }

      const { type, data } = event.data || {};

      switch (type) {
        case MESSAGE_TYPES.CHECKOUT_READY:
          // Checkout loaded successfully
          break;

        case MESSAGE_TYPES.PAYMENT_PENDING:
          this.callbacks.onPending?.(data.transactionHash);
          break;

        case MESSAGE_TYPES.PAYMENT_SUCCESS:
          const result: PaymentResult = {
            success: true,
            paymentId: data.paymentId,
            transactionHash: data.transactionHash,
            amount: data.amount,
            customerAddress: data.customerAddress,
            merchantAddress: this.config.merchantAddress,
            blockNumber: data.blockNumber,
            timestamp: data.timestamp,
            reference: data.reference,
            metadata: data.metadata,
          };
          this.callbacks.onSuccess?.(result);
          this.close(false);
          break;

        case MESSAGE_TYPES.PAYMENT_ERROR:
          const error: PaymentError = {
            code: data.code || 'UNKNOWN',
            message: data.message || 'Payment failed',
            originalError: data.originalError,
          };
          this.callbacks.onError?.(error);
          break;

        case MESSAGE_TYPES.PAYMENT_CANCELLED:
        case MESSAGE_TYPES.CHECKOUT_CLOSED:
          this.close(true);
          break;
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Open the checkout modal
   */
  open(payment: PaymentRequest, callbacks: AruviCallbacks = {}): void {
    // Close any existing modal
    if (this.modal) {
      this.close(false);
    }

    this.callbacks = callbacks;
    this.modal = this.createModal(payment);
    this.setupMessageListener();

    // Add to DOM
    document.body.appendChild(this.modal);
    document.body.style.overflow = 'hidden';

    // Trigger callback
    this.callbacks.onOpen?.();
  }

  /**
   * Close the checkout modal
   */
  close(cancelled: boolean = false): void {
    if (!this.modal) return;

    // Remove message listener
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }

    // Remove modal
    this.modal.remove();
    this.modal = null;
    this.iframe = null;
    document.body.style.overflow = '';

    // Trigger callbacks
    this.callbacks.onClose?.();
    if (cancelled) {
      this.callbacks.onCancel?.();
    }
  }

  /**
   * Check if modal is currently open
   */
  isOpen(): boolean {
    return this.modal !== null;
  }

  /**
   * Destroy the checkout modal and cleanup
   */
  destroy(): void {
    this.close(false);
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
}
