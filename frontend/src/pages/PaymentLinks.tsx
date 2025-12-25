import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import { motion } from 'framer-motion';
import { parseAbiItem } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  MoreHorizontal,
  Eye,
  DollarSign,
  Users,
  Sparkles,
  QrCode,
  Share2,
  RefreshCw,
  Trash2,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { copyToClipboard } from '../lib/utils';
import { CONTRACTS } from '../lib/contracts';
import { useAruviGateway } from '../hooks/useAruviGateway';

interface PaymentLink {
  id: string;
  name: string;
  amount: string | null;
  description: string;
  createdAt: number;
  payments: number;
  totalReceived: string;
  isActive: boolean;
  url: string;
  txHash?: string;
}

// Helper to build payment URL with amount and description
const buildPaymentUrl = (id: string, amount: string | null, description?: string): string => {
  const params = new URLSearchParams();
  if (amount) params.set('amount', amount);
  if (description) params.set('note', description);
  const queryString = params.toString();
  return `${window.location.origin}/pay/${id}${queryString ? `?${queryString}` : ''}`;
};

// Event signature for RequestCreated
const REQUEST_CREATED_EVENT = parseAbiItem('event RequestCreated(bytes32 indexed requestId, address indexed requester)');
const REQUEST_FULFILLED_EVENT = parseAbiItem('event RequestFulfilled(bytes32 indexed requestId, bytes32 indexed paymentId)');

export function PaymentLinks() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { getRequestInfo, cancelRequest } = useAruviGateway();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch payment links from blockchain events + localStorage
  const fetchPaymentLinks = useCallback(async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get saved links from localStorage (has metadata like name, description)
      const savedLinks: PaymentLink[] = JSON.parse(localStorage.getItem('aruvi_payment_links') || '[]');
      const savedLinkIds = new Set(savedLinks.map(l => l.id.toLowerCase()));

      // Fetch RequestCreated events for this user
      const logs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: REQUEST_CREATED_EVENT,
        args: { requester: address },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      // Fetch fulfillment events to count payments
      const fulfillmentLogs = await publicClient.getLogs({
        address: CONTRACTS.ARUVI_GATEWAY as `0x${string}`,
        event: REQUEST_FULFILLED_EVENT,
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      // Count payments per request
      const paymentCounts: Record<string, number> = {};
      fulfillmentLogs.forEach(log => {
        const requestId = (log.args as { requestId?: string }).requestId?.toLowerCase();
        if (requestId) {
          paymentCounts[requestId] = (paymentCounts[requestId] || 0) + 1;
        }
      });

      // Create links from blockchain events that aren't in localStorage
      const chainLinks: PaymentLink[] = [];
      for (const log of logs) {
        const requestId = (log.args as { requestId?: string }).requestId;
        // Validate requestId is proper bytes32 (66 chars with 0x prefix)
        if (!requestId || requestId === '0x0' || requestId.length !== 66 || savedLinkIds.has(requestId.toLowerCase())) {
          continue;
        }

        // Get request info to check if fulfilled/expired
        let isActive = true;
        try {
          const info = await getRequestInfo(requestId as `0x${string}`);
          isActive = info ? !info.fulfilled && (info.expiresAt === 0n || info.expiresAt > BigInt(Math.floor(Date.now() / 1000))) : true;
        } catch (e) {
          console.warn('Failed to get request info for', requestId, e);
        }

        chainLinks.push({
          id: requestId,
          name: `Payment Request`,
          amount: null, // Can't know amount (encrypted)
          description: '',
          createdAt: Date.now(), // Would need block timestamp
          payments: paymentCounts[requestId.toLowerCase()] || 0,
          totalReceived: '••••',
          isActive,
          url: buildPaymentUrl(requestId, null), // No amount for chain-discovered links
          txHash: log.transactionHash,
        });
      }

      // Update saved links with payment counts and active status
      const updatedSavedLinks = await Promise.all(savedLinks.map(async (link) => {
        let isActive = link.isActive;
        // Only query if valid bytes32 requestId
        if (link.id && link.id !== '0x0' && link.id.length === 66) {
          try {
            const info = await getRequestInfo(link.id as `0x${string}`);
            isActive = info ? !info.fulfilled && (info.expiresAt === 0n || info.expiresAt > BigInt(Math.floor(Date.now() / 1000))) : link.isActive;
          } catch (e) {
            console.warn('Failed to get request info for', link.id, e);
          }
        }
        return {
          ...link,
          payments: paymentCounts[link.id.toLowerCase()] || link.payments,
          isActive,
          url: buildPaymentUrl(link.id, link.amount, link.description),
        };
      }));

      // Combine and sort by creation date
      const allLinks = [...updatedSavedLinks, ...chainLinks];
      allLinks.sort((a, b) => b.createdAt - a.createdAt);

      setPaymentLinks(allLinks);
    } catch (error) {
      console.error('Failed to fetch payment links:', error);
      // Fall back to localStorage only
      const savedLinks: PaymentLink[] = JSON.parse(localStorage.getItem('aruvi_payment_links') || '[]');
      setPaymentLinks(savedLinks.map(l => ({
        ...l,
        url: buildPaymentUrl(l.id, l.amount, l.description),
      })));
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, getRequestInfo]);

  useEffect(() => {
    fetchPaymentLinks();
  }, [fetchPaymentLinks]);

  const handleCopy = async (link: PaymentLink) => {
    const success = await copyToClipboard(link.url);
    if (success) {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (link: PaymentLink) => {
    if (!link.isActive) {
      // Just remove from localStorage if already inactive
      const savedLinks = JSON.parse(localStorage.getItem('aruvi_payment_links') || '[]');
      const updatedLinks = savedLinks.filter((l: PaymentLink) => l.id !== link.id);
      localStorage.setItem('aruvi_payment_links', JSON.stringify(updatedLinks));
      setPaymentLinks(prev => prev.filter(l => l.id !== link.id));
      toast.success('Payment link removed');
      setMenuOpen(null);
      return;
    }

    setIsDeleting(link.id);
    try {
      // Validate requestId is proper bytes32 (66 chars with 0x prefix)
      if (!link.id || link.id.length !== 66 || !link.id.startsWith('0x')) {
        throw new Error('Invalid request ID format. Cannot cancel this payment link on-chain.');
      }
      
      toast.loading('Cancelling payment link...', { id: 'cancel-link' });
      
      // Cancel on-chain
      await cancelRequest(link.id as `0x${string}`);
      
      // Remove from localStorage
      const savedLinks = JSON.parse(localStorage.getItem('aruvi_payment_links') || '[]');
      const updatedLinks = savedLinks.filter((l: PaymentLink) => l.id !== link.id);
      localStorage.setItem('aruvi_payment_links', JSON.stringify(updatedLinks));
      
      setPaymentLinks(prev => prev.filter(l => l.id !== link.id));
      toast.success('Payment link cancelled', { id: 'cancel-link' });
    } catch (error) {
      console.error('Failed to cancel request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel payment link';
      toast.error(errorMessage, { id: 'cancel-link' });
    } finally {
      setIsDeleting(null);
      setMenuOpen(null);
    }
  };

  const handleView = (link: PaymentLink) => {
    window.open(link.url, '_blank');
    setMenuOpen(null);
  };

  const handleViewTransaction = (link: PaymentLink) => {
    if (link.txHash) {
      window.open(`https://sepolia.etherscan.io/tx/${link.txHash}`, '_blank');
    }
    setMenuOpen(null);
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
            onClick={() => navigate('/business')}
            className="flex items-center gap-2 text-gray-500 hover:text-paypal-blue mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Business</span>
          </motion.button>

          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Payment Links
              </h1>
              <p className="text-gray-500">Create and manage your payment links</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPaymentLinks()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-paypal-blue hover:text-paypal-blue transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <Link to="/business/links/new">
                <Button className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Link
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {[
              { label: 'Total Links', value: paymentLinks.length, icon: LinkIcon },
              { label: 'Active Links', value: paymentLinks.filter(l => l.isActive).length, icon: Check },
              { label: 'Total Payments', value: paymentLinks.reduce((acc, l) => acc + l.payments, 0), icon: DollarSign },
            ].map((stat) => (
              <Card key={stat.label} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-paypal-navy/10 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-paypal-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* Payment Links List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="overflow-visible">
              {isLoading ? (
                <div className="p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-paypal-blue/20 border-t-paypal-blue rounded-full mx-auto mb-4"
                  />
                  <p className="text-gray-500">Loading payment links...</p>
                </div>
              ) : paymentLinks.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60 scale-150" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-white to-gray-50 rounded-3xl flex items-center justify-center shadow-xl border border-gray-100">
                      <LinkIcon className="w-12 h-12 text-paypal-navy/40" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No payment links yet</h3>
                  <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
                    Create payment links to accept encrypted cUSDC payments from anyone. 
                    Share links via email, social media, or embed on your website.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/business/links/new">
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25 px-8"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Link
                      </Button>
                    </Link>
                  </div>

                  {/* Feature Highlights */}
                  <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
                    {[
                      { icon: QrCode, title: 'QR Codes', desc: 'Auto-generated for easy scanning' },
                      { icon: Share2, title: 'Easy Sharing', desc: 'Share via any platform' },
                      { icon: Eye, title: 'Track Payments', desc: 'See who paid and when' },
                    ].map((feature) => (
                      <div key={feature.title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <feature.icon className="w-5 h-5 text-paypal-blue" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{feature.title}</p>
                          <p className="text-sm text-gray-500">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paymentLinks.map((link) => (
                    <div key={link.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <LinkIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{link.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{link.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-500">
                                <DollarSign className="w-4 h-4" />
                                {link.amount ? `$${link.amount}` : 'Any amount'}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Users className="w-4 h-4" />
                                {link.payments} payments
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                link.isActive 
                                  ? 'bg-paypal-navy/20 text-paypal-blue' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {link.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(link)}
                            className={`border-2 ${
                              copiedId === link.id 
                                ? 'border-paypal-blue text-paypal-blue bg-paypal-navy/10' 
                                : 'border-gray-200 hover:border-paypal-blue hover:text-paypal-blue'
                            }`}
                          >
                            {copiedId === link.id ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          <div className="relative">
                            <button 
                              onClick={() => setMenuOpen(menuOpen === link.id ? null : link.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            </button>
                            
                            {/* Dropdown Menu - using fixed position to escape any overflow:hidden */}
                            {menuOpen === link.id && (
                              <>
                                {/* Backdrop to close menu */}
                                <div 
                                  className="fixed inset-0" 
                                  style={{ zIndex: 9998 }}
                                  onClick={() => setMenuOpen(null)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 py-2"
                                  style={{ 
                                    zIndex: 9999,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                    top: '100%',
                                  }}
                                >
                                    <button
                                      onClick={() => handleView(link)}
                                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                      <Eye className="w-4 h-4 text-gray-400" />
                                      View Link
                                    </button>
                                    {link.txHash && (
                                      <button
                                        onClick={() => handleViewTransaction(link)}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                      >
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                        View on Etherscan
                                      </button>
                                    )}
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                      onClick={() => handleDelete(link)}
                                      disabled={isDeleting === link.id}
                                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                                    >
                                      {isDeleting === link.id ? (
                                        <>
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                          Cancelling...
                                        </>
                                      ) : link.isActive ? (
                                        <>
                                          <XCircle className="w-4 h-4" />
                                          Cancel Request
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="w-4 h-4" />
                                          Remove
                                        </>
                                      )}
                                    </button>
                                  </motion.div>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
