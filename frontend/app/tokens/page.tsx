"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Wallet,
  Coins,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  AmountInput,
  Badge,
  Divider,
  StatCard,
  TokenRow,
} from "@/components/ui";
import { useConfidentialToken, useMintTestTokens } from "@/hooks/useConfidentialToken";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useCustomTokens } from "@/hooks/useCustomTokens";
import { formatTokenAmount, parseAmount } from "@/lib/utils";
import { CONTRACTS } from "@/lib/contracts";
import { CONFIDENTIAL_TOKENS, type ConfidentialToken } from "@/lib/tokenRegistry";

// Gateway Authorization Card Component (simplified)
function TokenSystemCard({ 
  token, 
  address, 
  showDecryptedBalance 
}: { 
  token: ConfidentialToken; 
  address: `0x${string}` | undefined; 
  showDecryptedBalance: boolean;
}) {
  const {
    isOperatorValid,
    operatorExpiryWarning,
    isPending: tokenPending,
    setGatewayAsOperator,
    refetch: refetchToken,
  } = useConfidentialToken(token);

  const handleSetOperator = async () => {
    await setGatewayAsOperator(3600); // 1 hour
    await refetchToken();
  };

  return (
    <Card className="border-2 border-yellow-200 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          c{token.underlyingSymbol}
          {isOperatorValid ? (
            <Badge variant="success" className="text-[8px]">✓ Authorized</Badge>
          ) : (
            <Badge variant="warning" className="text-[8px]">Not Set</Badge>
          )}
        </CardTitle>
        <CardDescription>{token.name}</CardDescription>
      </CardHeader>
      <CardContent>
        {!isOperatorValid ? (
          <div className="space-y-3">
            <p className="text-sm text-dark-600 dark:text-dark-400">
              Authorize the gateway to process payments. Required for merchant features, refunds, and tracked payments.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              size="sm"
              onClick={handleSetOperator}
              isLoading={tokenPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Authorize Gateway (1 hour)
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                Gateway can process c{token.underlyingSymbol} payments with tracking, refunds, and merchant features.
              </div>
            </div>
            {operatorExpiryWarning && (
              <div className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>Authorization expires soon. Re-authorize to continue using gateway features.</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TokensPage() {
  const { isConnected, address } = useAccount();
  const [activeSection, setActiveSection] = useState<'wrap' | 'transfer'>('wrap');
  const [selectedToken, setSelectedToken] = useState<ConfidentialToken>(CONFIDENTIAL_TOKENS[0]);
  const [wrapAmount, setWrapAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [showAddToken, setShowAddToken] = useState(false);

  const { customTokens, isValidating, addCustomToken, removeCustomToken } = useCustomTokens();
  const allTokens = [...CONFIDENTIAL_TOKENS, ...customTokens];

  // Primary hook for selected token
  const {
    erc20Balance,
    confidentialBalanceHandle,
    decryptedBalance,
    erc20Allowance,
    decimals,
    isPending: tokenPending,
    isDecrypting,
    approveForWrap,
    wrap,
    directTransfer,
    isTransferPending,
    decryptBalance,
    refetch: refetchToken,
  } = useConfidentialToken(selectedToken);

  const { mint: mintTestTokens, isPending: mintPending } = useMintTestTokens(selectedToken);

  // Get data for all tokens (for balances display)
  const usdcToken = useConfidentialToken(CONFIDENTIAL_TOKENS[0]);
  const xusdToken = useConfidentialToken(CONFIDENTIAL_TOKENS[1]);

  const [isDecrypted, setIsDecrypted] = useState(false);

  const handleMint = async () => {
    const mintAmount = parseAmount("10", decimals);
    await mintTestTokens(mintAmount);
    await refetchToken();
  };

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) return;
    
    const amount = parseAmount(wrapAmount, decimals);
    
    if ((erc20Allowance || 0n) < amount) {
      await approveForWrap(amount);
    }
    
    await wrap(amount);
    await refetchToken();
    setWrapAmount("");
  };

  const handleDecrypt = async () => {
    await decryptBalance();
    setIsDecrypted(true);
  };

  const handleDirectTransfer = async () => {
    if (!transferRecipient || !transferAmount) {
      toast.error("Enter recipient and amount");
      return;
    }

    try {
      const amount = parseAmount(transferAmount, decimals);
      await directTransfer(transferRecipient as `0x${string}`, amount);
      setTransferRecipient("");
      setTransferAmount("");
      await refetchToken();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleAddCustomToken = async () => {
    if (!customTokenAddress || !customTokenAddress.startsWith("0x")) {
      toast.error("Invalid address");
      return;
    }
    
    const success = await addCustomToken(customTokenAddress as `0x${string}`);
    if (success) {
      setCustomTokenAddress("");
      setShowAddToken(false);
    }
  };

  const hasConfidentialTokens = confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64));
  const hasERC20Tokens = (erc20Balance || 0n) > 0n;
  const needsApproval = (erc20Allowance || 0n) < parseAmount(wrapAmount, decimals);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center py-16">
            <CardContent>
              <Wallet className="w-16 h-16 mx-auto mb-4 text-pink-500" />
              <h2 className="font-pixel text-lg uppercase tracking-wider mb-2">
                Connect Wallet
              </h2>
              <p className="font-sans text-sm text-dark-500 dark:text-dark-400 mb-6">
                Connect your wallet to manage your tokens
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="font-pixel text-3xl uppercase tracking-wider mb-2">
                <span className="glitch" data-text="My Tokens">
                  My Tokens
                </span>
              </h1>
              <p className="font-sans text-dark-500 dark:text-dark-400">
                Manage your ERC20 and confidential tokens
              </p>
            </div>
            <Link href="/checkout">
              <Button variant="outline" size="sm">
                <ArrowRight className="w-3 h-3 mr-1" />
                Go to Checkout
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Unified Token Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-2 border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl mb-4">Token Management</CardTitle>
              
              {/* All Balances Overview */}
              <div className="grid grid-cols-2 gap-3">
                {/* USDC */}
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">USDC</div>
                  <div className="text-xl font-bold">{formatTokenAmount(usdcToken.erc20Balance || 0n, 6, "")}</div>
                  <div className="text-[10px] text-dark-500 dark:text-dark-400">Public</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <div className="text-xs text-pink-600 dark:text-pink-400 mb-1 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> cUSDC
                  </div>
                  <div className="text-xl font-bold">
                    {usdcToken.decryptedBalance !== null ? formatTokenAmount(usdcToken.decryptedBalance, 6, "") : "🔐"}
                  </div>
                  <div className="text-[10px] text-dark-500 dark:text-dark-400">Private</div>
                </div>

                {/* xUSD */}
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">xUSD</div>
                  <div className="text-xl font-bold">{formatTokenAmount(xusdToken.erc20Balance || 0n, 6, "")}</div>
                  <div className="text-[10px] text-dark-500 dark:text-dark-400">Public</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> cxUSD
                  </div>
                  <div className="text-xl font-bold">
                    {xusdToken.decryptedBalance !== null ? formatTokenAmount(xusdToken.decryptedBalance, 6, "") : "🔐"}
                  </div>
                  <div className="text-[10px] text-dark-500 dark:text-dark-400">Private</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Action Tabs */}
              <div className="flex gap-2 p-1 bg-dark-100 dark:bg-dark-800 rounded-lg">
                <button
                  onClick={() => setActiveSection('wrap')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeSection === 'wrap'
                      ? 'bg-white dark:bg-dark-900 text-pink-600 dark:text-pink-400 shadow-sm'
                      : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-200'
                  }`}
                >
                  🔐 Wrap
                </button>
                <button
                  onClick={() => setActiveSection('transfer')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeSection === 'transfer'
                      ? 'bg-white dark:bg-dark-900 text-pink-600 dark:text-pink-400 shadow-sm'
                      : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-200'
                  }`}
                >
                  📨 Send
                </button>
              </div>

              {/* Wrap Section */}
              {activeSection === 'wrap' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Get Tokens First */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                      1. Get {selectedToken.underlyingSymbol} First
                    </div>
                    {selectedToken.underlyingSymbol === 'USDC' ? (
                      <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" className="w-full" size="sm">
                          Open Circle Faucet <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full"
                        size="sm"
                        onClick={handleMint}
                        isLoading={mintPending}
                        disabled={mintPending}
                      >
                        Mint 10 {selectedToken.underlyingSymbol}
                      </Button>
                    )}
                  </div>

                  {/* Wrap Form */}
                  <div className="p-4 bg-white dark:bg-dark-900 rounded-lg border-2 border-pink-200 dark:border-pink-800">
                    <div className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-3">
                      2. Wrap to Confidential
                    </div>
                    <div className="space-y-3">
                      <select
                        value={CONFIDENTIAL_TOKENS.findIndex(t => t.wrapperAddress === selectedToken.wrapperAddress)}
                        onChange={(e) => setSelectedToken(CONFIDENTIAL_TOKENS[parseInt(e.target.value)])}
                        className="w-full px-3 py-2 text-sm border-2 border-pink-300 dark:border-pink-700 rounded-lg bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer font-medium"
                      >
                        {CONFIDENTIAL_TOKENS.map((t, index) => (
                          <option key={t.wrapperAddress} value={index}>
                            {t.underlyingSymbol} → c{t.underlyingSymbol}
                          </option>
                        ))}
                      </select>

                      {!hasERC20Tokens ? (
                        <div className="text-sm text-dark-500 dark:text-dark-400 text-center py-4">
                          Get {selectedToken.underlyingSymbol} tokens first ↑
                        </div>
                      ) : (
                        <>
                          <AmountInput
                            label=""
                            value={wrapAmount}
                            onChange={setWrapAmount}
                            currency={selectedToken.underlyingSymbol}
                            placeholder="0.00"
                          />
                          <Button
                            variant="primary"
                            className="w-full"
                            size="sm"
                            onClick={handleWrap}
                            isLoading={tokenPending}
                            disabled={(erc20Balance || 0n) < parseAmount(wrapAmount, decimals) || !wrapAmount || parseFloat(wrapAmount) <= 0}
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            {needsApproval ? `Approve & Wrap to c${selectedToken.underlyingSymbol}` : `Wrap to c${selectedToken.underlyingSymbol}`}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Section */}
              {activeSection === 'transfer' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-4 bg-white dark:bg-dark-900 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-dark-700 dark:text-dark-300">Direct Transfer</div>
                      <Badge variant="secondary" className="text-[8px]">P2P • No Gateway</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-dark-600 dark:text-dark-400 mb-1.5 block">
                          Token
                        </label>
                        <select
                          value={CONFIDENTIAL_TOKENS.findIndex(t => t.wrapperAddress === selectedToken.wrapperAddress)}
                          onChange={(e) => setSelectedToken(CONFIDENTIAL_TOKENS[parseInt(e.target.value)])}
                          className="w-full px-3 py-2 text-sm border-2 border-cyan-300 dark:border-cyan-700 rounded-lg bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer font-medium"
                        >
                          {CONFIDENTIAL_TOKENS.map((t, index) => (
                            <option key={t.wrapperAddress} value={index}>
                              c{t.underlyingSymbol}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-dark-600 dark:text-dark-400 mb-1.5 block">
                          Recipient
                        </label>
                        <input
                          type="text"
                          value={transferRecipient}
                          onChange={(e) => setTransferRecipient(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2.5 text-sm border-2 border-cyan-300 dark:border-cyan-700 rounded-lg bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-dark-600 dark:text-dark-400 mb-1.5 block">
                          Amount
                        </label>
                        <AmountInput
                          label=""
                          value={transferAmount}
                          onChange={setTransferAmount}
                          currency={`c${selectedToken.underlyingSymbol}`}
                          placeholder="0.00"
                        />
                      </div>

                      {!decryptedBalance && hasConfidentialTokens && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Decrypt your balance first using the "Decrypt All" button below to verify sufficient funds.
                          </p>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        className="w-full"
                        size="sm"
                        onClick={handleDirectTransfer}
                        isLoading={isTransferPending}
                        disabled={
                          isTransferPending || 
                          !transferRecipient || 
                          !transferAmount || 
                          parseFloat(transferAmount) <= 0 ||
                          !decryptedBalance ||
                          decryptedBalance < parseAmount(transferAmount, decimals)
                        }
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Send c{selectedToken.underlyingSymbol}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    refetchToken();
                    usdcToken.refetch();
                    xusdToken.refetch();
                  }}
                  className="flex-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDecrypt}
                  isLoading={isDecrypting}
                  disabled={!hasConfidentialTokens || isDecrypting}
                  className="flex-1 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {isDecrypting ? "Decrypting..." : "Decrypt All"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gateway Authorization Cards (Separate) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-pixel text-lg uppercase mb-4 text-center">Gateway Authorization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONFIDENTIAL_TOKENS.map((token) => (
              <TokenSystemCard
                key={token.wrapperAddress}
                token={token}
                address={address}
                showDecryptedBalance={false}
              />
            ))}
          </div>
        </motion.div>

        {/* Token List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-pink-500" />
                Your Tokens
              </CardTitle>
              <CardDescription>
                ERC20 and ERC7984 confidential tokens in your wallet
                {customTokens.length > 0 && ` (${customTokens.length} custom)`}
              </CardDescription>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddToken(!showAddToken)}
                  className="w-full sm:w-auto"
                >
                  {showAddToken ? "Cancel" : "+ Add Custom Token"}
                </Button>
              </div>
              
              {/* Add custom token form */}
              {showAddToken && (
                <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-900/10 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="text-sm text-dark-600 dark:text-dark-300 mb-3">
                    Enter ERC7984 wrapper contract address. We'll validate it's legitimate.
                  </p>
                  <div className="flex gap-2">
                    <AmountInput
                      label=""
                      value={customTokenAddress}
                      onChange={setCustomTokenAddress}
                      placeholder="0x..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddCustomToken}
                      disabled={isValidating || !customTokenAddress}
                      isLoading={isValidating}
                      size="sm"
                    >
                      {isValidating ? "Validating..." : "Add"}
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-dark-200 dark:divide-dark-700">
                {/* Show all tokens (registry + custom) */}
                {allTokens.map((token) => (
                  <TokenRow
                    key={token.wrapperAddress}
                    token={token}
                    address={address}
                    showDecryptedBalance={false}
                  />
                ))}
                
                {allTokens.length === 0 && (
                  <div className="p-8 text-center text-dark-400">
                    <p>No tokens found. Add a custom ERC7984 token above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
