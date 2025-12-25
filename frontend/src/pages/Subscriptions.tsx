/**
 * Subscriptions Page
 * Manage recurring confidential payments
 * PayPal-like UI with Navy blue & white design
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { isAddress, parseUnits, parseAbiItem } from 'viem';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Clock,
  Plus,
  Play,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  User,
  DollarSign,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { useAruviGateway } from '../hooks/useAruviGateway';
import { useConfidentialToken } from '../hooks/useConfidentialToken';
import { TOKEN_CONFIG, CONTRACTS } from '../lib/contracts';
import { formatAddress } from '../lib/utils';

// Event signatures
const SUBSCRIPTION_CREATED_EVENT = parseAbiItem('event SubscriptionCreated(bytes32 indexed subscriptionId, address indexed subscriber, address indexed recipient)');
const SUBSCRIPTION_CANCELLED_EVENT = parseAbiItem('event SubscriptionCancelled(bytes32 indexed subscriptionId)');

// Subscription frequency options
const FREQUENCY_OPTIONS = [
  { value: 86400, label: 'Daily', description: 'Every 24 hours' },
  { value: 604800, label: 'Weekly', description: 'Every 7 days' },
  { value: 2592000, label: 'Monthly', description: 'Every 30 days' },
];

type View = 'list' | 'create' | 'success';

// Subscription type from contract events
interface Subscription {
  id: `0x${string}`;
  recipient: `0x${string}`;
  frequency: number;
  nextPayment: number;
  status: 'active' | 'cancelled';
  createdAt: number;
  txHash: string;
}

// Zero bytes32 handle
const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function Subscriptions() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { createSubscription, cancelSubscription, executeSubscription, isProcessing, fhevmReady, getSubscriptionInfo } = useAruviGateway();
  const { confidentialBalanceHandle, formattedErc20Balance } = useConfidentialToken();

  const [view, setView] = useState<View>('list');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState(FREQUENCY_OPTIONS[2].value); // Monthly default
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const hasCusdcBalance = confidentialBalanceHandle && confidentialBalanceHandle !== ZERO_HANDLE;
  const hasUsdcBalance = formattedErc20Balance && parseFloat(formattedErc20Balance) > 0;
  const isValidRecipient = recipient && isAddress(recipient);
  const isValidAmount = amount && parseFloat(amount) > 0;

  // Fetch subscriptions from blockchain events
  const fetchSubscriptions = useCallback(async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch SubscriptionCreated events for this user
      const createdLogs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: SUBSCRIPTION_CREATED_EVENT,
        args: { subscriber: address },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      // Fetch SubscriptionCancelled events
      const cancelledLogs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: SUBSCRIPTION_CANCELLED_EVENT,
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      const cancelledIds = new Set(
        cancelledLogs.map(log => ((log.args as { subscriptionId?: string }).subscriptionId || '').toLowerCase())
      );

      // Build subscription list
      const subs: Subscription[] = [];
      for (const log of createdLogs) {
        const subscriptionId = (log.args as { subscriptionId?: string }).subscriptionId as `0x${string}`;
        const recipientAddr = (log.args as { recipient?: string }).recipient as `0x${string}`;
        
        if (!subscriptionId) continue;

        // Get subscription details from contract
        let interval = 2592000; // Default 30 days
        let nextPayment = Math.floor(Date.now() / 1000) + interval;
        let isActive = !cancelledIds.has(subscriptionId.toLowerCase());

        try {
          const info = await getSubscriptionInfo(subscriptionId);
          if (info) {
            interval = Number(info.interval);
            nextPayment = Number(info.nextPayment);
            isActive = info.active;
          }
        } catch {
          // Use defaults if query fails
        }

        subs.push({
          id: subscriptionId,
          recipient: recipientAddr,
          frequency: interval,
          nextPayment,
          status: isActive ? 'active' : 'cancelled',
          createdAt: Math.floor(Date.now() / 1000),
          txHash: log.transactionHash,
        });
      }

      // Sort by creation (newest first)
      subs.reverse();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      // Fall back to localStorage
      const stored = localStorage.getItem('aruvi_subscriptions');
      if (stored) {
        try {
          setSubscriptions(JSON.parse(stored));
        } catch {
          setSubscriptions([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, getSubscriptionInfo]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Save to localStorage as backup
  const saveSubscriptions = (subs: Subscription[]) => {
    setSubscriptions(subs);
    localStorage.setItem('aruvi_subscriptions', JSON.stringify(subs));
  };

  const handleCreateSubscription = async () => {
    setFormError('');

    if (!isValidRecipient) {
      setFormError('Please enter a valid recipient address');
      return;
    }
    if (!isValidAmount) {
      setFormError('Please enter a valid amount');
      return;
    }

    try {
      toast.loading('Creating subscription...', { id: 'create-sub' });
      
      const amountWei = parseUnits(amount, TOKEN_CONFIG.decimals);
      const result = await createSubscription({
        recipient: recipient as `0x${string}`,
        amount: amountWei,
        interval: frequency
      });
      
      if (result) {
        // Add to local subscriptions
        const newSub: Subscription = {
          id: result.id as `0x${string}`,
          recipient: recipient as `0x${string}`,
          frequency,
          nextPayment: Math.floor(Date.now() / 1000) + frequency,
          status: 'active',
          createdAt: Math.floor(Date.now() / 1000),
          txHash: result.hash,
        };
        saveSubscriptions([newSub, ...subscriptions]);
        setView('success');
        toast.success('Subscription created!', { id: 'create-sub' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setFormError(errorMessage);
      toast.error(errorMessage, { id: 'create-sub' });
    }
  };

  const handleCancelSubscription = async (subId: `0x${string}`) => {
    try {
      toast.loading('Cancelling subscription...', { id: 'cancel-sub' });
      await cancelSubscription(subId);
      
      // Update local state
      const updated = subscriptions.map(s => 
        s.id === subId ? { ...s, status: 'cancelled' as const } : s
      );
      saveSubscriptions(updated);
      toast.success('Subscription cancelled', { id: 'cancel-sub' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      toast.error(errorMessage, { id: 'cancel-sub' });
    }
  };

  const handleExecuteSubscription = async (subId: `0x${string}`) => {
    try {
      toast.loading('Processing payment...', { id: 'exec-sub' });
      await executeSubscription(subId);
      
      // Update next payment time
      const updated = subscriptions.map(s => 
        s.id === subId ? { ...s, nextPayment: Math.floor(Date.now() / 1000) + s.frequency } : s
      );
      saveSubscriptions(updated);
      toast.success('Payment processed!', { id: 'exec-sub' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      toast.error(errorMessage, { id: 'exec-sub' });
    }
  };

  const formatFrequency = (seconds: number): string => {
    const option = FREQUENCY_OPTIONS.find(o => o.value === seconds);
    return option?.label || `Every ${Math.floor(seconds / 86400)} days`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Track current time in state to check if payments are due
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Math.floor(Date.now() / 1000));
  
  // Update timestamp periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  const isPaymentDue = (nextPayment: number): boolean => {
    return nextPayment <= currentTimestamp;
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setFrequency(FREQUENCY_OPTIONS[2].value);
    setFormError('');
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              if (view === 'create' || view === 'success') {
                resetForm();
                setView('list');
              } else {
                navigate('/dashboard');
              }
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{view !== 'list' ? 'Back to Subscriptions' : 'Back to Dashboard'}</span>
          </motion.button>

          <AnimatePresence mode="wait">
            {/* List View */}
            {view === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscriptions</h1>
                    <p className="text-gray-500">Manage your recurring payments</p>
                  </div>
                  <Button
                    onClick={() => setView('create')}
                    className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Subscription
                  </Button>
                </div>

                {/* Privacy Notice */}
                <Card className="mb-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-paypal-blue/5 to-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Encrypted recurring payments.</span>{' '}
                        All subscription amounts are encrypted with FHE — only you and the recipient can see payment values.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Subscriptions List */}
                {isLoading ? (
                  <Card className="p-12">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-500">Loading subscriptions...</p>
                    </div>
                  </Card>
                ) : activeSubscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {activeSubscriptions.map((sub) => (
                      <Card key={sub.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500">
                                <RefreshCw className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-mono text-sm text-gray-600">
                                  {formatAddress(sub.recipient, 10)}
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                  $••••••{' '}
                                  <span className="text-sm font-normal text-gray-500">{TOKEN_CONFIG.symbol}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">{formatFrequency(sub.frequency)}</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Active
                            </span>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`flex items-center gap-1 ${
                                isPaymentDue(sub.nextPayment) ? 'text-orange-600 font-semibold' : 'text-gray-500'
                              }`}>
                                <Clock className="w-4 h-4" />
                                {isPaymentDue(sub.nextPayment) ? 'Payment due!' : `Next: ${formatDate(sub.nextPayment)}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPaymentDue(sub.nextPayment) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleExecuteSubscription(sub.id)}
                                  disabled={isProcessing}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Pay Now
                                </Button>
                              )}
                              <button 
                                onClick={() => handleCancelSubscription(sub.id)}
                                disabled={isProcessing}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-5 h-5 text-red-500" />
                              </button>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${sub.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <Card className="overflow-hidden">
                    <div className="p-12 text-center">
                      <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
                          <RefreshCw className="w-10 h-10 text-gray-300" />
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-paypal-blue rounded-full flex items-center justify-center"
                        >
                          <Sparkles className="w-3 h-3 text-white" />
                        </motion.div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No subscriptions yet</h3>
                      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        Set up recurring payments for services, memberships, or regular transfers.
                      </p>
                      <Button
                        onClick={() => setView('create')}
                        className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Subscription
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Features Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 grid md:grid-cols-3 gap-4"
                >
                  {[
                    {
                      icon: Shield,
                      title: 'Private Payments',
                      desc: 'Amounts encrypted with FHE'
                    },
                    {
                      icon: Calendar,
                      title: 'Flexible Schedules',
                      desc: 'Daily, weekly, or monthly'
                    },
                    {
                      icon: CheckCircle2,
                      title: 'Full Control',
                      desc: 'Pause or cancel anytime'
                    }
                  ].map((feature) => (
                    <div
                      key={feature.title}
                      className="p-4 rounded-xl bg-gradient-to-br from-paypal-blue/5 to-blue-50 border border-blue-100/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <feature.icon className="w-5 h-5 text-paypal-blue" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                          <p className="text-sm text-gray-600">{feature.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Create View */}
            {view === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <RefreshCw className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        New Subscription
                      </h1>
                      <p className="text-gray-500">
                        Set up automatic recurring payments
                      </p>
                    </div>

                    {/* No cUSDC Balance Warning */}
                    {!hasCusdcBalance && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-paypal-navy/5 border border-paypal-blue/20 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-paypal-dark mb-1">
                              No cUSDC Balance
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              You need cUSDC to create subscriptions.
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
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Amount per Payment
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-12 pr-20 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-paypal-blue focus:bg-white transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            {TOKEN_CONFIG.symbol}
                          </span>
                        </div>
                      </div>

                      {/* Frequency Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Payment Frequency
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {FREQUENCY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setFrequency(option.value)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                frequency === option.value
                                  ? 'border-paypal-blue bg-paypal-blue/5'
                                  : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                              }`}
                            >
                              <p className={`font-semibold ${
                                frequency === option.value ? 'text-paypal-blue' : 'text-gray-900'
                              }`}>
                                {option.label}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Error */}
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl"
                        >
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{formError}</span>
                        </motion.div>
                      )}

                      {/* Privacy Notice */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            All subscription amounts are <span className="font-semibold text-gray-900">encrypted</span> using FHE. 
                            Only you and the recipient can see the payment amounts.
                          </p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleCreateSubscription}
                        disabled={!fhevmReady || isProcessing || !isValidRecipient || !isValidAmount || !hasCusdcBalance}
                        className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                        size="lg"
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                          </span>
                        ) : (
                          <>
                            Create Subscription
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Success View */}
            {view === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Subscription Created!
                    </h2>
                    <p className="text-gray-500 mb-6">
                      Your recurring payment has been set up successfully.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Recipient</span>
                        <span className="font-mono text-sm">{formatAddress(recipient as `0x${string}`, 10)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Amount</span>
                        <span className="font-semibold">${amount} {TOKEN_CONFIG.symbol}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Frequency</span>
                        <span className="font-semibold">{formatFrequency(frequency)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          resetForm();
                          setView('list');
                        }}
                      >
                        View All
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-paypal-blue to-blue-600"
                        onClick={() => {
                          resetForm();
                          setView('create');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Another
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

export default Subscriptions;
