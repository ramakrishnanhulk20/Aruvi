import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Wallet as WalletIcon,
  Info
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';
import { CONTRACTS, TOKEN_CONFIG } from '../lib/contracts';
import { useConfidentialToken, useFhevm } from '../hooks';

type Tab = 'wrap' | 'unwrap';

export function Wallet() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('wrap');
  const [amount, setAmount] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Real blockchain hooks
  const { isReady: fhevmReady, initialize } = useFhevm();
  const { 
    erc20Balance,
    formattedErc20Balance,
    formattedDecryptedBalance,
    confidentialBalanceHandle,
    decryptBalance,
    isDecrypting,
    wrap,
    unwrap,
    isWrapping,
    isUnwrapping,
    fhevmReady: tokenFhevmReady,
    refetch
  } = useConfidentialToken();

  // Refresh balances on mount and after operations
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
      toast('No confidential balance to decrypt', { icon: 'ℹ️' });
      return;
    }

    try {
      const result = await decryptBalance();
      if (result !== null) {
        setShowBalance(true);
        toast.success('Balance decrypted');
      }
    } catch {
      toast.error('Failed to decrypt balance');
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const amountInWei = parseUnits(amount, TOKEN_CONFIG.decimals);

      if (activeTab === 'wrap') {
        // Check if user has enough USDC
        if (erc20Balance && amountInWei > erc20Balance) {
          setError('Insufficient USDC balance');
          return;
        }

        toast.loading('Wrapping USDC...', { id: 'wrap' });
        await wrap(amountInWei);
        toast.success(`Wrapped ${amount} USDC to cUSDC`, { id: 'wrap' });
        setSuccess(`Successfully wrapped ${amount} USDC to cUSDC`);
      } else {
        // Unwrap requires FHEVM
        if (!tokenFhevmReady) {
          toast.error('FHEVM not ready for unwrap');
          return;
        }

        toast.loading('Unwrapping cUSDC...', { id: 'unwrap' });
        await unwrap(amountInWei);
        toast.success(`Unwrapped ${amount} cUSDC to USDC`, { id: 'unwrap' });
        setSuccess(`Successfully unwrapped ${amount} cUSDC to USDC`);
      }

      setAmount('');
      await refetch();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      toast.error('Transaction failed', { id: activeTab === 'wrap' ? 'wrap' : 'unwrap' });
    }
  };

  const isLoading = isWrapping || isUnwrapping;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-8">
        <div className="max-w-3xl mx-auto">
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Wallet
            </h1>
            <p className="text-gray-500">Manage your USDC and confidential cUSDC balances</p>
          </motion.div>

          {/* Balance Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* USDC Balance - White Card */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <WalletIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">USDC Balance</p>
                      <p className="text-xs text-gray-400">Public Token</p>
                    </div>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/token/${CONTRACTS.USDC}?a=${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ${formattedErc20Balance}
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Visible on-chain
                </p>
              </div>
            </Card>

            {/* cUSDC Balance - Gradient Card */}
            <div className="relative overflow-hidden rounded-2xl">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-paypal-blue via-blue-600 to-indigo-700" />
              
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-white/5 rounded-full" />
                <div className="absolute -bottom-1/2 -left-1/4 w-48 h-48 bg-white/5 rounded-full" />
              </div>

              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80 font-medium">cUSDC Balance</p>
                      <p className="text-xs text-white/60">Confidential Token</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRevealBalance}
                    disabled={isDecrypting}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDecrypting ? (
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    ) : showBalance ? (
                      <EyeOff className="w-4 h-4 text-white" />
                    ) : (
                      <Eye className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {showBalance && formattedDecryptedBalance ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      ${formattedDecryptedBalance}
                    </motion.span>
                  ) : (
                    '$••••••'
                  )}
                </div>
                <p className="text-sm text-white/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Only you can decrypt
                </p>
              </div>
            </div>
          </motion.div>

          {/* Wrap/Unwrap Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <div className="p-8">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1.5 mb-8">
                  <button
                    onClick={() => { setActiveTab('wrap'); setError(''); setSuccess(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-semibold transition-all ${
                      activeTab === 'wrap'
                        ? 'bg-white text-paypal-blue shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                    Wrap to cUSDC
                  </button>
                  <button
                    onClick={() => { setActiveTab('unwrap'); setError(''); setSuccess(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-semibold transition-all ${
                      activeTab === 'unwrap'
                        ? 'bg-white text-paypal-blue shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    Unwrap to USDC
                  </button>
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {activeTab === 'wrap' ? 'Wrap USDC to cUSDC' : 'Unwrap cUSDC to USDC'}
                  </h2>
                  <p className="text-gray-500">
                    {activeTab === 'wrap'
                      ? 'Convert your USDC to confidential cUSDC for private transactions'
                      : 'Convert your confidential cUSDC back to regular USDC'}
                  </p>
                </div>

                {/* Amount Input */}
                <div className="relative mb-8">
                  <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 text-center hover:border-blue-200 transition-colors">
                    <div className="inline-flex items-baseline">
                      <span className="text-4xl font-bold text-gray-400 mr-1">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-6xl font-bold text-gray-900 bg-transparent border-none outline-none text-center w-56 placeholder:text-gray-300"
                      />
                    </div>
                    <p className="text-gray-400 mt-3 font-medium">
                      {activeTab === 'wrap' ? 'USDC' : 'cUSDC'}
                    </p>
                  </div>
                </div>

                {/* Conversion Flow Visual */}
                <div className="flex items-center justify-center gap-4 py-6 mb-8 bg-paypal-navy/10/50 rounded-xl">
                  <div className="text-center px-6">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <WalletIcon className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="font-bold text-gray-900">{activeTab === 'wrap' ? 'USDC' : 'cUSDC'}</p>
                    <p className="text-xs text-gray-500">{activeTab === 'wrap' ? 'Public' : 'Encrypted'}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-[2px] bg-gradient-to-r from-gray-200 to-blue-300" />
                    <div className="w-10 h-10 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-12 h-[2px] bg-gradient-to-r from-blue-300 to-gray-200" />
                  </div>
                  
                  <div className="text-center px-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-gray-900">{activeTab === 'wrap' ? 'cUSDC' : 'USDC'}</p>
                    <p className="text-xs text-gray-500">{activeTab === 'wrap' ? 'Encrypted' : 'Public'}</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-paypal-blue/5 to-blue-50/50 border border-blue-100/50 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-paypal-blue flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">
                      {activeTab === 'wrap'
                        ? 'Wrapping encrypts your balance using FHE. Only you will be able to see your cUSDC amount.'
                        : 'Unwrapping will decrypt your balance. The USDC amount will become publicly visible on-chain.'}
                    </p>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-paypal-navy/10 text-paypal-blue rounded-xl mb-6"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-paypal-navy/10 text-paypal-blue rounded-xl mb-6"
                  >
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">{success}</span>
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-paypal-blue to-blue-600 hover:from-paypal-dark hover:to-blue-700 shadow-lg shadow-blue-500/25"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      {activeTab === 'wrap' ? 'Wrap USDC' : 'Unwrap cUSDC'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
