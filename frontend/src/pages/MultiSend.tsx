/**
 * MultiSend Page - Send to Multiple Recipients
 * Split bills or batch payments to multiple addresses at once
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Users,
  Shield,
  Send as SendIcon,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus,
  Trash2,
  User
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { formatAddress, isValidAddress } from '../lib/utils';
import { TOKEN_CONFIG } from '../lib/contracts';
import { useAruviGateway, useConfidentialToken, useFhevm } from '../hooks';

type Step = 'recipients' | 'confirm' | 'processing' | 'success';

interface Recipient {
  id: string;
  address: string;
  amount: string;
}

// Zero bytes32 handle means no balance
const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function MultiSend() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('recipients');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', address: '', amount: '' },
    { id: '2', address: '', amount: '' },
  ]);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Real blockchain hooks
  const { isReady: fhevmReady, initialize } = useFhevm();
  const { confidentialBalanceHandle } = useConfidentialToken();
  const { multiSend, isProcessing, isEncrypting, fhevmReady: paymentFhevmReady } = useAruviGateway();

  // Check if user has cUSDC balance
  const hasCusdcBalance = confidentialBalanceHandle && confidentialBalanceHandle !== ZERO_HANDLE;

  const isLoading = isProcessing || isEncrypting;

  // Calculate total amount
  const totalAmount = recipients.reduce((sum, r) => {
    const amt = parseFloat(r.amount) || 0;
    return sum + amt;
  }, 0);

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { id: Date.now().toString(), address: '', amount: '' }
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length <= 2) {
      toast.error('Minimum 2 recipients required');
      return;
    }
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const updateRecipient = (id: string, field: 'address' | 'amount', value: string) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleRecipientsSubmit = () => {
    setError('');
    
    // Validate all recipients
    for (const r of recipients) {
      if (!r.address) {
        setError('Please fill in all recipient addresses');
        return;
      }
      if (!isValidAddress(r.address)) {
        setError(`Invalid address: ${r.address.slice(0, 10)}...`);
        return;
      }
      if (!r.amount || parseFloat(r.amount) <= 0) {
        setError('Please enter valid amounts for all recipients');
        return;
      }
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setError('');
    
    if (!hasCusdcBalance) {
      setError('You need cUSDC to send. Please wrap your USDC first.');
      toast.error('No cUSDC balance. Wrap USDC first.');
      return;
    }
    
    if (!fhevmReady || !paymentFhevmReady) {
      toast.error('Encryption not ready. Please wait...');
      await initialize();
      return;
    }

    setStep('processing');

    try {
      const addresses = recipients.map(r => r.address as `0x${string}`);
      const amounts = recipients.map(r => parseUnits(r.amount, TOKEN_CONFIG.decimals));
      
      toast.loading('Encrypting and sending to multiple recipients...', { id: 'multisend' });
      
      const result = await multiSend({
        recipients: addresses,
        amounts,
      });

      if (result) {
        setTxHash(result.hash);
        toast.success(`Sent to ${recipients.length} recipients!`, { id: 'multisend' });
        setStep('success');
      } else {
        throw new Error('Multi-send failed - no result returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'multisend' });
      setStep('confirm');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          {step !== 'processing' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                if (step === 'confirm') setStep('recipients');
                else navigate('/dashboard');
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {step === 'confirm' ? 'Back to recipients' : 'Back to Dashboard'}
              </span>
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {/* Recipients Step */}
            {step === 'recipients' && (
              <motion.div
                key="recipients"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Multi-Send
                      </h1>
                      <p className="text-gray-500">
                        Send encrypted payments to multiple recipients at once
                      </p>
                    </div>

                    {/* Balance Warning */}
                    {!hasCusdcBalance && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">No cUSDC Balance</p>
                          <p className="text-sm text-amber-700 mt-1">
                            You need to wrap USDC to cUSDC first.{' '}
                            <Link to="/wallet" className="underline font-medium">Go to Wallet</Link>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Recipients List */}
                    <div className="space-y-4 mb-6">
                      {recipients.map((recipient, index) => (
                        <div key={recipient.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-paypal-navy/10 rounded-full flex items-center justify-center flex-shrink-0 mt-2">
                            <span className="text-sm font-bold text-paypal-navy">{index + 1}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={recipient.address}
                              onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                              placeholder="0x... recipient address"
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-mono text-sm focus:outline-none focus:border-paypal-blue transition-colors"
                            />
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                value={recipient.amount}
                                onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-lg focus:outline-none focus:border-paypal-blue transition-colors"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Recipient Button */}
                    <button
                      onClick={addRecipient}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-paypal-blue hover:text-paypal-blue transition-colors flex items-center justify-center gap-2 mb-6"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Recipient
                    </button>

                    {/* Total */}
                    <div className="bg-paypal-navy/5 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-paypal-navy">
                          ${totalAmount.toFixed(2)} <span className="text-sm font-normal text-gray-500">cUSDC</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Sending to {recipients.length} recipients
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl mb-6"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}

                    {/* Privacy Notice */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600">
                          Each payment amount is <span className="font-semibold text-gray-900">individually encrypted</span>.
                          Recipients can only see their own payment.
                        </p>
                      </div>
                    </div>

                    {/* Continue Button */}
                    <Button
                      onClick={handleRecipientsSubmit}
                      disabled={!hasCusdcBalance}
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

            {/* Confirm Step */}
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
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <SendIcon className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Confirm Multi-Send
                      </h1>
                      <p className="text-gray-500">
                        Review and confirm your batch payment
                      </p>
                    </div>

                    {/* Recipients Summary */}
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6 space-y-4">
                      {recipients.map((recipient, index) => (
                        <div key={recipient.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-paypal-navy/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-paypal-navy" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Recipient {index + 1}</p>
                              <p className="font-mono text-sm text-gray-900">
                                {formatAddress(recipient.address, 8)}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900">${recipient.amount}</p>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="text-xl font-bold text-paypal-navy">${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl mb-6"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}

                    {/* Send Button */}
                    <Button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <SendIcon className="w-5 h-5 mr-2" />
                          Send ${totalAmount.toFixed(2)} to {recipients.length} Recipients
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-6"
                    />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Multi-Send</h2>
                    <p className="text-gray-500 mb-4">
                      Encrypting {recipients.length} payments and sending to the blockchain...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-paypal-blue text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Each amount is individually encrypted</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Send Complete!</h2>
                    <p className="text-gray-500 mb-8">
                      Successfully sent to {recipients.length} recipients
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        ${totalAmount.toFixed(2)}
                      </div>
                      <p className="text-gray-500">Total Sent</p>
                    </div>

                    {txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-paypal-blue hover:text-paypal-dark text-sm font-medium mb-8"
                      >
                        View on Etherscan
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}

                    <div className="flex gap-4">
                      <Button
                        onClick={() => {
                          setRecipients([
                            { id: '1', address: '', amount: '' },
                            { id: '2', address: '', amount: '' },
                          ]);
                          setTxHash(null);
                          setStep('recipients');
                        }}
                        variant="outline"
                        className="flex-1 border-2"
                      >
                        Send More
                      </Button>
                      <Button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 bg-gradient-to-r from-paypal-blue to-blue-600"
                      >
                        Back to Dashboard
                      </Button>
                    </div>
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
