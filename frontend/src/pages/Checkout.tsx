/**
 * Checkout Page - SDK Integration
 * 
 * This page handles checkout flows initiated by the Aruvi SDK.
 * It can be embedded in an iframe or used as a standalone page.
 * 
 * Query Parameters:
 * - merchant: Merchant wallet address (required)
 * - amount: Payment amount in USDC (required)
 * - sdk: Whether this is an SDK checkout (enables postMessage)
 * - desc: Payment description
 * - ref: Merchant reference ID
 * - meta: JSON-encoded metadata
 * - email: Customer email for receipt
 * - success: Redirect URL after success
 * - cancel: Redirect URL if cancelled
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import type { Connector } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import {
  Shield,
  Check,
  AlertCircle,
  Wallet,
  ArrowRight,
  Copy,
  ExternalLink,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useAruviGateway } from '../hooks/useAruviGateway';
import { useConfidentialToken } from '../hooks/useConfidentialToken';
import { TOKEN_CONFIG } from '../lib/contracts';
import { formatAddress } from '../lib/utils';

// Message types for SDK communication
const MESSAGE_TYPES = {
  CHECKOUT_READY: 'ARUVI_CHECKOUT_READY',
  CHECKOUT_CLOSED: 'ARUVI_CHECKOUT_CLOSED',
  PAYMENT_PENDING: 'ARUVI_PAYMENT_PENDING',
  PAYMENT_SUCCESS: 'ARUVI_PAYMENT_SUCCESS',
  PAYMENT_ERROR: 'ARUVI_PAYMENT_ERROR',
  PAYMENT_CANCELLED: 'ARUVI_PAYMENT_CANCELLED',
} as const;

type CheckoutStep = 'connect' | 'review' | 'processing' | 'success' | 'error';

interface CheckoutData {
  merchant: `0x${string}`;
  amount: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  isSDK: boolean;
}

// Post message to parent window (for SDK iframe)
function postToParent(type: string, data?: Record<string, unknown>) {
  if (window.parent !== window) {
    window.parent.postMessage({ type, data }, '*');
  }
}

export function Checkout() {
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { send, fhevmReady, approveGateway, isOperatorApproved } = useAruviGateway();
  const { 
    confidentialBalanceHandle, 
    formattedDecryptedBalance, 
    formattedErc20Balance,
  } = useConfidentialToken();

  const [txHash, setTxHash] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Zero handles
  const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const hasCusdcBalance = !!(confidentialBalanceHandle && confidentialBalanceHandle !== ZERO_HANDLE);
  const hasUsdcBalance = !!(formattedErc20Balance && parseFloat(formattedErc20Balance) > 0);

  // Parse checkout parameters - fully derived, no setState needed
  const checkoutData = useMemo((): CheckoutData | null => {
    const merchant = searchParams.get('merchant') as `0x${string}`;
    const amount = searchParams.get('amount');
    const isSDK = searchParams.get('sdk') === 'true';

    if (!merchant || !amount) {
      return null;
    }

    // Validate merchant address
    if (!merchant.startsWith('0x') || merchant.length !== 42) {
      return null;
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return null;
    }

    // Parse metadata if present
    let metadata: Record<string, string> | undefined;
    const metaParam = searchParams.get('meta');
    if (metaParam) {
      try {
        metadata = JSON.parse(metaParam);
      } catch {
        // Ignore invalid metadata
      }
    }

    return {
      merchant,
      amount,
      description: searchParams.get('desc') || undefined,
      reference: searchParams.get('ref') || undefined,
      metadata,
      customerEmail: searchParams.get('email') || undefined,
      successUrl: searchParams.get('success') || undefined,
      cancelUrl: searchParams.get('cancel') || undefined,
      isSDK,
    };
  }, [searchParams]);

  // Parse error message
  const parseError = useMemo((): string => {
    const merchant = searchParams.get('merchant');
    const amount = searchParams.get('amount');
    
    if (!merchant || !amount) {
      return 'Invalid checkout parameters';
    }
    if (!merchant.startsWith('0x') || merchant.length !== 42) {
      return 'Invalid merchant address';
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Invalid payment amount';
    }
    return '';
  }, [searchParams]);

  // Derive step from state
  const step: CheckoutStep = useMemo(() => {
    if (!checkoutData) return 'error';
    if (paymentError) return 'error';
    if (isPaymentComplete) return 'success';
    if (isPaymentProcessing) return 'processing';
    if (!isConnected) return 'connect';
    return 'review';
  }, [checkoutData, paymentError, isPaymentComplete, isPaymentProcessing, isConnected]);
  
  // Effective error
  const error = paymentError || parseError;

  // Notify parent that checkout is ready
  useEffect(() => {
    if (checkoutData?.isSDK) {
      postToParent(MESSAGE_TYPES.CHECKOUT_READY);
    }
  }, [checkoutData?.isSDK]);

  // Handle payment
  const handlePay = useCallback(async () => {
    if (!checkoutData || !address || !fhevmReady) return;

    try {
      setIsPaymentProcessing(true);

      // Check operator approval
      if (!isOperatorApproved) {
        toast.loading('Approving operator...', { id: 'approve' });
        await approveGateway();
        toast.success('Operator approved!', { id: 'approve' });
      }

      // Send payment
      const amountWei = parseUnits(checkoutData.amount, TOKEN_CONFIG.decimals);
      
      toast.loading('Confirming payment...', { id: 'payment' });
      
      const result = await send({
        recipient: checkoutData.merchant,
        amount: amountWei,
      });

      if (result?.hash) {
        setTxHash(result.hash);
        
        // Notify SDK of pending transaction
        if (checkoutData.isSDK) {
          postToParent(MESSAGE_TYPES.PAYMENT_PENDING, {
            transactionHash: result.hash,
          });
        }

        // Wait for confirmation and extract payment ID
        // In production, we'd watch for the PaymentSent event
        const extractedPaymentId = result.id || `0x${result.hash.slice(2, 66)}` as `0x${string}`;
        setPaymentId(extractedPaymentId);

        toast.success('Payment successful!', { id: 'payment' });
        setIsPaymentComplete(true);
        setIsPaymentProcessing(false);

        // Notify SDK of success
        if (checkoutData.isSDK) {
          postToParent(MESSAGE_TYPES.PAYMENT_SUCCESS, {
            paymentId: extractedPaymentId,
            transactionHash: result.hash,
            amount: checkoutData.amount,
            customerAddress: address,
            blockNumber: 0, // Would be filled from receipt
            timestamp: Date.now(),
            reference: checkoutData.reference,
            metadata: checkoutData.metadata,
          });
        }

        // Redirect if success URL provided
        if (checkoutData.successUrl && !checkoutData.isSDK) {
          const url = new URL(checkoutData.successUrl);
          url.searchParams.set('paymentId', extractedPaymentId);
          url.searchParams.set('txHash', result.hash);
          window.location.href = url.toString();
        }
      }
    } catch (err) {
      console.error('Payment failed:', err);
      const message = err instanceof Error ? err.message : 'Payment failed';
      setPaymentError(message);
      setIsPaymentProcessing(false);
      toast.error(message, { id: 'payment' });

      // Notify SDK of error
      if (checkoutData.isSDK) {
        postToParent(MESSAGE_TYPES.PAYMENT_ERROR, {
          code: 'TRANSACTION_FAILED',
          message,
        });
      }
    }
  }, [checkoutData, address, fhevmReady, isOperatorApproved, approveGateway, send]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (checkoutData?.isSDK) {
      postToParent(MESSAGE_TYPES.PAYMENT_CANCELLED);
      postToParent(MESSAGE_TYPES.CHECKOUT_CLOSED);
    } else if (checkoutData?.cancelUrl) {
      window.location.href = checkoutData.cancelUrl;
    } else {
      window.close();
    }
  }, [checkoutData]);

  // Render loading state
  if (!checkoutData && step !== 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003087] to-[#0070ba] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003087] to-[#0070ba] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <span className="font-bold text-lg">Aruvi Checkout</span>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 'connect' && checkoutData && (
              <ConnectStep
                key="connect"
                data={checkoutData}
                connectors={connectors}
                isConnecting={isConnecting}
                onConnect={(connector) => connect({ connector })}
                showOptions={showWalletOptions}
                onToggleOptions={() => setShowWalletOptions(!showWalletOptions)}
              />
            )}

            {step === 'review' && checkoutData && (
              <ReviewStep
                key="review"
                data={checkoutData}
                address={address!}
                hasBalance={hasCusdcBalance || hasUsdcBalance}
                balance={formattedDecryptedBalance || formattedErc20Balance || '0'}
                fhevmReady={fhevmReady}
                onPay={handlePay}
                onCancel={handleCancel}
                onDisconnect={disconnect}
              />
            )}

            {step === 'processing' && (
              <ProcessingStep key="processing" />
            )}

            {step === 'success' && checkoutData && (
              <SuccessStep
                key="success"
                data={checkoutData}
                txHash={txHash!}
                paymentId={paymentId!}
                onClose={handleCancel}
              />
            )}

            {step === 'error' && (
              <ErrorStep
                key="error"
                error={error}
                onRetry={() => {
                  setPaymentError('');
                  setIsPaymentProcessing(false);
                }}
                onCancel={handleCancel}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Secured by Aruvi • Payments encrypted with FHE</span>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Step Components
// ============================================================================

interface ConnectStepProps {
  data: CheckoutData;
  connectors: readonly Connector[];
  isConnecting: boolean;
  onConnect: (connector: Connector) => void;
  showOptions: boolean;
  onToggleOptions: () => void;
}

function ConnectStep({ data, connectors, isConnecting, onConnect, showOptions, onToggleOptions }: ConnectStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-[#003087] to-[#0070ba] text-white p-6">
        <p className="text-sm opacity-80 mb-1">Payment to</p>
        <p className="font-mono text-sm mb-4">{formatAddress(data.merchant)}</p>
        <p className="text-4xl font-bold">${data.amount}</p>
        {data.description && (
          <p className="text-sm opacity-80 mt-2">{data.description}</p>
        )}
      </div>

      {/* Connect Options */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Wallet to Pay</h3>
        
        <div className="space-y-3">
          {/* Primary connector - MetaMask or first available */}
          {connectors[0] && (
            <button
              onClick={() => onConnect(connectors[0])}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-3 bg-[#003087] hover:bg-[#002060] text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              <span>Connect Wallet</span>
            </button>
          )}

          {/* Other connectors */}
          {connectors.length > 1 && (
            <>
              <button
                onClick={onToggleOptions}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 text-sm"
              >
                <span>More options</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    {connectors.slice(1).map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => onConnect(connector)}
                        disabled={isConnecting}
                        className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <span className="text-gray-700">{connector.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By connecting, you agree to Aruvi's Terms of Service
        </p>
      </div>
    </motion.div>
  );
}

interface ReviewStepProps {
  data: CheckoutData;
  address: `0x${string}`;
  hasBalance: boolean;
  balance: string;
  fhevmReady: boolean;
  onPay: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
}

function ReviewStep({ data, address, hasBalance, balance, fhevmReady, onPay, onCancel, onDisconnect }: ReviewStepProps) {
  const insufficientBalance = hasBalance && parseFloat(balance) < parseFloat(data.amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003087] to-[#0070ba] text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm opacity-80">Connected as</span>
          <button
            onClick={onDisconnect}
            className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
          >
            Disconnect
          </button>
        </div>
        <p className="font-mono text-sm">{formatAddress(address)}</p>
      </div>

      {/* Payment Details */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600">Amount</span>
          <span className="text-2xl font-bold text-gray-900">${data.amount}</span>
        </div>

        {data.description && (
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-600">Description</span>
            <span className="text-gray-900">{data.description}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600">To</span>
          <span className="font-mono text-sm text-gray-900">{formatAddress(data.merchant)}</span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-gray-600">Your Balance</span>
          <span className="text-gray-900">{balance} USDC</span>
        </div>

        {insufficientBalance && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Insufficient balance. Please add funds to continue.
          </div>
        )}

        {!fhevmReady && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl text-sm">
            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
            Initializing secure connection...
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onPay}
            disabled={insufficientBalance || !fhevmReady}
            className="flex-1 py-3 px-4 bg-[#003087] hover:bg-[#002060] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            <span>Pay ${data.amount}</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your payment amount is encrypted and hidden on-chain
        </p>
      </div>
    </motion.div>
  );
}

function ProcessingStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-xl p-8 text-center"
    >
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
      <p className="text-gray-600">Please confirm the transaction in your wallet...</p>
    </motion.div>
  );
}

interface SuccessStepProps {
  data: CheckoutData;
  txHash: string;
  paymentId: string;
  onClose: () => void;
}

function SuccessStep({ data, txHash, paymentId, onClose }: SuccessStepProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="bg-green-500 p-8 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
        <p className="text-4xl font-bold">${data.amount}</p>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Payment ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
              {paymentId}
            </code>
            <button
              onClick={() => copyToClipboard(paymentId)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Transaction</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
          >
            <span>View on Etherscan</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-[#003087] hover:bg-[#002060] text-white rounded-xl font-medium transition-colors"
        >
          {data.isSDK ? 'Close' : 'Done'}
        </button>
      </div>
    </motion.div>
  );
}

interface ErrorStepProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

function ErrorStep({ error, onRetry, onCancel }: ErrorStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-xl p-8 text-center"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h3>
      <p className="text-gray-600 mb-6">{error}</p>
      
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-3 px-4 bg-[#003087] hover:bg-[#002060] text-white rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </motion.div>
  );
}

export default Checkout;
