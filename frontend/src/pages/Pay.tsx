/**
 * Pay Page - Fulfill Payment Requests
 * Allows users to pay someone's on-chain payment request
 * PayPal-like UI with Navy blue & white design
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Shield,
  Send,
  Check,
  AlertCircle,
  Clock,
  User,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Info,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { useAruviGateway, RequestInfo } from '../hooks/useAruviGateway';
import { useConfidentialToken } from '../hooks/useConfidentialToken';
import { TOKEN_CONFIG } from '../lib/contracts';
import { formatAddress } from '../lib/utils';

type Step = 'loading' | 'details' | 'amount' | 'confirm' | 'processing' | 'success' | 'error';

// Zero address
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function Pay() {
  const { id: requestId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { fulfillRequest, getRequestInfo, isProcessing, fhevmReady, approveGateway, isOperatorApproved } = useAruviGateway();
  const { confidentialBalanceHandle, formattedDecryptedBalance, formattedErc20Balance } = useConfidentialToken();

  const [step, setStep] = useState<Step>('loading');
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState('');

  const note = searchParams.get('note') || '';
  const hasCusdcBalance = confidentialBalanceHandle && confidentialBalanceHandle !== ZERO_HANDLE;
  const hasUsdcBalance = formattedErc20Balance && parseFloat(formattedErc20Balance) > 0;

  // Load request info on mount
  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) {
        setStep('error');
        setError('Invalid payment link');
        return;
      }

      try {
        const info = await getRequestInfo(requestId as `0x${string}`);
        
        if (!info || info.requester === ZERO_ADDRESS) {
          setStep('error');
          setError('Payment request not found');
          return;
        }

        if (info.fulfilled) {
          setStep('error');
          setError('This request has already been paid');
          return;
        }

        if (info.expiresAt > 0n && BigInt(Math.floor(Date.now() / 1000)) > info.expiresAt) {
          setStep('error');
          setError('This request has expired');
          return;
        }

        setRequestInfo(info);
        setStep('details');
      } catch (err) {
        console.error('Failed to load request:', err);
        setStep('error');
        setError('Failed to load payment request');
      }
    };

    loadRequest();
  }, [requestId, getRequestInfo]);

  const handleProceed = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handlePay = async () => {
    if (!requestId || !amount) return;

    setError('');
    setStep('processing');

    try {
      // Approve operator if needed
      if (!isOperatorApproved) {
        toast.loading('Setting up operator...', { id: 'pay-request' });
        await approveGateway();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast.loading('Encrypting and sending payment...', { id: 'pay-request' });
      
      const amountWei = parseUnits(amount, TOKEN_CONFIG.decimals);
      const result = await fulfillRequest(requestId as `0x${string}`, amountWei);

      if (result) {
        setTxHash(result.hash);
        toast.success('Payment sent!', { id: 'pay-request' });
        setStep('success');
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      toast.error('Payment failed', { id: 'pay-request' });
      setStep('confirm');
    }
  };

  const formatDate = (timestamp: bigint): string => {
    if (timestamp === 0n) return 'Never';
    return new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-xl mx-auto">
          {/* Back Button */}
          {step !== 'processing' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                if (step === 'amount') setStep('details');
                else if (step === 'confirm') setStep('amount');
                else navigate('/dashboard');
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {/* Loading State */}
            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-6"
                    />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Request...</h2>
                    <p className="text-gray-500">Fetching payment details from chain</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Request Unavailable</h2>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <Link to="/dashboard">
                      <Button className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Request Details */}
            {step === 'details' && requestInfo && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <Send className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Payment Request
                      </h1>
                      <p className="text-gray-500">
                        Someone is requesting payment
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Requester Info */}
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Requested by</p>
                            <p className="font-mono font-medium text-gray-900">
                              {formatAddress(requestInfo.requester, 8)}
                            </p>
                          </div>
                        </div>

                        {requestInfo.expiresAt > 0n && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Expires
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(requestInfo.expiresAt)}
                            </span>
                          </div>
                        )}

                        {note && (
                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Note</p>
                            <p className="text-gray-900 font-medium">{note}</p>
                          </div>
                        )}
                      </div>

                      {/* Privacy Notice */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            The requested amount is <span className="font-semibold text-gray-900">encrypted</span>. 
                            You'll enter the amount you want to pay.
                          </p>
                        </div>
                      </div>

                      {!isConnected ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 mb-4">Connect your wallet to pay</p>
                          <Button
                            onClick={() => {/* Wallet connection handled by Header */}}
                            className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700"
                          >
                            Connect Wallet
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleProceed}
                          className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                          size="lg"
                        >
                          Proceed to Pay
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Amount Entry */}
            {step === 'amount' && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <Send className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Enter Amount
                      </h1>
                      <p className="text-gray-500">
                        How much do you want to pay?
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Amount Input */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 text-center hover:border-blue-200 transition-colors">
                        <div className="inline-flex items-baseline">
                          <span className="text-4xl font-bold text-gray-300 mr-1">$</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="text-6xl font-bold text-gray-900 bg-transparent border-none outline-none text-center w-56 placeholder:text-gray-300"
                            autoFocus
                          />
                        </div>
                        <p className="text-gray-400 mt-3 font-medium">{TOKEN_CONFIG.symbol}</p>
                      </div>

                      {/* Balance Display */}
                      {formattedDecryptedBalance && (
                        <div className="text-center text-sm text-gray-500">
                          Available: <span className="font-semibold text-gray-900">{formattedDecryptedBalance} {TOKEN_CONFIG.symbol}</span>
                        </div>
                      )}

                      {/* No Balance Warning */}
                      {!hasCusdcBalance && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-paypal-navy/5 border border-paypal-blue/20 rounded-xl"
                        >
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-paypal-dark mb-1">
                                No cUSDC Balance
                              </p>
                              <p className="text-sm text-gray-600 mb-3">
                                You need cUSDC to pay.
                                {hasUsdcBalance && ` You have ${formattedErc20Balance} USDC.`}
                              </p>
                              <Link
                                to="/wallet"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-paypal-blue hover:text-paypal-dark transition-colors"
                              >
                                <Wallet className="w-4 h-4" />
                                Wrap USDC → cUSDC
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Error */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl"
                        >
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                      )}

                      <Button
                        onClick={handleAmountSubmit}
                        disabled={!fhevmReady}
                        className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                        size="lg"
                      >
                        Continue
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Confirm */}
            {step === 'confirm' && requestInfo && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Confirm Payment
                      </h1>
                      <p className="text-gray-500">
                        Review and confirm your payment
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Payment Summary */}
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">To</span>
                          <span className="font-mono text-sm text-gray-900">
                            {formatAddress(requestInfo.requester, 8)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-bold text-2xl text-gray-900">
                            ${amount} {TOKEN_CONFIG.symbol}
                          </span>
                        </div>
                        {note && (
                          <div className="pt-4 border-t border-gray-200">
                            <span className="text-gray-500 text-sm">Note:</span>
                            <p className="text-gray-900">{note}</p>
                          </div>
                        )}
                      </div>

                      {/* Error */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl"
                        >
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setStep('amount')}
                          className="border-2 border-gray-200 hover:border-gray-300"
                          size="lg"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handlePay}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                          size="lg"
                        >
                          {isProcessing ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Paying...
                            </span>
                          ) : (
                            'Confirm & Pay'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Processing */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-12 text-center">
                    <div className="relative inline-block mb-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-paypal-blue" />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Processing Payment...
                    </h2>
                    <p className="text-gray-500">
                      Encrypting and sending to blockchain
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-2xl opacity-60 scale-150" />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.6 }}
                          className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl"
                        >
                          <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Sparkles className="w-4 h-4 text-green-500" />
                        </motion.div>
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          Payment Sent!
                        </h1>
                        <p className="text-gray-500">
                          <span className="font-bold text-gray-900">${amount} {TOKEN_CONFIG.symbol}</span> sent successfully
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Transaction Details */}
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Recipient</span>
                          <span className="font-mono text-sm text-gray-900">
                            {requestInfo && formatAddress(requestInfo.requester, 8)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-bold text-gray-900">${amount} {TOKEN_CONFIG.symbol}</span>
                        </div>
                        {txHash && (
                          <div className="pt-4 border-t border-gray-200">
                            <a
                              href={`https://sepolia.etherscan.io/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 text-paypal-blue hover:text-paypal-dark transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-sm font-medium">View on Etherscan</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700"
                        size="lg"
                      >
                        Done
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Pay;
