/**
 * Direct Transfer Page
 * Simple P2P confidential transfers - NO REFUNDS, NO TRACKING
 * Redesigned to match Aruvi PayPal-like UI (Navy blue & white)
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits, isAddress } from 'viem';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  Zap,
  User,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { useSimpleTransfer } from '../hooks';
import { useConfidentialToken } from '../hooks/useConfidentialToken';
import { TOKEN_CONFIG } from '../lib/contracts';

type Step = 'recipient' | 'amount' | 'confirm' | 'success';

// Zero bytes32 handle means no balance
const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function DirectTransferPage() {
  const navigate = useNavigate();
  const { send, isProcessing, isReady, error } = useSimpleTransfer();
  const { confidentialBalanceHandle, formattedDecryptedBalance, formattedErc20Balance } = useConfidentialToken();
  
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Check if user has cUSDC balance
  const hasCusdcBalance = confidentialBalanceHandle && confidentialBalanceHandle !== ZERO_HANDLE;
  const hasUsdcBalance = formattedErc20Balance && parseFloat(formattedErc20Balance) > 0;

  const isValidRecipient = recipient && isAddress(recipient);

  const handleRecipientSubmit = () => {
    if (!recipient) {
      setFormError('Please enter a recipient address');
      return;
    }
    if (!isValidRecipient) {
      setFormError('Please enter a valid Ethereum address');
      return;
    }
    setFormError('');
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    
    // Validate against available balance if we have a decrypted value
    if (formattedDecryptedBalance) {
      const enteredAmount = parseFloat(amount);
      const availableBalance = parseFloat(formattedDecryptedBalance);
      if (enteredAmount > availableBalance) {
        setFormError(`Insufficient balance. Available: ${availableBalance.toFixed(2)} cUSDC`);
        return;
      }
    }
    
    setFormError('');
    setStep('confirm');
  };

  const handleConfirmSend = async () => {
    setFormError('');

    try {
      const amountWei = parseUnits(amount, TOKEN_CONFIG.decimals);
      toast.loading('Encrypting and sending...', { id: 'direct-send' });
      
      const result = await send(recipient as `0x${string}`, amountWei);
      
      if (result) {
        setTxHash(result.hash);
        toast.success('Transfer sent!', { id: 'direct-send' });
        setStep('success');
      } else {
        toast.error('Transfer failed - no result returned', { id: 'direct-send' });
        setFormError('Transfer failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      setFormError(errorMessage);
      toast.error(errorMessage, { id: 'direct-send' });
      toast.error('Transfer failed', { id: 'direct-send' });
    }
  };

  const handleBack = () => {
    setFormError('');
    if (step === 'amount') setStep('recipient');
    else if (step === 'confirm') setStep('amount');
    else navigate('/dashboard');
  };

  const steps = ['recipient', 'amount', 'confirm'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-xl mx-auto">
          {/* Back Button */}
          {step !== 'success' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </motion.button>
          )}

          {/* Progress Indicator */}
          {step !== 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2">
                {steps.map((s, i) => (
                  <div key={s} className="flex-1 flex items-center gap-2">
                    <div 
                      className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                        i <= currentStepIndex
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3">
                <span className={`text-xs font-medium ${currentStepIndex >= 0 ? 'text-amber-600' : 'text-gray-400'}`}>Recipient</span>
                <span className={`text-xs font-medium ${currentStepIndex >= 1 ? 'text-amber-600' : 'text-gray-400'}`}>Amount</span>
                <span className={`text-xs font-medium ${currentStepIndex >= 2 ? 'text-amber-600' : 'text-gray-400'}`}>Confirm</span>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Recipient */}
            {step === 'recipient' && (
              <motion.div
                key="recipient"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Header with Icon */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Direct Transfer
                      </h1>
                      <p className="text-gray-500">
                        Fast, simple, no tracking
                      </p>
                    </div>

                    {/* Warning Banner */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800 mb-1">
                            No Refunds Available
                          </p>
                          <p className="text-sm text-amber-700">
                            Direct transfers cannot be reversed. For refundable payments, use{' '}
                            <Link to="/send" className="font-semibold underline hover:text-amber-900">
                              Aruvi Send
                            </Link>
                            .
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* No cUSDC Balance Warning */}
                    {!hasCusdcBalance && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-paypal-navy/5 border border-paypal-blue/20 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-paypal-dark mb-1">
                              No cUSDC Balance
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              You need cUSDC to send.
                              {hasUsdcBalance && ` You have ${formattedErc20Balance} USDC.`}
                            </p>
                            <Link
                              to="/wallet"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-paypal-blue hover:text-paypal-dark transition-colors"
                            >
                              Wrap USDC → cUSDC
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-6">
                      {/* Recipient Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Recipient Address
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="0x..."
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Error */}
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl"
                        >
                          <AlertTriangle className="w-5 h-5" />
                          <span className="text-sm font-medium">{formError}</span>
                        </motion.div>
                      )}

                      {/* Privacy Notice */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100/50 p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            The amount will be <span className="font-semibold text-gray-900">encrypted</span>. Only you and the recipient can see it.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleRecipientSubmit}
                        disabled={!isReady}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                        size="lg"
                      >
                        {!isReady ? 'Connecting...' : 'Continue'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Amount */}
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
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Enter Amount
                      </h1>
                      <p className="text-gray-500">
                        How much do you want to send?
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Amount Input */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 text-center hover:border-amber-200 transition-colors">
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

                      {/* Error */}
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl"
                        >
                          <AlertTriangle className="w-5 h-5" />
                          <span className="text-sm font-medium">{formError}</span>
                        </motion.div>
                      )}

                      <Button
                        onClick={handleAmountSubmit}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
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

            {/* Step 3: Confirm */}
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
                        <AlertTriangle className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Confirm Transfer
                      </h1>
                      <p className="text-gray-500">
                        This action cannot be undone
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Transfer Details */}
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">To</span>
                          <span className="font-mono text-sm text-gray-900">
                            {recipient.slice(0, 10)}...{recipient.slice(-8)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-bold text-xl text-gray-900">
                            ${amount} {TOKEN_CONFIG.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Type</span>
                          <span className="text-amber-600 font-semibold">Direct Transfer</span>
                        </div>
                      </div>

                      {/* Final Warning */}
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-red-800 mb-1">
                              NO REFUNDS
                            </p>
                            <p className="text-sm text-red-700">
                              Direct transfers cannot be reversed or refunded. Please verify all details.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Error */}
                      {(formError || error) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl"
                        >
                          <AlertTriangle className="w-5 h-5" />
                          <span className="text-sm font-medium">{formError || error?.message}</span>
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
                          onClick={handleConfirmSend}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25"
                          size="lg"
                        >
                          {isProcessing ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Sending...
                            </span>
                          ) : (
                            'Confirm & Send'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Success Animation */}
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
                          Transfer Sent!
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
                            {recipient.slice(0, 10)}...{recipient.slice(-8)}
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

                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep('recipient');
                            setRecipient('');
                            setAmount('');
                            setTxHash(null);
                          }}
                          className="border-2 border-gray-200 hover:border-paypal-blue hover:text-paypal-blue"
                        >
                          Send Another
                        </Button>
                        <Button
                          onClick={() => navigate('/dashboard')}
                          className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700"
                        >
                          Done
                        </Button>
                      </div>
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

export default DirectTransferPage;
