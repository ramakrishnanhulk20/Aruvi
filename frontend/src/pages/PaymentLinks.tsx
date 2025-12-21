import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
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
  Share2
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { copyToClipboard } from '../lib/utils';

interface PaymentLink {
  id: string;
  name: string;
  amount: string | null; // null means any amount
  description: string;
  createdAt: number;
  payments: number;
  totalReceived: string;
  isActive: boolean;
  url: string;
}

export function PaymentLinks() {
  const navigate = useNavigate();
  useAccount(); // For wallet connection state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // TODO: Replace with real data from blockchain/backend
  const paymentLinks: PaymentLink[] = [];

  const handleCopy = async (link: PaymentLink) => {
    const success = await copyToClipboard(link.url);
    if (success) {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
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
            <Link to="/business/links/new">
              <Button className="bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25">
                <Plus className="w-5 h-5 mr-2" />
                Create New Link
              </Button>
            </Link>
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
            <Card className="overflow-hidden">
              {paymentLinks.length === 0 ? (
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
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                          </button>
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
