import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ArrowDownLeft,
  Sparkles,
  Info,
  X,
  Check
} from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { Header, Footer } from '../components/layout';
import { Card, Button } from '../components/ui';
import { useAruviGateway } from '../hooks/useAruviGateway';
import { formatAddress } from '../lib/utils';
import { CONTRACTS } from '../lib/contracts';

interface ReceivedPayment {
  paymentId: `0x${string}`;
  sender: `0x${string}`;
  timestamp: number;
  txHash: string;
  isRefunded: boolean;
  isRefunding: boolean;
}

export function Refunds() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { refund, getPaymentInfo } = useAruviGateway();

  const [payments, setPayments] = useState<ReceivedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'eligible' | 'refunded'>('all');
  
  // Modal state
  const [selectedPayment, setSelectedPayment] = useState<ReceivedPayment | null>(null);
  const [refundStep, setRefundStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [refundError, setRefundError] = useState('');

  // Fetch received payments from blockchain events
  const fetchReceivedPayments = useCallback(async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // PaymentSent event signature
      const paymentSentEvent = parseAbiItem(
        'event PaymentSent(bytes32 indexed paymentId, address indexed sender, address indexed recipient)'
      );

      // Fetch payments received by the current user
      const receivedLogs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: paymentSentEvent,
        args: {
          recipient: address
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      // Build payment list with details
      const paymentsWithDetails: ReceivedPayment[] = [];

      for (const log of receivedLogs) {
        const paymentId = log.args.paymentId as `0x${string}`;
        const sender = log.args.sender as `0x${string}`;

        // Get block timestamp
        let timestamp = Math.floor(Date.now() / 1000);
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          timestamp = Number(block.timestamp);
        } catch {
          // Use current time if block fetch fails
        }

        // Check if already refunded
        let isRefunded = false;
        try {
          const info = await getPaymentInfo(paymentId);
          if (info) {
            isRefunded = info.isRefunded;
          }
        } catch {
          // Assume not refunded if query fails
        }

        paymentsWithDetails.push({
          paymentId,
          sender,
          timestamp,
          txHash: log.transactionHash,
          isRefunded,
          isRefunding: false
        });
      }

      // Sort by timestamp (newest first)
      paymentsWithDetails.sort((a, b) => b.timestamp - a.timestamp);
      setPayments(paymentsWithDetails);
    } catch (error) {
      console.error('Failed to fetch received payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, getPaymentInfo]);

  useEffect(() => {
    fetchReceivedPayments();
  }, [fetchReceivedPayments]);

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    // Filter by status
    if (filter === 'eligible' && payment.isRefunded) return false;
    if (filter === 'refunded' && !payment.isRefunded) return false;
    
    // Filter by search
    if (searchQuery && !payment.sender.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const eligibleCount = payments.filter(p => !p.isRefunded).length;
  const refundedCount = payments.filter(p => p.isRefunded).length;

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefundClick = (payment: ReceivedPayment) => {
    setSelectedPayment(payment);
    setRefundStep('confirm');
    setRefundError('');
  };

  const handleRefundConfirm = async () => {
    if (!selectedPayment) return;

    setRefundStep('processing');

    try {
      await refund(selectedPayment.paymentId);
      
      // Update local state
      setPayments(prev => prev.map(p => 
        p.paymentId === selectedPayment.paymentId 
          ? { ...p, isRefunded: true }
          : p
      ));

      setRefundStep('success');
    } catch (error) {
      console.error('Refund failed:', error);
      setRefundError(error instanceof Error ? error.message : 'Refund failed. Please try again.');
      setRefundStep('error');
    }
  };

  const closeModal = () => {
    setSelectedPayment(null);
    setRefundStep('confirm');
    setRefundError('');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-500 mb-6">Please connect your wallet to manage refunds.</p>
            <Link to="/dashboard">
              <Button className="bg-gradient-to-r from-paypal-blue to-blue-600">
                Go to Dashboard
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Refunds
                </h1>
                <p className="text-gray-500">Issue refunds for payments you've received</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <Card className="p-5 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowDownLeft className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              <p className="text-sm text-gray-500">Total Received</p>
            </Card>
            <Card className="p-5 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue/10 to-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-paypal-blue" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{eligibleCount}</p>
              <p className="text-sm text-gray-500">Eligible for Refund</p>
            </Card>
            <Card className="p-5 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{refundedCount}</p>
              <p className="text-sm text-gray-500">Already Refunded</p>
            </Card>
          </motion.div>

          {/* Info Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-paypal-blue/5 via-blue-50/50 to-indigo-50/30 border border-blue-100/50 mb-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl" />
            <div className="relative p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">How Refunds Work</p>
                <p className="text-sm text-gray-600">
                  As the recipient, you can issue a refund to return the encrypted payment back to the sender. 
                  The full amount will be transferred back. This action cannot be undone.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6 overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by sender address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paypal-blue/20 focus:border-paypal-blue transition-all"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['all', 'eligible', 'refunded'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`flex-1 md:px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                          filter === type
                            ? 'bg-white text-paypal-blue shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-4"
                  />
                  <p className="text-gray-500">Loading received payments...</p>
                </div>
              ) : filteredPayments.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredPayments.map((payment, index) => (
                    <motion.div
                      key={payment.paymentId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          payment.isRefunded ? 'bg-purple-50' : 'bg-green-50'
                        }`}>
                          {payment.isRefunded ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-500" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${payment.isRefunded ? 'text-purple-600' : 'text-green-600'}`}>
                              {payment.isRefunded ? 'Refunded' : 'Received'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 font-mono truncate">
                            From: {formatAddress(payment.sender, 8)}
                          </p>
                        </div>

                        {/* Amount & Time */}
                        <div className="text-right mr-4">
                          <p className="font-bold text-gray-900">$••••••</p>
                          <p className="text-sm text-gray-400">{formatDate(payment.timestamp)}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {!payment.isRefunded && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefundClick(payment)}
                              className="border-paypal-blue text-paypal-blue hover:bg-paypal-blue hover:text-white"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Refund
                            </Button>
                          )}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400 hover:text-paypal-blue" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="p-16 text-center">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60 scale-150" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-white to-gray-50 rounded-3xl flex items-center justify-center shadow-xl border border-gray-100">
                      <RotateCcw className="w-12 h-12 text-paypal-navy/40" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {filter === 'all' ? 'No payments received yet' : `No ${filter} payments`}
                  </h3>
                  <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
                    {filter === 'all' 
                      ? 'Payments you receive will appear here. You can then issue refunds if needed.'
                      : filter === 'eligible'
                      ? 'All received payments have been refunded.'
                      : 'No refunds have been issued yet.'
                    }
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Refund Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="overflow-hidden shadow-2xl">
                {refundStep === 'confirm' && (
                  <>
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Confirm Refund</h3>
                        <button
                          onClick={closeModal}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                      </div>
                      <p className="text-center text-gray-600 mb-4">
                        You are about to issue a full refund for this payment.
                      </p>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-gray-500 mb-1">Payment ID</p>
                        <p className="font-mono text-gray-700 text-sm truncate">{selectedPayment.paymentId}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-gray-500 mb-1">Recipient (Original Sender)</p>
                        <p className="font-mono text-gray-900">{formatAddress(selectedPayment.sender, 10)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-paypal-blue mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-paypal-blue">
                            The full encrypted amount will be returned. Amounts are kept private and encrypted on-chain for your protection.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-red-500 text-center mb-6">
                        ⚠️ This action cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={closeModal}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-paypal-blue to-blue-600"
                          onClick={handleRefundConfirm}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Confirm Refund
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {refundStep === 'processing' && (
                  <div className="p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-6"
                    />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Refund</h3>
                    <p className="text-gray-500">Please confirm the transaction in your wallet...</p>
                  </div>
                )}

                {refundStep === 'success' && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Refund Successful!</h3>
                    <p className="text-gray-500 mb-6">
                      The payment has been returned to {formatAddress(selectedPayment.sender, 6)}.
                    </p>
                    <Button
                      className="bg-gradient-to-r from-paypal-blue to-blue-600"
                      onClick={closeModal}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Done
                    </Button>
                  </div>
                )}

                {refundStep === 'error' && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Refund Failed</h3>
                    <p className="text-gray-500 mb-6">{refundError}</p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={closeModal}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-paypal-blue to-blue-600"
                        onClick={() => setRefundStep('confirm')}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
