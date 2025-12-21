/**
 * @aruvi/sdk/react
 * React components for Aruvi SDK
 */
import { type ReactNode, type FC, type CSSProperties } from 'react';
import type { AruviConfig, PaymentRequest, AruviCallbacks, AruviButtonOptions, PaymentResult, PaymentError } from './types';
import { Aruvi } from './index';
export type { AruviConfig, PaymentRequest, AruviCallbacks, PaymentResult, PaymentError, } from './types';
interface AruviContextValue {
    aruvi: Aruvi | null;
    isReady: boolean;
    checkout: (payment: PaymentRequest & AruviCallbacks) => void;
    closeCheckout: () => void;
    isCheckoutOpen: boolean;
    createPaymentLink: (payment: PaymentRequest) => string;
    verifyPayment: (paymentId: `0x${string}`, expectedAmount?: string) => Promise<boolean>;
}
export interface AruviProviderProps {
    config: AruviConfig;
    children: ReactNode;
}
export declare const AruviProvider: FC<AruviProviderProps>;
export declare function useAruvi(): AruviContextValue;
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
export declare const AruviButton: FC<AruviButtonProps>;
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
    children: (props: {
        onClick: () => void;
        isLoading: boolean;
    }) => ReactNode;
}
export declare const CheckoutTrigger: FC<CheckoutTriggerProps>;
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
export declare const PaymentLink: FC<PaymentLinkProps>;
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
export declare function usePaymentStatus(options: UsePaymentStatusOptions): PaymentStatus;
