import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Send, 
  Download, 
  Eye, 
  EyeOff,
  RefreshCw,
  Clock,
  ArrowRight,
  Shield,
  Plus,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Copy,
  ExternalLink,
  QrCode,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { formatAddress } from '../lib/utils';
import { useConfidentialToken, useFhevm } from '../hooks';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { useAruviGateway } from '../hooks/useAruviGateway';

export function Dashboard() {
  const { address } = useAccount();
  const [showBalance, setShowBalance] = useState(false);
  
  // Real blockchain hooks
  const { isReady: fhevmReady, isLoading: fhevmLoading, error: fhevmError, initialize } = useFhevm();
  const { 
    formattedDecryptedBalance,
    decryptBalance,
    isDecrypting,
    confidentialBalanceHandle,
    fhevmReady: tokenFhevmReady,
    isOperatorValid,
    setGatewayAsOperator,
    isSettingOperator,
    refetch
  } = useConfidentialToken();
  
  // Get transaction history for stats
  const { transactions, stats, isLoading: txLoading } = useTransactionHistory();
  const { requestCount } = useAruviGateway();

  // Auto-refresh on mount
  useEffect(() => {
    if (address) {
      refetch();
    }
  }, [address, refetch]);

  const handleRevealBalance = async () => {
    if (showBalance) {
      setShowBalance(false);
      return;
    }

    if (!fhevmReady) {
      toast.error('FHEVM not ready. Please wait...');
      await initialize();
      return;
    }

    if (!confidentialBalanceHandle) {
      toast.error('No confidential balance found. Wrap some USDC first.');
      return;
    }

    try {
      const result = await decryptBalance();
      if (result !== null) {
        setShowBalance(true);
        toast.success('Balance decrypted successfully');
      }
    } catch {
      toast.error('Failed to decrypt balance');
    }
  };

  const handleSetupOperator = async () => {
    if (!fhevmReady) {
      toast.error('FHEVM not ready');
      return;
    }
    
    try {
      await setGatewayAsOperator();
      toast.success('Gateway operator set successfully');
    } catch {
      toast.error('Failed to set operator');
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome back
            </h1>
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <span className="text-3xl">👋</span>
            </motion.div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
              {address && formatAddress(address, 6)}
            </span>
            <button 
              onClick={handleCopyAddress}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card - Hero Style */}
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
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                <div className="relative p-8 md:p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm font-medium">Confidential Balance</p>
                        <p className="text-white font-bold">cUSDC</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRevealBalance}
                      disabled={isDecrypting}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 text-sm font-medium transition-all disabled:opacity-50 backdrop-blur-sm"
                    >
                      {isDecrypting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Decrypting...
                        </>
                      ) : showBalance ? (
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

                  <div className="mb-8">
                    <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                      {showBalance && formattedDecryptedBalance ? (
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
                      {fhevmReady ? (
                        'Encrypted on-chain • Only you can see'
                      ) : fhevmLoading ? (
                        'Initializing encryption...'
                      ) : fhevmError ? (
                        <span className="text-red-300">Connection error - click to retry</span>
                      ) : (
                        'Connect wallet to enable encryption'
                      )}
                    </p>
                    {!isOperatorValid && tokenFhevmReady && (
                      <button
                        onClick={handleSetupOperator}
                        disabled={isSettingOperator}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 text-sm font-medium transition-all"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {isSettingOperator ? 'Setting up...' : 'Setup required for payments'}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link to="/send">
                      <Button className="bg-white text-paypal-blue hover:bg-white/90 shadow-lg shadow-black/10 px-6">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </Link>
                    <Link to="/request">
                      <Button className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm px-6">
                        <Download className="w-4 h-4 mr-2" />
                        Request
                      </Button>
                    </Link>
                    <Link to="/wallet">
                      <Button className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Funds
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Sent', value: stats.totalSent.toString(), icon: ArrowUpRight },
                { label: 'Received', value: stats.totalReceived.toString(), icon: ArrowDownLeft },
                { label: 'Refunds', value: stats.totalRefunds.toString(), icon: RefreshCw },
                { label: 'Requests', value: (requestCount || 0n).toString(), icon: Download },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-paypal-navy/10 rounded-xl flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-paypal-navy" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <Link 
                      to="/activity" 
                      className="text-sm text-paypal-blue hover:text-paypal-dark font-medium flex items-center gap-1 group"
                    >
                      View All
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {txLoading ? (
                  <div className="p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-500 text-sm">Loading transactions...</p>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.type === 'sent' ? 'bg-red-50' :
                            tx.type === 'received' ? 'bg-green-50' : 'bg-blue-50'
                          }`}>
                            {tx.type === 'sent' && <ArrowUpRight className="w-5 h-5 text-red-500" />}
                            {tx.type === 'received' && <ArrowDownLeft className="w-5 h-5 text-green-500" />}
                            {tx.type === 'refund' && <RotateCcw className="w-5 h-5 text-paypal-blue" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {tx.type === 'sent' ? 'To: ' : 'From: '}
                              {formatAddress(tx.counterparty, 6)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              tx.type === 'sent' ? 'text-red-600' :
                              tx.type === 'received' ? 'text-green-600' : 'text-paypal-blue'
                            }`}>
                              {tx.type === 'sent' ? '-' : '+'}$••••
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(tx.timestamp * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="p-12 text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
                        <Clock className="w-10 h-10 text-gray-300" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-paypal-blue rounded-full flex items-center justify-center"
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      Your encrypted transactions will appear here once you start using Aruvi.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link to="/send">
                        <Button className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/20">
                          <Send className="w-4 h-4 mr-2" />
                          Send Money
                        </Button>
                      </Link>
                      <Link to="/wallet">
                        <Button variant="outline" className="border-2">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Funds
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-3">
                  {[
                    { 
                      to: '/send', 
                      icon: Send, 
                      title: 'Send Money', 
                      desc: 'Transfer privately'
                    },
                    { 
                      to: '/request', 
                      icon: Download, 
                      title: 'Request Money', 
                      desc: 'Create payment link'
                    },
                    { 
                      to: '/wallet', 
                      icon: Wallet, 
                      title: 'Manage Wallet', 
                      desc: 'Wrap or unwrap'
                    },
                    { 
                      to: '/subscriptions', 
                      icon: RefreshCw, 
                      title: 'Subscriptions', 
                      desc: 'Recurring payments'
                    },
                    { 
                      to: '/business', 
                      icon: TrendingUp, 
                      title: 'Business', 
                      desc: 'Accept payments'
                    },
                    { 
                      to: '/refunds', 
                      icon: RotateCcw, 
                      title: 'Refunds', 
                      desc: 'Issue refunds'
                    },
                  ].map((action) => (
                    <Link key={action.to} to={action.to} className="block">
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-500">{action.desc}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-paypal-blue group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Your Address Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Your Address</h3>
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paypal-blue hover:text-paypal-dark"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3">
                  <code className="text-sm text-gray-600 font-mono truncate">
                    {address}
                  </code>
                  <button 
                    onClick={handleCopyAddress}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                  <QrCode className="w-5 h-5" />
                  Show QR Code
                </button>
              </Card>
            </motion.div>

            {/* Privacy Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-paypal-blue/10 via-blue-50 to-indigo-50 border border-blue-100/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Privacy Protected</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Your balances and transactions are encrypted using FHE. Only you can decrypt and view your data.
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
