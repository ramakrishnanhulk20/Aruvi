import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';

/**
 * Aruvi SDK Constants
 * Contract addresses, ABIs, and configuration
 */
// ============================================================================
// Contract Addresses
// ============================================================================
const CONTRACTS = {
    testnet: {
        PaymentGateway: '0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b',
        ConfidentialUSDCWrapper: '0xf99376BE228E8212C3C9b8B746683C96C1517e8B',
        chainId: 11155111,
        chainName: 'Sepolia',
        rpcUrl: 'https://rpc.sepolia.org', // Default public RPC - override with custom rpcUrl in config
    },
    mainnet: {
        PaymentGateway: '0x...', // Add when mainnet deployed
        ConfidentialUSDCWrapper: '0x...',
        chainId: 1,
        chainName: 'Ethereum',
        rpcUrl: 'https://eth.llamarpc.com',
    },
};
// ============================================================================
// Default Configuration
// ============================================================================
const DEFAULTS = {
    appUrl: {
        testnet: 'http://localhost:5173', // Change to https://testnet.aruvi.io when deployed
        mainnet: 'https://app.aruvi.io',
    }};
// ============================================================================
// Checkout Iframe Messages
// ============================================================================
const MESSAGE_TYPES = {
    // From checkout to merchant
    CHECKOUT_READY: 'ARUVI_CHECKOUT_READY',
    CHECKOUT_CLOSED: 'ARUVI_CHECKOUT_CLOSED',
    PAYMENT_PENDING: 'ARUVI_PAYMENT_PENDING',
    PAYMENT_SUCCESS: 'ARUVI_PAYMENT_SUCCESS',
    PAYMENT_ERROR: 'ARUVI_PAYMENT_ERROR',
    PAYMENT_CANCELLED: 'ARUVI_PAYMENT_CANCELLED',
};
// ============================================================================
// Styling
// ============================================================================
const BUTTON_STYLES = {
    base: `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    text-decoration: none;
  `,
    sizes: {
        small: `
      height: 36px;
      padding: 0 16px;
      font-size: 14px;
      border-radius: 8px;
    `,
        medium: `
      height: 44px;
      padding: 0 24px;
      font-size: 15px;
      border-radius: 10px;
    `,
        large: `
      height: 52px;
      padding: 0 32px;
      font-size: 16px;
      border-radius: 12px;
    `,
    },
    variants: {
        primary: `
      background: linear-gradient(135deg, #0070ba 0%, #003087 100%);
      color: #ffffff;
    `,
        secondary: `
      background: #f5f7fa;
      color: #003087;
    `,
        outline: `
      background: transparent;
      color: #0070ba;
      border: 2px solid #0070ba;
    `,
        dark: `
      background: #1a1a1a;
      color: #ffffff;
    `,
    },
    hover: {
        primary: 'filter: brightness(1.1); transform: translateY(-1px);',
        secondary: 'background: #e8ecf2;',
        outline: 'background: rgba(0, 112, 186, 0.08);',
        dark: 'background: #2a2a2a;',
    },
    disabled: `
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `,
};
const MODAL_STYLES = `
  .aruvi-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: aruvi-fade-in 0.2s ease;
  }
  
  .aruvi-modal-container {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 420px;
    max-height: 90vh;
    overflow: hidden;
    animation: aruvi-slide-up 0.3s ease;
    position: relative;
  }
  
  .aruvi-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #0070ba 0%, #003087 100%);
    color: white;
  }
  
  .aruvi-modal-title {
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .aruvi-modal-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: background 0.2s;
  }
  
  .aruvi-modal-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .aruvi-modal-content {
    padding: 0;
  }
  
  .aruvi-modal-iframe {
    width: 100%;
    height: 500px;
    border: none;
  }
  
  .aruvi-modal-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: 16px;
    color: #6b7280;
  }
  
  .aruvi-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #0070ba;
    border-radius: 50%;
    animation: aruvi-spin 1s linear infinite;
  }
  
  @keyframes aruvi-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes aruvi-slide-up {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  
  @keyframes aruvi-spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 480px) {
    .aruvi-modal-container {
      max-width: 100%;
      max-height: 100%;
      height: 100%;
      border-radius: 0;
    }
    
    .aruvi-modal-iframe {
      height: calc(100vh - 60px);
    }
  }
`;
// ============================================================================
// Logo SVG
// ============================================================================
const ARUVI_LOGO_SVG = `
<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.2"/>
  <path d="M10 20L16 12L22 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 16L16 12L19 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/**
 * Aruvi Checkout Modal
 * Handles the checkout popup/modal for processing payments
 */
class CheckoutModal {
    constructor(config) {
        this.modal = null;
        this.iframe = null;
        this.callbacks = {};
        this.styleElement = null;
        this.messageHandler = null;
        this.config = config;
        this.injectStyles();
    }
    /**
     * Inject modal styles into the document
     */
    injectStyles() {
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
    getAppUrl() {
        if (this.config.appUrl) {
            return this.config.appUrl;
        }
        const env = this.config.environment || 'testnet';
        return DEFAULTS.appUrl[env];
    }
    /**
     * Build the checkout URL with parameters
     */
    buildCheckoutUrl(payment) {
        const baseUrl = this.getAppUrl();
        const params = new URLSearchParams();
        // Required parameters
        params.set('merchant', this.config.merchantAddress);
        params.set('amount', payment.amount);
        params.set('sdk', 'true');
        // Optional parameters
        if (payment.reference)
            params.set('ref', payment.reference);
        if (payment.description)
            params.set('desc', payment.description);
        if (payment.customerEmail)
            params.set('email', payment.customerEmail);
        if (payment.metadata)
            params.set('meta', JSON.stringify(payment.metadata));
        if (payment.successUrl)
            params.set('success', payment.successUrl);
        if (payment.cancelUrl)
            params.set('cancel', payment.cancelUrl);
        return `${baseUrl}/checkout?${params.toString()}`;
    }
    /**
     * Create the modal DOM structure
     */
    createModal(payment) {
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
        iframe.setAttribute('allow', 'clipboard-write; web3');
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
        const escapeHandler = (e) => {
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
    setupMessageListener() {
        this.messageHandler = (event) => {
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
                    const result = {
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
                    const error = {
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
    open(payment, callbacks = {}) {
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
    close(cancelled = false) {
        if (!this.modal)
            return;
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
    isOpen() {
        return this.modal !== null;
    }
    /**
     * Destroy the checkout modal and cleanup
     */
    destroy() {
        this.close(false);
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }
}

/**
 * Aruvi Button
 * Embeddable "Pay with Aruvi" button for vanilla JS
 */
let AruviButton$1 = class AruviButton {
    constructor(container, options = {}) {
        this.button = null;
        this.clickHandler = null;
        // Get container element
        if (typeof container === 'string') {
            const el = document.querySelector(container);
            if (!el) {
                throw new Error(`Aruvi: Container element "${container}" not found`);
            }
            this.container = el;
        }
        else {
            this.container = container;
        }
        this.options = { ...AruviButton.defaultOptions, ...options };
        this.render();
    }
    /**
     * Generate button styles
     */
    getStyles() {
        const { variant, size, disabled } = this.options;
        let styles = BUTTON_STYLES.base;
        styles += BUTTON_STYLES.sizes[size];
        styles += BUTTON_STYLES.variants[variant];
        if (disabled) {
            styles += BUTTON_STYLES.disabled;
        }
        return styles.replace(/\s+/g, ' ').trim();
    }
    /**
     * Render the button
     */
    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.className = `aruvi-button ${this.options.className}`.trim();
        this.button.disabled = this.options.disabled;
        this.button.setAttribute('style', this.getStyles());
        // Content
        let content = '';
        if (this.options.showLogo) {
            content += `<span class="aruvi-button-logo">${ARUVI_LOGO_SVG}</span>`;
        }
        content += `<span class="aruvi-button-label">${this.options.label}</span>`;
        this.button.innerHTML = content;
        // Hover effects
        const variant = this.options.variant;
        this.button.onmouseenter = () => {
            if (!this.options.disabled && this.button) {
                this.button.setAttribute('style', this.getStyles() + BUTTON_STYLES.hover[variant]);
            }
        };
        this.button.onmouseleave = () => {
            if (this.button) {
                this.button.setAttribute('style', this.getStyles());
            }
        };
        // Clear container and append button
        this.container.innerHTML = '';
        this.container.appendChild(this.button);
    }
    /**
     * Set click handler
     */
    onClick(handler) {
        this.clickHandler = handler;
        if (this.button) {
            this.button.onclick = handler;
        }
        return this;
    }
    /**
     * Update button options
     */
    update(options) {
        this.options = { ...this.options, ...options };
        this.render();
        if (this.clickHandler) {
            this.onClick(this.clickHandler);
        }
        return this;
    }
    /**
     * Set loading state
     */
    setLoading(loading) {
        if (!this.button)
            return this;
        if (loading) {
            this.button.disabled = true;
            this.button.innerHTML = `
        <span class="aruvi-spinner" style="
          width: 20px;
          height: 20px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: aruvi-spin 1s linear infinite;
        "></span>
        <span>Processing...</span>
      `;
            // Add animation if not already present
            if (!document.getElementById('aruvi-button-styles')) {
                const style = document.createElement('style');
                style.id = 'aruvi-button-styles';
                style.textContent = `
          @keyframes aruvi-spin {
            to { transform: rotate(360deg); }
          }
        `;
                document.head.appendChild(style);
            }
        }
        else {
            this.button.disabled = this.options.disabled;
            this.render();
            if (this.clickHandler) {
                this.onClick(this.clickHandler);
            }
        }
        return this;
    }
    /**
     * Enable the button
     */
    enable() {
        this.options.disabled = false;
        if (this.button) {
            this.button.disabled = false;
            this.button.setAttribute('style', this.getStyles());
        }
        return this;
    }
    /**
     * Disable the button
     */
    disable() {
        this.options.disabled = true;
        if (this.button) {
            this.button.disabled = true;
            this.button.setAttribute('style', this.getStyles());
        }
        return this;
    }
    /**
     * Get the button element
     */
    getElement() {
        return this.button;
    }
    /**
     * Destroy the button
     */
    destroy() {
        if (this.button) {
            this.button.remove();
            this.button = null;
        }
        this.clickHandler = null;
    }
};
AruviButton$1.defaultOptions = {
    label: 'Pay with Aruvi',
    variant: 'primary',
    size: 'medium',
    showLogo: true,
    disabled: false,
    className: '',
};
/**
 * Factory function to create buttons
 */
function createAruviButton(container, options) {
    return new AruviButton$1(container, options);
}

/**
 * Aruvi Payment Verification
 * Server-side utilities for verifying payments
 */
/**
 * Verify a payment on the blockchain
 * Can be used server-side with any HTTP client
 */
async function verifyPayment(options) {
    const env = options.environment || 'testnet';
    const rpcUrl = options.rpcUrl || CONTRACTS[env].rpcUrl;
    const contractAddress = CONTRACTS[env].PaymentGateway;
    try {
        // Encode the function call for getPaymentInfo(bytes32 paymentId)
        // Function selector: keccak256("getPaymentInfo(bytes32)").slice(0, 10)
        const functionSelector = '0xc6610657'; // getPaymentInfo(bytes32)
        const encodedPaymentId = options.paymentId.slice(2).padStart(64, '0');
        const data = functionSelector + encodedPaymentId;
        // Make RPC call
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                    {
                        to: contractAddress,
                        data: data,
                    },
                    'latest',
                ],
            }),
        });
        const result = await response.json();
        if (result.error) {
            return {
                verified: false,
                error: result.error.message || 'RPC error',
            };
        }
        // Decode the result
        const decoded = decodePaymentResult(result.result);
        if (!decoded) {
            return {
                verified: false,
                error: 'Payment not found',
            };
        }
        // Validate merchant address
        if (decoded.recipient.toLowerCase() !== options.merchantAddress.toLowerCase()) {
            return {
                verified: false,
                error: 'Merchant address mismatch',
            };
        }
        // Check if payment was refunded
        if (decoded.isRefunded) {
            return {
                verified: false,
                error: 'Payment was refunded',
            };
        }
        // Note: Amount is encrypted on-chain, so we cannot verify it here
        // The amount validation must be done through other means if needed
        const payment = {
            success: true,
            paymentId: options.paymentId,
            transactionHash: '0x', // Would need additional lookup
            amount: '0', // Amount is encrypted - cannot be read from chain
            customerAddress: decoded.sender,
            merchantAddress: decoded.recipient,
            blockNumber: 0, // Would need additional lookup
            timestamp: decoded.timestamp,
        };
        return {
            verified: true,
            payment,
        };
    }
    catch (error) {
        return {
            verified: false,
            error: error instanceof Error ? error.message : 'Verification failed',
        };
    }
}
/**
 * Decode payment result from RPC response
 * Returns: (address sender, address recipient, address token, uint256 timestamp, bool isRefunded)
 */
function decodePaymentResult(hexData) {
    if (!hexData || hexData === '0x' || hexData.length < 66) {
        return null;
    }
    // Remove '0x' prefix
    const data = hexData.slice(2);
    // Decode: (address sender, address recipient, address token, uint256 timestamp, bool isRefunded)
    const sender = '0x' + data.slice(24, 64);
    const recipient = '0x' + data.slice(88, 128);
    const token = '0x' + data.slice(152, 192);
    const timestamp = parseInt(data.slice(192, 256), 16);
    const isRefunded = parseInt(data.slice(256, 320), 16) !== 0;
    // Check if payment exists (sender should not be zero address)
    if (sender === '0x0000000000000000000000000000000000000000') {
        return null;
    }
    return { sender, recipient, token, timestamp, isRefunded };
}
/**
 * Format units (like ethers.formatUnits)
 */
function formatUnits(value, decimals) {
    const str = value.toString().padStart(decimals + 1, '0');
    const whole = str.slice(0, -decimals) || '0';
    const fraction = str.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
}
/**
 * Verify payment by transaction hash
 */
async function verifyPaymentByTxHash(transactionHash, options) {
    const env = options.environment || 'testnet';
    const rpcUrl = options.rpcUrl || CONTRACTS[env].rpcUrl;
    try {
        // Get transaction receipt
        const receiptResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getTransactionReceipt',
                params: [transactionHash],
            }),
        });
        const receiptResult = await receiptResponse.json();
        if (receiptResult.error || !receiptResult.result) {
            return {
                verified: false,
                error: 'Transaction not found',
            };
        }
        const receipt = receiptResult.result;
        // Check transaction status
        if (receipt.status !== '0x1') {
            return {
                verified: false,
                error: 'Transaction failed',
            };
        }
        // Look for PaymentSent event
        // PaymentSent(bytes32 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount)
        const paymentSentTopic = '0x' + 'PaymentSent(bytes32,address,address,uint256)'
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '')
            .padEnd(64, '0'); // Simplified - in production, use proper keccak256
        const paymentLog = receipt.logs?.find((log) => log.address.toLowerCase() === CONTRACTS[env].PaymentGateway.toLowerCase());
        if (!paymentLog) {
            return {
                verified: false,
                error: 'Payment event not found in transaction',
            };
        }
        // Extract payment details from log
        const paymentId = paymentLog.topics[1];
        const sender = ('0x' + paymentLog.topics[2].slice(26));
        const recipient = ('0x' + paymentLog.topics[3].slice(26));
        const amount = BigInt(paymentLog.data);
        // Validate merchant
        if (recipient.toLowerCase() !== options.merchantAddress.toLowerCase()) {
            return {
                verified: false,
                error: 'Merchant address mismatch',
            };
        }
        const payment = {
            success: true,
            paymentId,
            transactionHash,
            amount: formatUnits(amount, 6),
            customerAddress: sender,
            merchantAddress: recipient,
            blockNumber: parseInt(receipt.blockNumber, 16),
            timestamp: Date.now(),
        };
        return {
            verified: true,
            payment,
        };
    }
    catch (error) {
        return {
            verified: false,
            error: error instanceof Error ? error.message : 'Verification failed',
        };
    }
}

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
/**
 * Main Aruvi SDK class
 */
class Aruvi {
    /**
     * Create a new Aruvi SDK instance
     */
    constructor(config) {
        this.eventListeners = new Map();
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
    checkout(payment) {
        const { onSuccess, onError, onCancel, onOpen, onClose, onPending, ...paymentData } = payment;
        // Validate amount
        if (!paymentData.amount || isNaN(parseFloat(paymentData.amount))) {
            throw new Error('Aruvi: Valid amount is required');
        }
        const callbacks = {
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
    closeCheckout() {
        this.modal.close(true);
    }
    /**
     * Check if checkout is open
     */
    isCheckoutOpen() {
        return this.modal.isOpen();
    }
    /**
     * Create a payment button
     */
    createButton(container, payment, buttonOptions) {
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
    createPaymentLink(payment) {
        const appUrl = this.config.appUrl || DEFAULTS.appUrl[this.config.environment || 'testnet'];
        const params = new URLSearchParams();
        params.set('to', this.config.merchantAddress);
        params.set('amount', payment.amount);
        if (payment.reference)
            params.set('ref', payment.reference);
        if (payment.description)
            params.set('desc', payment.description);
        if (payment.metadata)
            params.set('meta', JSON.stringify(payment.metadata));
        return `${appUrl}/pay?${params.toString()}`;
    }
    /**
     * Verify a payment
     */
    async verifyPayment(paymentId, expectedAmount) {
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
    async verifyTransaction(transactionHash) {
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
    on(event, handler) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(handler);
        // Return unsubscribe function
        return () => {
            this.eventListeners.get(event)?.delete(handler);
        };
    }
    /**
     * Remove event listener
     */
    off(event, handler) {
        this.eventListeners.get(event)?.delete(handler);
    }
    /**
     * Emit an event
     */
    emit(type, data) {
        const event = { type, data };
        this.eventListeners.get(type)?.forEach((handler) => handler(event));
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get contract addresses
     */
    getContracts() {
        const env = this.config.environment || 'testnet';
        return CONTRACTS[env];
    }
    /**
     * Destroy the SDK instance
     */
    destroy() {
        this.modal.destroy();
        this.eventListeners.clear();
    }
}
/**
 * SDK Version
 */
Aruvi.VERSION = '1.0.0';
// ============================================================================
// UMD/Browser Global
// ============================================================================
/**
 * Global instance for simple usage
 */
let globalInstance = null;
/**
 * Initialize the global Aruvi instance
 */
function init(config) {
    if (globalInstance) {
        globalInstance.destroy();
    }
    globalInstance = new Aruvi(config);
    return globalInstance;
}
/**
 * Get the global instance (must call init first)
 */
function getInstance() {
    if (!globalInstance) {
        throw new Error('Aruvi: Call Aruvi.init() first');
    }
    return globalInstance;
}
/**
 * Quick checkout using global instance
 */
function checkout(payment) {
    getInstance().checkout(payment);
}
/**
 * Quick button creation using global instance
 */
function button(container, payment, options) {
    return getInstance().createButton(container, payment, options);
}
// For UMD builds, attach to window
if (typeof window !== 'undefined') {
    window.Aruvi = {
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

const AruviContext = createContext(null);
const AruviProvider = ({ config, children }) => {
    const [aruvi, setAruvi] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    useEffect(() => {
        const instance = new Aruvi(config);
        setAruvi(instance);
        // Listen for checkout events
        const unsubOpen = instance.on('checkout:open', () => setIsCheckoutOpen(true));
        const unsubClose = instance.on('checkout:close', () => setIsCheckoutOpen(false));
        return () => {
            unsubOpen();
            unsubClose();
            instance.destroy();
        };
    }, [config.merchantAddress, config.environment, config.appUrl]);
    const checkout = useCallback((payment) => {
        aruvi?.checkout(payment);
    }, [aruvi]);
    const closeCheckout = useCallback(() => {
        aruvi?.closeCheckout();
    }, [aruvi]);
    const createPaymentLink = useCallback((payment) => {
        return aruvi?.createPaymentLink(payment) || '';
    }, [aruvi]);
    const verifyPayment = useCallback(async (paymentId, expectedAmount) => {
        return aruvi?.verifyPayment(paymentId, expectedAmount) || false;
    }, [aruvi]);
    const value = useMemo(() => ({
        aruvi,
        isReady: !!aruvi,
        checkout,
        closeCheckout,
        isCheckoutOpen,
        createPaymentLink,
        verifyPayment,
    }), [aruvi, isCheckoutOpen, checkout, closeCheckout, createPaymentLink, verifyPayment]);
    return jsx(AruviContext.Provider, { value: value, children: children });
};
// ============================================================================
// Hook
// ============================================================================
function useAruvi() {
    const context = useContext(AruviContext);
    if (!context) {
        throw new Error('useAruvi must be used within an AruviProvider');
    }
    return context;
}
const AruviButton = ({ payment, onSuccess, onError, onCancel, label = 'Pay with Aruvi', variant = 'primary', size = 'medium', showLogo = true, disabled = false, className = '', style, }) => {
    const { checkout, isCheckoutOpen } = useAruvi();
    const [isLoading, setIsLoading] = useState(false);
    const handleClick = useCallback(() => {
        if (isLoading || disabled)
            return;
        setIsLoading(true);
        checkout({
            ...payment,
            onSuccess: (result) => {
                setIsLoading(false);
                onSuccess?.(result);
            },
            onError: (error) => {
                setIsLoading(false);
                onError?.(error);
            },
            onCancel: () => {
                setIsLoading(false);
                onCancel?.();
            },
            onClose: () => {
                setIsLoading(false);
            },
        });
    }, [checkout, payment, onSuccess, onError, onCancel, isLoading, disabled]);
    const buttonStyle = useMemo(() => {
        // Convert string styles to object
        const styleObj = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            border: variant === 'outline' ? '2px solid #0070ba' : 'none',
            textDecoration: 'none',
            opacity: disabled || isLoading ? 0.5 : 1,
            pointerEvents: disabled || isLoading ? 'none' : 'auto',
            // Size
            height: size === 'small' ? '36px' : size === 'large' ? '52px' : '44px',
            padding: size === 'small' ? '0 16px' : size === 'large' ? '0 32px' : '0 24px',
            fontSize: size === 'small' ? '14px' : size === 'large' ? '16px' : '15px',
            borderRadius: size === 'small' ? '8px' : size === 'large' ? '12px' : '10px',
            // Variant
            background: variant === 'primary'
                ? 'linear-gradient(135deg, #0070ba 0%, #003087 100%)'
                : variant === 'secondary'
                    ? '#f5f7fa'
                    : variant === 'dark'
                        ? '#1a1a1a'
                        : 'transparent',
            color: variant === 'primary' || variant === 'dark'
                ? '#ffffff'
                : variant === 'secondary'
                    ? '#003087'
                    : '#0070ba',
            ...style,
        };
        return styleObj;
    }, [size, variant, disabled, isLoading, style]);
    return (jsx("button", { type: "button", className: `aruvi-button ${className}`, style: buttonStyle, onClick: handleClick, disabled: disabled || isLoading, children: isLoading ? (jsxs(Fragment, { children: [jsx("span", { style: {
                        width: '20px',
                        height: '20px',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'aruvi-spin 1s linear infinite',
                    } }), jsx("span", { children: "Processing..." })] })) : (jsxs(Fragment, { children: [showLogo && (jsx("span", { dangerouslySetInnerHTML: { __html: ARUVI_LOGO_SVG }, style: { display: 'flex' } })), jsx("span", { children: label })] })) }));
};
const CheckoutTrigger = ({ payment, onSuccess, onError, onCancel, children, }) => {
    const { checkout } = useAruvi();
    const [isLoading, setIsLoading] = useState(false);
    const handleClick = useCallback(() => {
        setIsLoading(true);
        checkout({
            ...payment,
            onSuccess: (result) => {
                setIsLoading(false);
                onSuccess?.(result);
            },
            onError: (error) => {
                setIsLoading(false);
                onError?.(error);
            },
            onCancel: () => {
                setIsLoading(false);
                onCancel?.();
            },
            onClose: () => {
                setIsLoading(false);
            },
        });
    }, [checkout, payment, onSuccess, onError, onCancel]);
    return jsx(Fragment, { children: children({ onClick: handleClick, isLoading }) });
};
const PaymentLink = ({ payment, children, className, style, newTab = false, }) => {
    const { createPaymentLink } = useAruvi();
    const link = createPaymentLink(payment);
    return (jsx("a", { href: link, className: className, style: style, target: newTab ? '_blank' : undefined, rel: newTab ? 'noopener noreferrer' : undefined, children: children || `Pay $${payment.amount}` }));
};
function usePaymentStatus(options) {
    const { aruvi } = useAruvi();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(null);
    const [error, setError] = useState(null);
    const verify = useCallback(async () => {
        if (!aruvi) {
            setError('Aruvi not initialized');
            return;
        }
        if (!options.paymentId && !options.transactionHash) {
            setError('Either paymentId or transactionHash is required');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            let verified = false;
            if (options.paymentId) {
                verified = await aruvi.verifyPayment(options.paymentId);
            }
            else if (options.transactionHash) {
                verified = await aruvi.verifyTransaction(options.transactionHash);
            }
            setIsVerified(verified);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setIsVerified(false);
        }
        finally {
            setIsLoading(false);
        }
    }, [aruvi, options.paymentId, options.transactionHash]);
    useEffect(() => {
        if (options.paymentId || options.transactionHash) {
            verify();
        }
    }, [options.paymentId, options.transactionHash, verify]);
    // Polling
    useEffect(() => {
        if (!options.pollInterval || isVerified === true) {
            return;
        }
        const interval = setInterval(verify, options.pollInterval);
        return () => clearInterval(interval);
    }, [options.pollInterval, isVerified, verify]);
    return { isLoading, isVerified, error, refetch: verify };
}
// ============================================================================
// Inject global styles
// ============================================================================
if (typeof document !== 'undefined') {
    const styleId = 'aruvi-react-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
      @keyframes aruvi-spin {
        to { transform: rotate(360deg); }
      }
    `;
        document.head.appendChild(style);
    }
}

export { AruviButton, AruviProvider, CheckoutTrigger, PaymentLink, useAruvi, usePaymentStatus };
//# sourceMappingURL=index.esm.js.map
