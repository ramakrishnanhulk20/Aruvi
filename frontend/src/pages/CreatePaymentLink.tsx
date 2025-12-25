import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Link as LinkIcon,
  FileText,
  Check,
  Copy,
  Share2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Shield,
  Download
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { copyToClipboard } from '../lib/utils';
import { useAruviGateway } from '../hooks/useAruviGateway';
import { TOKEN_CONFIG } from '../lib/contracts';

type Step = 'details' | 'creating' | 'success';

export function CreatePaymentLink() {
  const navigate = useNavigate();
  useAccount(); // Ensure wallet connected
  const { createRequest, isProcessing, fhevmReady } = useAruviGateway();
  
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [anyAmount, setAnyAmount] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Generate payment link with requestId (if created on-chain)
  const paymentLink = requestId 
    ? `${window.location.origin}/pay/${requestId}?${[
        !anyAmount && amount ? `amount=${encodeURIComponent(amount)}` : '',
        description ? `note=${encodeURIComponent(description)}` : ''
      ].filter(Boolean).join('&')}`
    : '';

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this payment link');
      return;
    }
    if (!anyAmount && (!amount || parseFloat(amount) <= 0)) {
      setError('Please enter a valid amount or select "Any amount"');
      return;
    }
    if (!fhevmReady) {
      setError('Encryption not ready. Please wait...');
      return;
    }
    
    setError('');
    setStep('creating');

    try {
      toast.loading('Creating payment link on-chain...', { id: 'create-link' });
      
      // Use 0 for any amount, or the actual amount
      const amountWei = anyAmount 
        ? 0n 
        : parseUnits(amount, TOKEN_CONFIG.decimals);
      
      const result = await createRequest({ 
        amount: amountWei, 
        expiresIn: 0 // Never expires
      });

      if (result) {
        // Only reached if transaction succeeded (createRequest now checks receipt.status)
        setRequestId(result.id);
        setTxHash(result.hash);
        
        // Save to localStorage for PaymentLinks page
        const savedLinks = JSON.parse(localStorage.getItem('aruvi_payment_links') || '[]');
        savedLinks.unshift({
          id: result.id,
          name,
          amount: anyAmount ? null : amount,
          description,
          createdAt: Date.now(),
          payments: 0,
          totalReceived: '0',
          isActive: true,
          txHash: result.hash,
        });
        localStorage.setItem('aruvi_payment_links', JSON.stringify(savedLinks));
        
        toast.success('Payment link created!', { id: 'create-link' });
        setStep('success');
      } else {
        throw new Error('Failed to create payment link - no result returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment link';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'create-link' });
      setStep('details');
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(paymentLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              onClick={() => navigate('/business/links')}
              className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Payment Links</span>
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Details */}
            {step === 'details' && (
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
                        <LinkIcon className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Create Payment Link
                      </h1>
                      <p className="text-gray-500">
                        Accept encrypted payments from anyone
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Name Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Link Name *
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="e.g., Product Purchase, Service Fee"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Amount
                        </label>
                        
                        {/* Any Amount Toggle */}
                        <button
                          onClick={() => setAnyAmount(!anyAmount)}
                          className={`w-full mb-3 p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                            anyAmount 
                              ? 'border-paypal-blue bg-paypal-navy/10' 
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className={anyAmount ? 'text-paypal-blue font-medium' : 'text-gray-600'}>
                            Let payer choose amount
                          </span>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            anyAmount 
                              ? 'border-paypal-blue bg-paypal-blue' 
                              : 'border-gray-300'
                          }`}>
                            {anyAmount && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>

                        {!anyAmount && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 text-center"
                          >
                            <div className="inline-flex items-baseline">
                              <span className="text-3xl font-bold text-gray-300 mr-1">$</span>
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="text-5xl font-bold text-gray-900 bg-transparent border-none outline-none text-center w-48 placeholder:text-gray-300"
                              />
                            </div>
                            <p className="text-gray-400 mt-2 font-medium">cUSDC</p>
                          </motion.div>
                        )}
                      </div>

                      {/* Description Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          placeholder="Add details about what this payment is for..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all resize-none"
                        />
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
                            All payments through this link will be <span className="font-semibold text-gray-900">encrypted</span>. 
                            Payment amounts are hidden from everyone except you.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={!fhevmReady || isProcessing}
                        className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                        size="lg"
                      >
                        {!fhevmReady ? 'Connecting...' : isProcessing ? 'Creating...' : 'Create Payment Link'}
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
                      Creating Payment Link...
                    </h2>
                    <p className="text-gray-500">
                      Encrypting and storing on-chain
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                          Payment Link Created!
                        </h1>
                        <p className="text-gray-500">
                          Share this link to receive payments for <span className="font-bold text-gray-900">{name}</span>
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Link Display */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <LinkIcon className="w-4 h-4 text-paypal-blue" />
                          <span className="text-sm font-semibold text-gray-900">Your Payment Link</span>
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

                      {/* Summary */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-medium text-gray-900">
                            {anyAmount ? 'Payer chooses' : `$${amount} cUSDC`}
                          </span>
                        </div>
                        {description && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Description</span>
                            <span className="font-medium text-gray-900">{description}</span>
                          </div>
                        )}
                        {requestId && (
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-500">Request ID</span>
                            <span className="font-mono text-xs text-gray-600">
                              {requestId.slice(0, 10)}...{requestId.slice(-6)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* QR Code */}
                      <div className="qr-code-container bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 text-center">
                        <div className="w-40 h-40 bg-white border-2 border-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center p-3 shadow-inner">
                          <QRCodeSVG 
                            value={paymentLink}
                            size={136}
                            level="H"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#003087"
                          />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-3">
                          Scan to pay with Aruvi
                        </p>
                        <button 
                          onClick={() => {
                            const svg = document.querySelector('.qr-code-container svg');
                            if (svg) {
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const svgData = new XMLSerializer().serializeToString(svg);
                              const img = new Image();
                              img.onload = () => {
                                canvas.width = 400;
                                canvas.height = 400;
                                if (ctx) {
                                  ctx.fillStyle = '#ffffff';
                                  ctx.fillRect(0, 0, 400, 400);
                                  ctx.drawImage(img, 0, 0, 400, 400);
                                }
                                const link = document.createElement('a');
                                link.download = `aruvi-payment-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
                                link.href = canvas.toDataURL('image/png');
                                link.click();
                              };
                              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                            }
                          }}
                          className="inline-flex items-center gap-2 text-sm text-paypal-blue hover:text-paypal-dark font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download QR Code
                        </button>
                      </div>

                      {/* Transaction Link */}
                      {txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-paypal-blue hover:text-paypal-dark transition-colors"
                        >
                          <span className="text-sm font-medium">View on Etherscan</span>
                        </a>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="border-2 border-gray-200 hover:border-paypal-blue hover:text-paypal-blue"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: name,
                                text: description || `Pay with Aruvi`,
                                url: paymentLink,
                              });
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          onClick={() => navigate('/business/links')}
                          className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700"
                        >
                          Done
                        </Button>
                      </div>

                      <button
                        onClick={() => {
                          setStep('details');
                          setName('');
                          setAmount('');
                          setAnyAmount(false);
                          setDescription('');
                        }}
                        className="w-full text-center text-paypal-blue hover:text-paypal-dark font-medium py-2"
                      >
                        Create Another Link
                      </button>
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
