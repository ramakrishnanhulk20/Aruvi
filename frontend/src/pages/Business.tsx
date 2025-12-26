import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import { motion } from 'framer-motion';
import { parseAbiItem } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Link as LinkIcon,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Shield,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { CONTRACTS } from '../lib/contracts';
import { useConfidentialToken } from '../hooks/useConfidentialToken';
import { formatAddress } from '../lib/utils';

// Event signatures - MUST match contract exactly!
const PAYMENT_SENT_EVENT = parseAbiItem('event PaymentSent(bytes32 indexed paymentId, address indexed from, address indexed to)');
const REQUEST_CREATED_EVENT = parseAbiItem('event RequestCreated(bytes32 indexed requestId, address indexed requester)');

export function Business() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { formattedDecryptedBalance, decryptBalance, isDecrypting: tokenDecrypting, confidentialBalanceHandle } = useConfidentialToken();
  
  const [showRevenue, setShowRevenue] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real stats from blockchain
  const [stats, setStats] = useState({
    totalPayments: 0,
    activeLinks: 0,
    customers: new Set<string>(),
  });
  const [recentPayments, setRecentPayments] = useState<Array<{
    paymentId: string;
    sender: string;
    timestamp: number;
    txHash: string;
  }>>([]);
  const [paymentLinks, setPaymentLinks] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);

  // Fetch business stats from blockchain
  const fetchBusinessStats = useCallback(async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch payments received by this user (as recipient = 'to')
      const receivedLogs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: PAYMENT_SENT_EVENT,
        args: { to: address },  // 'to' is recipient in contract
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      // Fetch requests created by this user
      const requestLogs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: REQUEST_CREATED_EVENT,
        args: { requester: address },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      // Count unique customers (senders = 'from')
      const customers = new Set<string>();
      const payments: typeof recentPayments = [];

      for (const log of receivedLogs) {
        const sender = (log.args as { from?: string }).from;  // 'from' is sender in contract
        if (sender) {
          customers.add(sender.toLowerCase());
          payments.push({
            paymentId: (log.args as { paymentId?: string }).paymentId || '',
            sender,
            timestamp: Math.floor(Date.now() / 1000), // Would need block timestamp
            txHash: log.transactionHash,
          });
        }
      }

      // Get active links count from localStorage
      const savedLinks = JSON.parse(localStorage.getItem('aruvi_payment_links') || '[]');
      const activeLinks = savedLinks.filter((l: { isActive?: boolean }) => l.isActive !== false).length;
      setPaymentLinks(savedLinks.slice(0, 3));

      setStats({
        totalPayments: receivedLogs.length,
        activeLinks: activeLinks || requestLogs.length,
        customers,
      });

      // Sort by timestamp (newest first) and take last 5
      payments.reverse();
      setRecentPayments(payments.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch business stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchBusinessStats();
  }, [fetchBusinessStats]);

  const handleRevealRevenue = async () => {
    if (showRevenue) {
      setShowRevenue(false);
      return;
    }

    if (!confidentialBalanceHandle) {
      toast.error('No confidential balance to decrypt');
      return;
    }

    setIsDecrypting(true);
    try {
      const result = await decryptBalance();
      if (result !== null) {
        setShowRevenue(true);
        toast.success('Revenue decrypted');
      }
    } catch {
      toast.error('Failed to decrypt revenue');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
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
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Business Dashboard
            </h1>
            <p className="text-gray-500">Manage your payments and track revenue</p>
          </div>
          <Link to="/business/links/new">
            <Button className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25">
              <Plus className="w-5 h-5 mr-2" />
              Create Payment Link
            </Button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative overflow-hidden rounded-3xl">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-paypal-blue via-blue-600 to-indigo-700" />
                
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full" />
                  <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-white/5 rounded-full" />
                </div>

                <div className="relative p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm font-medium">Total Revenue</p>
                        <p className="text-white font-bold">Encrypted cUSDC</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRevealRevenue}
                      disabled={isDecrypting || tokenDecrypting}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 text-sm font-medium transition-all disabled:opacity-50 backdrop-blur-sm"
                    >
                      {isDecrypting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Decrypting...
                        </>
                      ) : showRevenue ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Reveal
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                      {showRevenue && formattedDecryptedBalance ? (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-3"
                        >
                          ${formattedDecryptedBalance}
                          <span className="text-2xl font-normal text-white/70">USD</span>
                        </motion.span>
                      ) : (
                        <span className="tracking-wider">$••••••</span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      All-time encrypted revenue (cUSDC balance)
                    </p>
                  </div>

                  {/* Mini Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-white/60 text-xs mb-1">This Month</p>
                      <p className="text-white font-bold text-lg">$••••</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-white/60 text-xs mb-1">Last Month</p>
                      <p className="text-white font-bold text-lg">$••••</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-white/60 text-xs mb-1">Growth</p>
                      <p className="text-white font-bold text-lg">--</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { label: 'Total Payments', value: stats.totalPayments, icon: DollarSign },
                { label: 'Active Links', value: stats.activeLinks, icon: LinkIcon },
                { label: 'Customers', value: stats.customers.size, icon: Users },
              ].map((stat) => (
                <Card key={stat.label} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-paypal-navy/10 rounded-xl flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-paypal-blue" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </Card>
              ))}
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-paypal-navy/10 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-paypal-blue" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
                    </div>
                    <Link 
                      to="/activity" 
                      className="text-sm text-paypal-blue hover:text-paypal-dark font-medium"
                    >
                      View All
                    </Link>
                  </div>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-500 text-sm">Loading payments...</p>
                  </div>
                ) : recentPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h3>
                    <p className="text-gray-500 mb-6">
                      Create a payment link to start receiving encrypted payments.
                    </p>
                    <Link to="/business/links/new">
                      <Button variant="outline" className="border-2 border-gray-200 hover:border-paypal-blue hover:text-paypal-blue">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Payment Link
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentPayments.map((payment) => (
                      <div key={payment.paymentId} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-green-500 rotate-180" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">Payment Received</p>
                            <p className="text-sm text-gray-500 truncate">
                              From: {formatAddress(payment.sender, 6)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+$••••</p>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-paypal-blue hover:underline"
                            >
                              View tx
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Payment Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Payment Links</h2>
                    <Link to="/business/links" className="text-sm text-paypal-blue hover:text-paypal-dark font-medium">
                      Manage
                    </Link>
                  </div>
                </div>

                {paymentLinks.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-paypal-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="w-7 h-7 text-paypal-blue" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                      No payment links yet
                    </p>
                    <Link to="/business/links/new">
                      <Button size="sm" className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700">
                        <Plus className="w-4 h-4 mr-1" />
                        Create Link
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="p-3">
                    {/* Payment links would go here */}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-3">
                  {[
                    { to: '/business/links/new', icon: Plus, title: 'New Payment Link' },
                    { to: '/wallet', icon: DollarSign, title: 'Withdraw Funds' },
                    { to: '/activity', icon: BarChart3, title: 'View Analytics' },
                  ].map((action) => (
                    <Link key={action.to} to={action.to} className="block">
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{action.title}</span>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-paypal-blue transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Privacy Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-paypal-blue/10 via-blue-50 to-indigo-50 border border-blue-100/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Business Privacy</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Your revenue and customer payment amounts are encrypted. Competitors can't see your sales data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
