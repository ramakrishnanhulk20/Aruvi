/**
 * @aruvi/sdk/react
 * React components for Aruvi SDK
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type FC,
  type CSSProperties,
} from 'react';

import type {
  AruviConfig,
  PaymentRequest,
  AruviCallbacks,
  AruviButtonOptions,
  PaymentResult,
  PaymentError,
  ButtonVariant,
  ButtonSize,
} from './types';
import { Aruvi } from './index';
import { BUTTON_STYLES, ARUVI_LOGO_SVG } from './constants';

// Re-export types for convenience
export type {
  AruviConfig,
  PaymentRequest,
  AruviCallbacks,
  PaymentResult,
  PaymentError,
} from './types';

// ============================================================================
// Context
// ============================================================================

interface AruviContextValue {
  aruvi: Aruvi | null;
  isReady: boolean;
  checkout: (payment: PaymentRequest & AruviCallbacks) => void;
  closeCheckout: () => void;
  isCheckoutOpen: boolean;
  createPaymentLink: (payment: PaymentRequest) => string;
  verifyPayment: (paymentId: `0x${string}`, expectedAmount?: string) => Promise<boolean>;
}

const AruviContext = createContext<AruviContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface AruviProviderProps {
  config: AruviConfig;
  children: ReactNode;
}

export const AruviProvider: FC<AruviProviderProps> = ({ config, children }) => {
  const [aruvi, setAruvi] = useState<Aruvi | null>(null);
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

  const checkout = useCallback(
    (payment: PaymentRequest & AruviCallbacks) => {
      aruvi?.checkout(payment);
    },
    [aruvi]
  );

  const closeCheckout = useCallback(() => {
    aruvi?.closeCheckout();
  }, [aruvi]);

  const createPaymentLink = useCallback(
    (payment: PaymentRequest) => {
      return aruvi?.createPaymentLink(payment) || '';
    },
    [aruvi]
  );

  const verifyPayment = useCallback(
    async (paymentId: `0x${string}`, expectedAmount?: string) => {
      return aruvi?.verifyPayment(paymentId, expectedAmount) || false;
    },
    [aruvi]
  );

  const value: AruviContextValue = useMemo(
    () => ({
      aruvi,
      isReady: !!aruvi,
      checkout,
      closeCheckout,
      isCheckoutOpen,
      createPaymentLink,
      verifyPayment,
    }),
    [aruvi, isCheckoutOpen, checkout, closeCheckout, createPaymentLink, verifyPayment]
  );

  return <AruviContext.Provider value={value}>{children}</AruviContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

export function useAruvi(): AruviContextValue {
  const context = useContext(AruviContext);
  if (!context) {
    throw new Error('useAruvi must be used within an AruviProvider');
  }
  return context;
}

// ============================================================================
// Pay Button Component
// ============================================================================

export interface AruviButtonProps extends AruviButtonOptions {
  /**
   * Payment configuration
   */
  payment: PaymentRequest;
  
  /**
   * Callbacks for payment events
   */
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: PaymentError) => void;
  onCancel?: () => void;
  
  /**
   * Custom styles
   */
  style?: CSSProperties;
}

export const AruviButton: FC<AruviButtonProps> = ({
  payment,
  onSuccess,
  onError,
  onCancel,
  label = 'Pay with Aruvi',
  variant = 'primary',
  size = 'medium',
  showLogo = true,
  disabled = false,
  className = '',
  style,
}) => {
  const { checkout, isCheckoutOpen } = useAruvi();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    if (isLoading || disabled) return;
    
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

  const buttonStyle: CSSProperties = useMemo(() => {
    const sizeKey = size as keyof typeof BUTTON_STYLES.sizes;
    const variantKey = variant as keyof typeof BUTTON_STYLES.variants;
    const baseStyles = BUTTON_STYLES.base + BUTTON_STYLES.sizes[sizeKey] + BUTTON_STYLES.variants[variantKey];
    
    // Convert string styles to object
    const styleObj: CSSProperties = {
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
      background:
        variant === 'primary'
          ? 'linear-gradient(135deg, #0070ba 0%, #003087 100%)'
          : variant === 'secondary'
          ? '#f5f7fa'
          : variant === 'dark'
          ? '#1a1a1a'
          : 'transparent',
      color:
        variant === 'primary' || variant === 'dark'
          ? '#ffffff'
          : variant === 'secondary'
          ? '#003087'
          : '#0070ba',
      ...style,
    };

    return styleObj;
  }, [size, variant, disabled, isLoading, style]);

  return (
    <button
      type="button"
      className={`aruvi-button ${className}`}
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'aruvi-spin 1s linear infinite',
            }}
          />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {showLogo && (
            <span
              dangerouslySetInnerHTML={{ __html: ARUVI_LOGO_SVG }}
              style={{ display: 'flex' }}
            />
          )}
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

// ============================================================================
// Checkout Trigger Component
// ============================================================================

export interface CheckoutTriggerProps {
  /**
   * Payment configuration
   */
  payment: PaymentRequest;
  
  /**
   * Callbacks
   */
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: PaymentError) => void;
  onCancel?: () => void;
  
  /**
   * Render prop for custom trigger element
   */
  children: (props: { onClick: () => void; isLoading: boolean }) => ReactNode;
}

export const CheckoutTrigger: FC<CheckoutTriggerProps> = ({
  payment,
  onSuccess,
  onError,
  onCancel,
  children,
}) => {
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

  return <>{children({ onClick: handleClick, isLoading })}</>;
};

// ============================================================================
// Payment Link Component
// ============================================================================

export interface PaymentLinkProps {
  /**
   * Payment configuration
   */
  payment: PaymentRequest;
  
  /**
   * Custom render (default renders as anchor tag)
   */
  children?: ReactNode;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Custom styles
   */
  style?: CSSProperties;
  
  /**
   * Open in new tab
   */
  newTab?: boolean;
}

export const PaymentLink: FC<PaymentLinkProps> = ({
  payment,
  children,
  className,
  style,
  newTab = false,
}) => {
  const { createPaymentLink } = useAruvi();
  const link = createPaymentLink(payment);

  return (
    <a
      href={link}
      className={className}
      style={style}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
    >
      {children || `Pay $${payment.amount}`}
    </a>
  );
};

// ============================================================================
// Payment Status Hook
// ============================================================================

export interface UsePaymentStatusOptions {
  /**
   * Payment ID to monitor
   */
  paymentId?: `0x${string}`;
  
  /**
   * Transaction hash to monitor
   */
  transactionHash?: `0x${string}`;
  
  /**
   * Polling interval in ms
   */
  pollInterval?: number;
}

export interface PaymentStatus {
  isLoading: boolean;
  isVerified: boolean | null;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePaymentStatus(options: UsePaymentStatusOptions): PaymentStatus {
  const { aruvi } = useAruvi();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      } else if (options.transactionHash) {
        verified = await aruvi.verifyTransaction(options.transactionHash);
      }

      setIsVerified(verified);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setIsVerified(false);
    } finally {
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
