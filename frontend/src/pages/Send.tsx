import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  User,
  Shield,
  Send as SendIcon,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { formatAddress, isValidAddress } from '../lib/utils';
import { TOKEN_CONFIG } from '../lib/contracts';
import { useAruviGateway, useConfidentialToken, useFhevm } from '../hooks';
import { Link } from 'react-router-dom';

type Step = 'recipient' | 'amount' | 'confirm' | 'success';

// Zero bytes32 handle means no balance
const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function Send() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [txHash, setTxHash] = useState<string | null>(null);

  // Real blockchain hooks
  const { isReady: fhevmReady, initialize } = useFhevm();
  const { confidentialBalanceHandle, formattedErc20Balance } = useConfidentialToken();
  // Use Aruvi Gateway for sending - handles operator approval internally
  const { send, isProcessing, isEncrypting, fhevmReady: paymentFhevmReady } = useAruviGateway();

  // Check if user has cUSDC balance (handle exists and not zero)
  const hasCusdcBalance = confidentialBalanceHandle && confidentialBalanceHandle !== ZERO_HANDLE;
  const hasUsdcBalance = formattedErc20Balance && parseFloat(formattedErc20Balance) > 0;

  const isLoading = isProcessing || isEncrypting;

  const handleRecipientSubmit = () => {
    if (!recipient) {
      setError('Please enter a recipient address');
      return;
    }
    if (!isValidAddress(recipient)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    setError('');
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

  const handleConfirm = async () => {
    setError('');
    
    // Check cUSDC balance first
    if (!hasCusdcBalance) {
      setError('You need cUSDC to send. Please wrap your USDC first.');
      toast.error('No cUSDC balance. Wrap USDC first.');
      return;
    }
    
    // Check FHEVM is ready
    if (!fhevmReady || !paymentFhevmReady) {
      toast.error('Encryption not ready. Please wait...');
      await initialize();
      return;
    }

    // Note: useAruviGateway handles operator approval internally in send()
    
    try {
      const amountInWei = parseUnits(amount, TOKEN_CONFIG.decimals);
      
      toast.loading('Encrypting and sending...', { id: 'send' });
      
      // useAruviGateway.send() handles operator approval automatically
      const result = await send({
        recipient: recipient as `0x${string}`,
        amount: amountInWei,
      });
      
      if (result) {
        setTxHash(result.hash);
        toast.success('Payment sent!', { id: 'send' });
        setStep('success');
      } else {
        toast.error('Transaction failed - no result returned', { id: 'send' });
        setError('Transaction failed. Please try again.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'send' });
    }
  };

  const handleBack = () => {
    setError('');
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
                          ? 'bg-gradient-to-r from-paypal-blue to-blue-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3">
                <span className={`text-xs font-medium ${currentStepIndex >= 0 ? 'text-paypal-blue' : 'text-gray-400'}`}>Recipient</span>
                <span className={`text-xs font-medium ${currentStepIndex >= 1 ? 'text-paypal-blue' : 'text-gray-400'}`}>Amount</span>
                <span className={`text-xs font-medium ${currentStepIndex >= 2 ? 'text-paypal-blue' : 'text-gray-400'}`}>Confirm</span>
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
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <SendIcon className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Send Money
                      </h1>
                      <p className="text-gray-500">
                        Enter the recipient's wallet address
                      </p>
                    </div>

                    {/* No cUSDC Balance Warning */}
                    {!hasCusdcBalance && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">
                              No cUSDC Balance
                            </p>
                            <p className="text-sm text-amber-700 mb-3">
                              You need cUSDC to send private payments.
                              {hasUsdcBalance && ` You have ${formattedErc20Balance} USDC that can be wrapped.`}
                            </p>
                            <Link
                              to="/wallet"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-paypal-blue hover:text-paypal-dark transition-colors"
                            >
                              Go to Wallet to wrap USDC → cUSDC
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
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Error */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-paypal-navy/10 text-paypal-blue rounded-xl"
                        >
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                      )}

                      {/* Privacy Notice */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            The amount you send will be <span className="font-semibold text-gray-900">encrypted</span>. Only you and the recipient can see the transaction amount.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleRecipientSubmit}
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
                    {/* Recipient Preview */}
                    <div className="flex items-center justify-center gap-3 mb-8 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-paypal-blue/10 to-blue-50 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-paypal-blue" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sending to</p>
                        <p className="font-semibold text-gray-900 font-mono">
                          {formatAddress(recipient)}
                        </p>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="text-center py-8 mb-6">
                      <div className="inline-flex items-baseline">
                        <span className="text-5xl font-bold text-gray-300 mr-1">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="text-6xl font-bold text-gray-900 bg-transparent border-none outline-none text-center w-56 placeholder:text-gray-300"
                          autoFocus
                        />
                      </div>
                      <p className="text-gray-400 mt-3 font-medium">cUSDC</p>
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 bg-paypal-navy/10 text-paypal-blue rounded-xl mb-6"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}

                    {/* Note Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Add a note (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="What's this for?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all"
                      />
                    </div>

                    <Button
                      onClick={handleAmountSubmit}
                      className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                      size="lg"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                      Confirm Payment
                    </h1>

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 mb-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-500">To</span>
                          <span className="font-semibold text-gray-900 font-mono">
                            {formatAddress(recipient)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-bold text-2xl text-gray-900">
                            ${amount} <span className="text-sm text-gray-500">cUSDC</span>
                          </span>
                        </div>
                        {note && (
                          <div className="flex justify-between items-center py-3">
                            <span className="text-gray-500">Note</span>
                            <span className="text-gray-900">{note}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Privacy Badge */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Private Transaction</p>
                          <p className="text-sm text-gray-600">
                            This transaction is encrypted. The amount will be hidden from everyone except you and the recipient.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 bg-paypal-navy/10 text-paypal-blue rounded-xl mb-6"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleConfirm}
                      className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <SendIcon className="w-5 h-5 mr-2" />
                          Send ${amount} cUSDC
                        </>
                      )}
                    </Button>
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
                  <div className="p-8 text-center">
                    {/* Success Animation */}
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60 scale-150" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="relative w-24 h-24 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-full flex items-center justify-center shadow-xl"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Check className="w-12 h-12 text-white" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Sparkles className="w-4 h-4 text-paypal-blue" />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Payment Sent!
                      </h1>
                      <p className="text-gray-500 mb-2">
                        You sent <span className="font-bold text-gray-900">${amount} cUSDC</span>
                      </p>
                      <p className="text-gray-400 font-mono text-sm mb-8">
                        to {formatAddress(recipient)}
                      </p>
                    </motion.div>

                    {/* Privacy Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4 mb-8 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600">
                          Your payment was <span className="font-semibold text-gray-900">encrypted</span> and is now private. Only you and the recipient can see the amount.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-3"
                    >
                      <Button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                        size="lg"
                      >
                        Done
                      </Button>
                      <Button
                        onClick={() => {
                          setStep('recipient');
                          setRecipient('');
                          setAmount('');
                          setNote('');
                        }}
                        variant="outline"
                        className="w-full border-2 border-gray-200 hover:border-paypal-blue hover:text-paypal-blue"
                        size="lg"
                      >
                        Send Another
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
