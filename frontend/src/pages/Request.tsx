import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Shield,
  Download,
  Check,
  Copy,
  Link as LinkIcon,
  QrCode,
  Share2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { copyToClipboard } from '../lib/utils';
import { useAruviGateway } from '../hooks/useAruviGateway';
import { TOKEN_CONFIG } from '../lib/contracts';

type Step = 'form' | 'creating' | 'share';

// Expiry options
const EXPIRY_OPTIONS = [
  { value: 0, label: 'Never expires' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
  { value: 604800, label: '7 days' },
  { value: 2592000, label: '30 days' },
];

export function Request() {
  const navigate = useNavigate();
  useAccount(); // Ensure wallet is connected
  const { createRequest, isProcessing, fhevmReady } = useAruviGateway();
  
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Generate payment link with requestId
  const paymentLink = requestId 
    ? `${window.location.origin}/pay/${requestId}${note ? `?note=${encodeURIComponent(note)}` : ''}`
    : '';

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!fhevmReady) {
      setError('Encryption not ready. Please wait...');
      return;
    }

    setError('');
    setStep('creating');

    try {
      toast.loading('Creating encrypted request...', { id: 'create-request' });
      
      const amountWei = parseUnits(amount, TOKEN_CONFIG.decimals);
      const result = await createRequest({ amount: amountWei, expiresIn });

      if (result) {
        setRequestId(result.id);
        setTxHash(result.hash);
        toast.success('Request created!', { id: 'create-request' });
        setStep('share');
      } else {
        throw new Error('Failed to create request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create request';
      setError(errorMessage);
      toast.error('Failed to create request', { id: 'create-request' });
      setStep('form');
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(paymentLink);
    if (success) {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    if (step === 'share') setStep('form');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-xl mx-auto">
          {/* Back Button */}
          {step !== 'creating' && (
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

          <AnimatePresence mode="wait">
            {/* Step 1: Request Form */}
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Header with Icon */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <Download className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Request Money
                      </h1>
                      <p className="text-gray-500">
                        Create an on-chain payment request
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

                      {/* Expiry Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Request Expiry
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {EXPIRY_OPTIONS.slice(0, 3).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setExpiresIn(option.value)}
                              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                expiresIn === option.value
                                  ? 'bg-paypal-blue text-white'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {EXPIRY_OPTIONS.slice(3).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setExpiresIn(option.value)}
                              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                expiresIn === option.value
                                  ? 'bg-paypal-blue text-white'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          What's this for? (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Add a note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all"
                        />
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

                      {/* Privacy Notice */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            Request amount is <span className="font-semibold text-gray-900">encrypted on-chain</span>. Only you will know how much you requested.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={!fhevmReady || isProcessing}
                        className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                        size="lg"
                      >
                        {!fhevmReady ? 'Connecting...' : 'Create Request'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Creating (Loading) */}
            {step === 'creating' && (
              <motion.div
                key="creating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
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
                      Creating Request...
                    </h2>
                    <p className="text-gray-500">
                      Encrypting amount and storing on-chain
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Share */}
            {step === 'share' && (
              <motion.div
                key="share"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60 scale-150" />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.6 }}
                          className="relative w-20 h-20 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-full flex items-center justify-center shadow-xl"
                        >
                          <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Sparkles className="w-4 h-4 text-paypal-blue" />
                        </motion.div>
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          Request Created!
                        </h1>
                        <p className="text-gray-500">
                          Share this link to receive{' '}
                          <span className="font-bold text-gray-900">${amount} {TOKEN_CONFIG.symbol}</span>
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Request ID */}
                      {requestId && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Request ID</span>
                            <span className="font-mono text-sm text-gray-900">
                              {requestId.slice(0, 10)}...{requestId.slice(-8)}
                            </span>
                          </div>
                          {expiresIn > 0 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                              <span className="text-sm text-gray-500">Expires in</span>
                              <span className="text-sm font-medium text-gray-900">
                                {EXPIRY_OPTIONS.find(o => o.value === expiresIn)?.label}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Link */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <LinkIcon className="w-4 h-4 text-paypal-blue" />
                          <span className="text-sm font-semibold text-gray-900">Payment Link</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={paymentLink}
                            readOnly
                            className="flex-1 text-sm bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-600 font-mono focus:outline-none"
                          />
                          <Button
                            variant="outline"
                            onClick={handleCopy}
                            className={`flex-shrink-0 border-2 px-4 ${
                              copied 
                                ? 'border-paypal-blue text-paypal-blue bg-paypal-navy/10' 
                                : 'border-gray-200 hover:border-paypal-blue hover:text-paypal-blue'
                            }`}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* QR Code placeholder */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 text-center">
                        <div className="w-36 h-36 bg-white border-2 border-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner">
                          <QrCode className="w-20 h-20 text-gray-200" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                          QR Code (Coming Soon)
                        </p>
                      </div>

                      {/* Transaction Link */}
                      {txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-paypal-blue hover:text-paypal-dark transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm font-medium">View on Etherscan</span>
                        </a>
                      )}

                      {/* Share buttons */}
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="border-2 border-gray-200 hover:border-paypal-blue hover:text-paypal-blue"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Payment Request',
                                text: note || `Pay me $${amount} ${TOKEN_CONFIG.symbol}`,
                                url: paymentLink,
                              });
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
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
