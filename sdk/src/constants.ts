/**
 * Aruvi SDK Constants
 * Contract addresses, ABIs, and configuration
 */

// ============================================================================
// Contract Addresses
// ============================================================================

export const CONTRACTS = {
  testnet: {
    PaymentGateway: '0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b' as const,
    ConfidentialUSDCWrapper: '0xf99376BE228E8212C3C9b8B746683C96C1517e8B' as const,
    chainId: 11155111,
    chainName: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org', // Default public RPC - override with custom rpcUrl in config
  },
  mainnet: {
    PaymentGateway: '0x...' as const, // Add when mainnet deployed
    ConfidentialUSDCWrapper: '0x...' as const,
    chainId: 1,
    chainName: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
  },
} as const;

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULTS = {
  appUrl: {
    testnet: 'https://aruvi-dapp.vercel.app', // Production testnet URL
    mainnet: 'https://app.aruvi.io',
  },
  theme: {
    primaryColor: '#0070ba',
    secondaryColor: '#003087',
    borderRadius: 12,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
} as const;

// ============================================================================
// Payment Gateway ABI (simplified for SDK)
// ============================================================================

export const PAYMENT_GATEWAY_ABI = [
  {
    name: 'PaymentSent',
    type: 'event',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
    ],
  },
  {
    name: 'PaymentRefunded',
    type: 'event',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true },
    ],
  },
  {
    name: 'getPaymentInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'isRefunded', type: 'bool' },
    ],
  },
  {
    name: 'refunded',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ============================================================================
// Checkout Iframe Messages
// ============================================================================

export const MESSAGE_TYPES = {
  // From merchant to checkout
  INIT_CHECKOUT: 'ARUVI_INIT_CHECKOUT',
  CLOSE_CHECKOUT: 'ARUVI_CLOSE_CHECKOUT',
  
  // From checkout to merchant
  CHECKOUT_READY: 'ARUVI_CHECKOUT_READY',
  CHECKOUT_CLOSED: 'ARUVI_CHECKOUT_CLOSED',
  PAYMENT_PENDING: 'ARUVI_PAYMENT_PENDING',
  PAYMENT_SUCCESS: 'ARUVI_PAYMENT_SUCCESS',
  PAYMENT_ERROR: 'ARUVI_PAYMENT_ERROR',
  PAYMENT_CANCELLED: 'ARUVI_PAYMENT_CANCELLED',
} as const;

// ============================================================================
// Styling
// ============================================================================

export const BUTTON_STYLES = {
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
} as const;

export const MODAL_STYLES = `
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

export const ARUVI_LOGO_SVG = `
<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.2"/>
  <path d="M10 20L16 12L22 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 16L16 12L19 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
