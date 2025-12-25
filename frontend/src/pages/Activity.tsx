import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Clock,
  Search,
  Shield,
  Send,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Download,
  RefreshCw,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Card, Button } from '../components/ui';
import { useTransactionHistory, Transaction } from '../hooks/useTransactionHistory';
import { formatAddress } from '../lib/utils';
import toast from 'react-hot-toast';

type TransactionType = 'all' | 'sent' | 'received' | 'refund';

export function Activity() {
  const navigate = useNavigate();
  const { transactions, isLoading, refetch, stats } = useTransactionHistory();
  const [filter, setFilter] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Export transactions to CSV
  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Counterparty', 'Status', 'Transaction Hash'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.timestamp).toISOString(),
      tx.type,
      tx.counterparty,
      tx.status,
      tx.txHash
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aruvi-activity-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredTransactions.length} transactions`);
  };

  // Filter transactions based on type and search query
  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (searchQuery && !tx.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Within 24 hours
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    // Within 7 days
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    // Older
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'received':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'refund':
        return <RotateCcw className="w-5 h-5 text-paypal-blue" />;
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
        return 'Sent';
      case 'received':
        return 'Received';
      case 'refund':
        return 'Refunded';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
        return 'text-red-600';
      case 'received':
        return 'text-green-600';
      case 'refund':
        return 'text-paypal-blue';
    }
  };

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
                  Activity
                </h1>
                <p className="text-gray-500">Your encrypted transaction history</p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-paypal-blue hover:text-paypal-blue transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">Refresh</span>
                </button>
                <button 
                  onClick={handleExport}
                  disabled={transactions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-paypal-blue hover:text-paypal-blue transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
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
            {[
              { label: 'Sent', value: stats.totalSent.toString(), icon: ArrowUpRight, color: 'text-red-500' },
              { label: 'Received', value: stats.totalReceived.toString(), icon: ArrowDownLeft, color: 'text-green-500' },
              { label: 'Refunds', value: stats.totalRefunds.toString(), icon: RotateCcw, color: 'text-paypal-blue' },
            ].map((stat) => (
              <Card key={stat.label} className="p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue/10 to-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </Card>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="mb-6 overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paypal-blue/20 focus:border-paypal-blue transition-all"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['all', 'sent', 'received', 'refund'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`flex-1 md:px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                          filter === type
                            ? 'bg-white text-paypal-blue shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {type === 'refund' ? 'Refunds' : type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-paypal-blue/5 via-blue-50/50 to-indigo-50/30 border border-blue-100/50 mb-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl" />
            <div className="relative p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">End-to-end encrypted.</span>{' '}
                Transaction amounts are hidden — only you can decrypt and view actual values.
              </p>
            </div>
          </motion.div>

          {/* Transactions List */}
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
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          tx.type === 'sent' ? 'bg-red-50' :
                          tx.type === 'received' ? 'bg-green-50' :
                          'bg-paypal-blue/10'
                        }`}>
                          {getTransactionIcon(tx.type)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${getTransactionColor(tx.type)}`}>
                              {getTransactionLabel(tx.type)}
                            </span>
                            {tx.status === 'refunded' && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                Refunded
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 font-mono truncate">
                            {tx.type === 'sent' ? 'To: ' : 'From: '}
                            {formatAddress(tx.counterparty, 8)}
                          </p>
                        </div>

                        {/* Amount & Time */}
                        <div className="text-right">
                          <p className={`font-bold ${
                            tx.type === 'sent' ? 'text-red-600' :
                            tx.type === 'received' ? 'text-green-600' :
                            'text-paypal-blue'
                          }`}>
                            {tx.type === 'sent' ? '-' : '+'}$••••••
                          </p>
                          <p className="text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
                        </div>

                        {/* External Link */}
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400 hover:text-paypal-blue" />
                        </a>
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
                      <Clock className="w-12 h-12 text-paypal-navy/40" />
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
                    {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
                  </h3>
                  <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
                    {filter === 'all' 
                      ? 'Your encrypted transaction history will appear here once you start sending or receiving cUSDC payments.'
                      : `You don't have any ${filter} transactions yet.`
                    }
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/send">
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25 px-8"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Send Money
                      </Button>
                    </Link>
                    <Link to="/wallet">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-2 border-gray-200 hover:border-paypal-blue hover:text-paypal-blue px-8"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Funds
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
