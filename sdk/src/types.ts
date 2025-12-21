/**
 * Aruvi SDK Types
 * Type definitions for the Aruvi Payment SDK
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface AruviConfig {
  /**
   * Your merchant wallet address that will receive payments
   */
  merchantAddress: `0x${string}`;
  
  /**
   * Environment: 'testnet' for Sepolia, 'mainnet' for Ethereum mainnet
   * @default 'testnet'
   */
  environment?: 'testnet' | 'mainnet';
  
  /**
   * Custom Aruvi app URL (for self-hosted instances)
   * @default 'https://app.aruvi.io' or 'http://localhost:5173' for testnet
   */
  appUrl?: string;
  
  /**
   * Custom RPC URL for blockchain queries
   */
  rpcUrl?: string;
  
  /**
   * Theme customization
   */
  theme?: AruviTheme;
}

export interface AruviTheme {
  /**
   * Primary color (hex)
   * @default '#0070ba'
   */
  primaryColor?: string;
  
  /**
   * Secondary color (hex)
   * @default '#003087'
   */
  secondaryColor?: string;
  
  /**
   * Border radius in pixels
   * @default 12
   */
  borderRadius?: number;
  
  /**
   * Font family
   * @default 'system-ui, -apple-system, sans-serif'
   */
  fontFamily?: string;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentRequest {
  /**
   * Amount in USDC (e.g., '10.00' for $10)
   */
  amount: string;
  
  /**
   * Optional: Reference ID for your records
   */
  reference?: string;
  
  /**
   * Optional: Description shown to customer
   */
  description?: string;
  
  /**
   * Optional: Custom metadata (returned in callbacks)
   */
  metadata?: Record<string, string>;
  
  /**
   * Optional: Customer's email for receipt
   */
  customerEmail?: string;
  
  /**
   * Optional: Redirect URL after successful payment
   */
  successUrl?: string;
  
  /**
   * Optional: Redirect URL if payment is cancelled
   */
  cancelUrl?: string;
}

export interface PaymentResult {
  /**
   * Whether the payment was successful
   */
  success: boolean;
  
  /**
   * Unique payment ID from the blockchain
   */
  paymentId: `0x${string}`;
  
  /**
   * Transaction hash
   */
  transactionHash: `0x${string}`;
  
  /**
   * Amount paid in USDC
   */
  amount: string;
  
  /**
   * Customer's wallet address
   */
  customerAddress: `0x${string}`;
  
  /**
   * Merchant's wallet address
   */
  merchantAddress: `0x${string}`;
  
  /**
   * Block number of the transaction
   */
  blockNumber: number;
  
  /**
   * Timestamp of the transaction
   */
  timestamp: number;
  
  /**
   * Your reference ID (if provided)
   */
  reference?: string;
  
  /**
   * Custom metadata (if provided)
   */
  metadata?: Record<string, string>;
}

export interface PaymentError {
  /**
   * Error code
   */
  code: 'USER_CANCELLED' | 'INSUFFICIENT_FUNDS' | 'NETWORK_ERROR' | 'TRANSACTION_FAILED' | 'INVALID_AMOUNT' | 'UNKNOWN';
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Original error (if available)
   */
  originalError?: Error;
}

// ============================================================================
// Callback Types
// ============================================================================

export interface AruviCallbacks {
  /**
   * Called when payment is successful
   */
  onSuccess?: (result: PaymentResult) => void;
  
  /**
   * Called when payment fails
   */
  onError?: (error: PaymentError) => void;
  
  /**
   * Called when user cancels the payment
   */
  onCancel?: () => void;
  
  /**
   * Called when checkout modal opens
   */
  onOpen?: () => void;
  
  /**
   * Called when checkout modal closes
   */
  onClose?: () => void;
  
  /**
   * Called when payment is pending (transaction submitted, awaiting confirmation)
   */
  onPending?: (transactionHash: `0x${string}`) => void;
}

// ============================================================================
// Button Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'dark';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface AruviButtonOptions {
  /**
   * Button text
   * @default 'Pay with Aruvi'
   */
  label?: string;
  
  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * Button size
   * @default 'medium'
   */
  size?: ButtonSize;
  
  /**
   * Show Aruvi logo
   * @default true
   */
  showLogo?: boolean;
  
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Custom CSS class
   */
  className?: string;
}

// ============================================================================
// Verification Types
// ============================================================================

export interface VerificationResult {
  /**
   * Whether the payment is verified
   */
  verified: boolean;
  
  /**
   * Payment details (if verified)
   */
  payment?: PaymentResult;
  
  /**
   * Error message (if not verified)
   */
  error?: string;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface SubscriptionRequest {
  /**
   * Amount per period in USDC
   */
  amount: string;
  
  /**
   * Billing interval
   */
  interval: 'daily' | 'weekly' | 'monthly';
  
  /**
   * Description of the subscription
   */
  description?: string;
  
  /**
   * Reference ID for your records
   */
  reference?: string;
}

export interface SubscriptionResult {
  /**
   * Subscription ID from the blockchain
   */
  subscriptionId: `0x${string}`;
  
  /**
   * Transaction hash of the creation
   */
  transactionHash: `0x${string}`;
  
  /**
   * Customer's wallet address
   */
  customerAddress: `0x${string}`;
  
  /**
   * Amount per period
   */
  amount: string;
  
  /**
   * Billing interval in seconds
   */
  intervalSeconds: number;
  
  /**
   * Next payment timestamp
   */
  nextPayment: number;
}

// ============================================================================
// Event Types
// ============================================================================

export type AruviEventType = 
  | 'checkout:open'
  | 'checkout:close'
  | 'payment:pending'
  | 'payment:success'
  | 'payment:error'
  | 'payment:cancel';

export interface AruviEvent {
  type: AruviEventType;
  data?: PaymentResult | PaymentError | { transactionHash: `0x${string}` };
}

export type AruviEventHandler = (event: AruviEvent) => void;
