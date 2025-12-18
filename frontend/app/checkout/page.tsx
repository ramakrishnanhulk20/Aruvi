"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  HelpCircle,
  Info,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  AmountInput,
  Steps,
  Badge,
  Divider,
  PaymentTypeSelector,
  PaymentType,
  PaymentTypeBadge,
  ProductSelector,
  type Product,
} from "@/components/ui";
import { useConfidentialToken, useMintTestTokens } from "@/hooks/useConfidentialToken";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { formatTokenAmount, formatAddress, parseAmount } from "@/lib/utils";
import { CONTRACTS } from "@/lib/contracts";
import { trackEvent } from "@/lib/monitoring";
import { CONFIDENTIAL_TOKENS, getDefaultToken, type ConfidentialToken } from "@/lib/tokenRegistry";

const checkoutSteps = [
  { label: "Connect", description: "Connect your wallet" },
  { label: "Select", description: "Choose payment type" },
  { label: "Prepare", description: "Get confidential tokens" },
  { label: "Pay", description: "Make payment" },
  { label: "Done", description: "Payment complete" },
];

export default function CheckoutPage() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [amount, setAmount] = useState(""); // Amount should come from merchant (URL params or widget config in production)
  const [merchantAddress, setMerchantAddress] = useState<`0x${string}`>(
    "0x0000000000000000000000000000000000000000" as `0x${string}` // Will be set to connected address
  );
  const [orderId, setOrderId] = useState<string>("");
  const [returnUrl, setReturnUrl] = useState<string>("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");
  const [productIdFromUrl, setProductIdFromUrl] = useState<bigint | null>(null);
  const [productInfo, setProductInfo] = useState<{
    name: string;
    amount: number;
    trustless: boolean;
  } | null>(null);
  
  // Payment type and product selection state
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.P2P);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [donationCause, setDonationCause] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<ConfidentialToken>(getDefaultToken());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Load payment session (privacy-first: no amount in URL!)
  useEffect(() => {
    const loadSession = async () => {
      if (!searchParams) return;
      
      const urlSessionId = searchParams.get("session");
      if (!urlSessionId) return;
      
      setLoadingSession(true);
      setSessionId(urlSessionId);
      
      try {
        const response = await fetch(`/api/payment/session?sessionId=${urlSessionId}`);
        if (!response.ok) {
          throw new Error('Session not found or expired');
        }
        
        const session = await response.json();
        
        // Load session data with trustless blockchain verification
        if (session.merchantAddress) {
          setMerchantAddress(session.merchantAddress as `0x${string}`);
        }
        if (session.orderId) {
          setOrderId(session.orderId);
        }
        
        // Load product info (blockchain-verified or legacy)
        if (session.productName && session.amount) {
          setProductInfo({
            name: session.productName,
            amount: session.amount,
            trustless: session.metadata?.trustless || false
          });
          setAmount(String(session.amount / 1e6)); // Convert from token decimals to display
          setPaymentType(PaymentType.PRODUCT);
        }
        
        if (session.productId !== undefined && session.productId !== null) {
          setProductIdFromUrl(BigInt(session.productId));
        }
        
        if (session.type) {
          const typeMap: Record<string, PaymentType> = {
            'product': PaymentType.PRODUCT,
            'donation': PaymentType.DONATION,
            'subscription': PaymentType.SUBSCRIPTION,
            'p2p': PaymentType.P2P
          };
          if (typeMap[session.type]) {
            setPaymentType(typeMap[session.type]);
          }
        }
        
        // Get return URL from query params (separate from session)
        const urlReturnUrl = searchParams.get("returnUrl");
        if (urlReturnUrl) {
          setReturnUrl(decodeURIComponent(urlReturnUrl));
        }
        
        const trustlessFlag = session.metadata?.trustless ? ' (Blockchain-verified ✓)' : '';
        toast.success(`Session loaded${trustlessFlag}`);
        
        // Auto-advance to payment step when session has all required data
        if (session.amount && session.merchantAddress) {
          setCurrentStep(isConnected ? 3 : 0); // Skip to prepare step if connected, else connect wallet first
        } else {
          setCurrentStep(1); // Go to select step if session is incomplete
        }
      } catch (error: any) {
        console.error('Session load error:', error);
        toast.error('Session expired or invalid');
      } finally {
        setLoadingSession(false);
      }
    };
    
    loadSession();
  }, [searchParams]);

  // Auto-advance to payment step when wallet connects (for session-based flow)
  useEffect(() => {
    if (isConnected && sessionId && productInfo && currentStep < 3) {
      setCurrentStep(3); // Jump to prepare/pay step
    }
  }, [isConnected, sessionId, productInfo, currentStep]);

  // Legacy: Load payment params from URL (merchant integration)
  useEffect(() => {
    if (searchParams && !sessionId) {
      const urlAmount = searchParams.get("amount");
      const urlMerchant = searchParams.get("merchant");
      const urlOrderId = searchParams.get("orderId");
      const urlReturnUrl = searchParams.get("returnUrl");
      const urlType = searchParams.get("type");
      const urlProductName = searchParams.get("productName");
      const urlProductId = searchParams.get("productId");
      const urlCause = searchParams.get("cause");
      
      if (urlAmount) setAmount(urlAmount);
      if (urlMerchant && urlMerchant.startsWith("0x")) {
        setMerchantAddress(urlMerchant as `0x${string}`);
      }
      if (urlOrderId) setOrderId(urlOrderId);
      if (urlReturnUrl) setReturnUrl(decodeURIComponent(urlReturnUrl));
      if (urlProductId) setProductIdFromUrl(BigInt(urlProductId));
      
      // Auto-detect and lock payment type from merchant
      if (urlType) {
        if (urlType === 'product') {
          setPaymentType(PaymentType.PRODUCT);
        } else if (urlType === 'donation') {
          setPaymentType(PaymentType.DONATION);
          if (urlCause) setDonationCause(decodeURIComponent(urlCause));
        } else if (urlType === 'subscription') {
          setPaymentType(PaymentType.SUBSCRIPTION);
        } else if (urlType === 'p2p') {
          setPaymentType(PaymentType.P2P);
        }
        
        // Auto-advance to step 1 if coming from merchant
        if (urlAmount && urlMerchant) {
          setCurrentStep(1);
        }
      }
    }
  }, [searchParams]);

  // Set merchant address to connected address by default (for demo/testing)
  useEffect(() => {
    if (address && merchantAddress === "0x0000000000000000000000000000000000000000") {
      setMerchantAddress(address);
      trackEvent("Wallet Connected", { address, page: "checkout" });
    }
  }, [address, merchantAddress]);

  // Hooks
  const {
    confidentialBalanceHandle,
    decryptedBalance,
    isOperatorValid,
    operatorExpiryWarning,
    decimals,
    isPending: tokenPending,
    isDecrypting,
    decryptBalance,
    refetch: refetchToken,
  } = useConfidentialToken(selectedToken);

  const {
    processPayment,
    isPaying,
    isMerchant,
    fhevmReady,
  } = usePaymentGateway(selectedToken);

  // Update step based on state (but allow manual override)
  useEffect(() => {
    // Only auto-progress backward, not forward
    if (!isConnected && currentStep > 0) {
      setCurrentStep(0);
    } else if (paymentComplete && currentStep < 4) {
      setCurrentStep(4);
    }
    // Don't auto-progress to step 2 - let user click Next
  }, [isConnected, paymentComplete, currentStep, isOperatorValid, confidentialBalanceHandle]);

  // Handle product selection - auto-populate amount
  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      // Convert from wei to display units (6 decimals)
      setAmount(formatTokenAmount(product.publicPrice, 6, ""));
    } else {
      setAmount("");
    }
  };

  // Handle payment type change
  const handlePaymentTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    // Reset product and amount when changing type
    setSelectedProduct(null);
    setAmount("");
    setDonationAmount("");
  };

  // Get effective amount based on payment type
  const getEffectiveAmount = () => {
    if (paymentType === PaymentType.DONATION) {
      return donationAmount || amount;
    }
    if (selectedProduct) {
      return formatTokenAmount(selectedProduct.publicPrice, 6, "");
    }
    return amount;
  };

  // Decrypt balance when available
  const handleDecryptBalance = async () => {
    await decryptBalance();
  };

  // Handle payment
  const handlePayment = async () => {
    // Validate amount is provided
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const paymentAmount = parseAmount(amount, decimals);
    
    // Validate against decrypted balance if available
    if (decryptedBalance !== null && paymentAmount > decryptedBalance) {
      toast.error(`Insufficient balance. You have ${formatTokenAmount(decryptedBalance, decimals, "cUSDC")} but trying to pay ${formatTokenAmount(paymentAmount, decimals, "cUSDC")}`);
      return;
    }

    // Warn if balance not decrypted
    if (decryptedBalance === null) {
      toast.error("Please decrypt your cUSDC balance first to verify you have enough funds");
      return;
    }

    // Check merchant registration only for Product and Subscription payments
    const requiresMerchantRegistration = 
      paymentType === PaymentType.PRODUCT || 
      paymentType === PaymentType.SUBSCRIPTION;
    
    if (requiresMerchantRegistration && merchantAddress !== address && !isMerchant) {
      toast.error("Merchant must be registered for Product and Subscription payments.");
      return;
    }

    const toastId = toast.loading("Processing payment...");
    const txHash = await processPayment(
      merchantAddress,
      selectedToken.wrapperAddress as `0x${string}`, // Use selected token's wrapper
      paymentAmount,
      orderId
    );
    
    if (txHash && publicClient) {
      try {
        toast.loading("Waiting for confirmation...", { id: toastId });
        // Wait for transaction to be mined
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: txHash,
          confirmations: 1,
        });
        
        if (receipt.status === 'success') {
          toast.success("Payment confirmed on blockchain! 🎉", { id: toastId });
          setPaymentTxHash(txHash);
          
          // Extract paymentId from logs - use selected token's gateway address
          const selectedGateway = CONTRACTS.GATEWAY; // Already uses USDC by default
          const paymentProcessedLog = receipt.logs.find(log => 
            log.address.toLowerCase() === selectedGateway.toLowerCase()
          );
          
          if (paymentProcessedLog && paymentProcessedLog.topics[1]) {
            setPaymentId(paymentProcessedLog.topics[1]);
          }
          
          setPaymentComplete(true);
          // Refresh balance after payment
          await refetchToken();
          
          // Redirect back to merchant if returnUrl provided
          if (returnUrl) {
            setTimeout(() => {
              const url = new URL(returnUrl);
              url.searchParams.set('status', 'success');
              url.searchParams.set('paymentId', paymentProcessedLog?.topics[1] || '');
              url.searchParams.set('txHash', txHash);
              if (orderId) url.searchParams.set('orderId', orderId);
              window.location.href = url.toString();
            }, 2000);
          }
        } else {
          toast.error("Transaction failed", { id: toastId });
        }
      } catch (err) {
        console.error("[Checkout] Receipt error:", err);
        toast.error("Transaction confirmation failed", { id: toastId });
      }
    } else if (!txHash) {
      toast.dismiss(toastId);
    }
  };

  // Reset for new payment
  const handleReset = () => {
    setPaymentComplete(false);
    setPaymentTxHash("");
    setAmount("");
    setCurrentStep(0);
    refetchToken();
    trackEvent("Payment Reset", { page: "checkout" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 text-center">
              <h1 className="font-pixel text-2xl md:text-3xl uppercase tracking-wider mb-2">
                <span className="glitch" data-text="Checkout">
                  Checkout
                </span>
              </h1>
              <p className="font-sans text-dark-500 dark:text-dark-400">
                Pay with confidential tokens
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/tokens">
                <Button variant="secondary" size="sm">
                  <Wallet className="w-3 h-3 mr-1" />
                  My Tokens
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  Merchant
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <Steps steps={checkoutSteps} currentStep={currentStep} />
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-pink-50 dark:bg-dark-800">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-500" />
              Private Payment
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Connect Wallet */}
              {currentStep === 0 && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-pink-500" />
                  <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="font-sans text-sm text-dark-500 dark:text-dark-400 mb-6">
                    Connect your wallet to start making private payments
                  </p>
                  <div className="space-y-4">
                    <ConnectButton />
                    {isConnected && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full max-w-xs mx-auto"
                          onClick={() => setCurrentStep(1)}
                          glitch
                        >
                          Next: Select Payment Type
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Select Payment Type & Product */}
              {currentStep === 1 && isConnected && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                    <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
                      Select Payment Type
                    </h3>
                    <p className="font-sans text-sm text-dark-500 dark:text-dark-400">
                      Choose how you want to pay
                    </p>
                  </div>

                  {/* Payment Type Selector */}
                  <PaymentTypeSelector
                    value={paymentType}
                    onChange={handlePaymentTypeChange}
                  />

                  {/* Token System Selector */}
                  <div className="space-y-3 pt-4">
                    <Divider label="Select Token" />
                    <div className="grid grid-cols-2 gap-3">
                      {CONFIDENTIAL_TOKENS.map((token) => (
                        <button
                          key={token.wrapperAddress}
                          onClick={() => setSelectedToken(token)}
                          className={`p-4 border-2 transition-all ${
                            selectedToken.wrapperAddress === token.wrapperAddress
                              ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                              : "border-dark-200 dark:border-dark-700 hover:border-pink-300"
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-pixel text-xs uppercase mb-1">
                              {token.underlyingSymbol}
                            </div>
                            <div className="text-xs text-dark-500 dark:text-dark-400">
                              {token.name}
                            </div>
                            {token.isDefault && (
                              <Badge variant="success" className="text-[8px] mt-2">Default</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Merchant Address (for P2P) */}
                  {paymentType === PaymentType.P2P && (
                    <div className="space-y-3 pt-4">
                      <Divider label="Recipient" />
                      <div>
                        <label className="block font-pixel text-[10px] uppercase tracking-wider text-dark-500 mb-2">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          value={merchantAddress}
                          onChange={(e) => setMerchantAddress(e.target.value as `0x${string}`)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-dark-800 font-mono text-sm"
                        />
                      </div>
                      <AmountInput
                        label="Amount"
                        value={amount}
                        onChange={setAmount}
                        currency={`c${selectedToken.underlyingSymbol}`}
                      />
                    </div>
                  )}

                  {/* Product Selector (for Product & Subscription) */}
                  {(paymentType === PaymentType.PRODUCT || paymentType === PaymentType.SUBSCRIPTION) && (
                    <div className="space-y-3 pt-4">
                      <Divider label="Select Product" />
                      <div>
                        <label className="block font-pixel text-[10px] uppercase tracking-wider text-dark-500 mb-2">
                          Merchant Address
                        </label>
                        <input
                          type="text"
                          value={merchantAddress}
                          onChange={(e) => {
                            setMerchantAddress(e.target.value as `0x${string}`);
                            setSelectedProduct(null);
                          }}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-dark-800 font-mono text-sm"
                        />
                      </div>
                      {merchantAddress && merchantAddress !== "0x0000000000000000000000000000000000000000" && (
                        <ProductSelector
                          merchantAddress={merchantAddress}
                          productType={paymentType === PaymentType.SUBSCRIPTION ? PaymentType.SUBSCRIPTION : PaymentType.PRODUCT}
                          selectedProductId={selectedProduct?.id ?? null}
                          onSelect={handleProductSelect}
                        />
                      )}
                    </div>
                  )}

                  {/* Donation Amount (for Donation) */}
                  {paymentType === PaymentType.DONATION && (
                    <div className="space-y-3 pt-4">
                      <Divider label="Donation Details" />
                      
                      {/* Show donation cause if pre-filled */}
                      {donationCause && (
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500">
                          <p className="text-xs font-pixel uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-1">
                            Supporting
                          </p>
                          <p className="font-semibold text-dark-900 dark:text-dark-100">
                            {donationCause}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block font-pixel text-[10px] uppercase tracking-wider text-dark-500 mb-2">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          value={merchantAddress}
                          onChange={(e) => setMerchantAddress(e.target.value as `0x${string}`)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-dark-800 font-mono text-sm"
                          readOnly={!!searchParams?.get('merchant')}
                        />
                      </div>
                      
                      {/* Suggested amounts */}
                      <div>
                        <label className="block font-pixel text-[10px] uppercase tracking-wider text-dark-500 mb-2">
                          Choose Amount
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {["5", "10", "25", "50"].map((suggestedAmount) => (
                            <button
                              key={suggestedAmount}
                              type="button"
                              onClick={() => setAmount(suggestedAmount)}
                              className={`py-2 border-2 font-mono text-sm transition-all ${
                                amount === suggestedAmount
                                  ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300"
                                  : "border-dark-200 dark:border-dark-700 hover:border-pink-300"
                              }`}
                            >
                              ${suggestedAmount}
                            </button>
                          ))}
                        </div>
                        <AmountInput
                          label="Custom Amount"
                          value={amount}
                          onChange={setAmount}
                          currency={`c${selectedToken.underlyingSymbol}`}
                        />
                      </div>

                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="text-xs text-green-600 dark:text-green-400">
                          <p className="font-semibold">Donations are private</p>
                          <p>Your donation amount is encrypted. The recipient only sees that they received a donation.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => setCurrentStep(2)}
                      disabled={
                        !merchantAddress ||
                        merchantAddress === "0x0000000000000000000000000000000000000000" ||
                        ((paymentType === PaymentType.PRODUCT || paymentType === PaymentType.SUBSCRIPTION) && !selectedProduct) ||
                        ((paymentType === PaymentType.P2P || paymentType === PaymentType.DONATION) && (!amount || parseFloat(amount) <= 0))
                      }
                      glitch
                    >
                      Next: Prepare Tokens
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Check Token Readiness */}
              {currentStep === 2 && isConnected && (
                <motion.div
                  key="prepare"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                    <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
                      Token Readiness Check
                    </h3>
                    <p className="font-sans text-sm text-dark-500 dark:text-dark-400">
                      Ensure you have confidential tokens and authorization
                    </p>
                  </div>

                  {/* Readiness Checklist */}
                  <div className="space-y-3">
                    {/* Check 1: Has Confidential Tokens */}
                    <div className={`p-4 border-2 ${
                      confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64))
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        {confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64)) ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-pixel text-[10px] uppercase tracking-wider">
                              Confidential Tokens (c{selectedToken.underlyingSymbol})
                            </h4>
                            {confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64)) ? (
                              <Badge variant="success" className="text-[8px]">Ready</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[8px]">Required</Badge>
                            )}
                          </div>
                          {confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64)) ? (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              You have confidential tokens ready for payment
                            </p>
                          ) : (
                            <div>
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                                You need confidential tokens to make payments
                              </p>
                              <Link href="/tokens">
                                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                                  Get Tokens →
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Check 2: Gateway Authorization */}
                    <div className={`p-4 border-2 ${
                      isOperatorValid
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        {isOperatorValid ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-pixel text-[10px] uppercase tracking-wider">
                              Gateway Authorization
                            </h4>
                            {isOperatorValid ? (
                              <Badge variant="success" className="text-[8px]">Active</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[8px]">Required</Badge>
                            )}
                          </div>
                          {isOperatorValid ? (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Payment gateway is authorized to process payments
                            </p>
                          ) : (
                            <div>
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                                Authorize the gateway to process your confidential payments
                              </p>
                              <Link href="/tokens">
                                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                                  Authorize Gateway →
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expiry Warning */}
                    {operatorExpiryWarning && isOperatorValid && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          <p className="font-semibold">Authorization expiring soon</p>
                          <p>Re-authorize on the tokens page to continue making payments.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Continue Button */}
                  {isOperatorValid && confidentialBalanceHandle && confidentialBalanceHandle !== ('0x' + '0'.repeat(64)) ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 text-center">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="font-pixel text-[10px] uppercase tracking-wider text-green-700 dark:text-green-300">
                          Ready to Pay!
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => setCurrentStep(3)}
                        glitch
                      >
                        Continue to Payment
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="p-4 bg-dark-50 dark:bg-dark-900 border-2 border-dark-200 dark:border-dark-700 text-center">
                      <Info className="w-8 h-8 mx-auto mb-2 text-dark-400" />
                      <p className="font-sans text-sm text-dark-500 dark:text-dark-400 mb-3">
                        Complete the requirements above to continue
                      </p>
                      <Link href="/tokens">
                        <Button variant="primary" size="lg" className="w-full">
                          Go to Token Management
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Make Payment */}
              {currentStep === 3 && isConnected && (
                <motion.div
                  key="pay"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                    <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
                      Confirm Payment
                    </h3>
                    <p className="font-sans text-sm text-dark-500 dark:text-dark-400">
                      Your payment amount will be encrypted
                    </p>
                  </div>

                  {/* cUSDC Balance Display & Decryption */}
                  <div className="p-4 bg-dark-50 dark:bg-dark-900 border-2 border-black dark:border-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-pixel text-[10px] uppercase tracking-wider text-dark-500">
                        Your cUSDC Balance
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-sm">Available Balance</span>
                      <div className="flex items-center gap-2">
                        {decryptedBalance !== null ? (
                          <span className="font-mono text-sm font-bold">
                            {formatTokenAmount(decryptedBalance, decimals, "cUSDC")}
                          </span>
                        ) : (
                          <button
                            onClick={handleDecryptBalance}
                            disabled={isDecrypting || !fhevmReady}
                            className="text-pink-500 font-mono text-xs hover:underline disabled:opacity-50 flex items-center gap-1"
                          >
                            {isDecrypting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Decrypting...
                              </>
                            ) : (
                              <>
                                🔐 Decrypt Balance
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-4 bg-dark-50 dark:bg-dark-900 border-2 border-black dark:border-white space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-sm text-dark-500">
                          {paymentType === PaymentType.DONATION ? "Donation To" : 
                           paymentType === PaymentType.P2P ? "Send To" : "Merchant"}
                        </span>
                        {merchantAddress !== address && merchantAddress !== '0x0000000000000000000000000000000000000000' && (
                          <Badge variant={isMerchant ? "success" : "danger"} className="text-[8px]">
                            {isMerchant ? "REGISTERED" : "NOT REGISTERED"}
                          </Badge>
                        )}
                      </div>
                      <div className="px-3 py-2 border-2 border-dark-200 dark:border-dark-700 bg-dark-100 dark:bg-dark-900 font-mono text-xs">
                        {formatAddress(merchantAddress, 8)}
                      </div>
                      {merchantAddress !== address && merchantAddress !== '0x0000000000000000000000000000000000000000' && !isMerchant && (
                        <div className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-500">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Merchant not registered</p>
                            <p className="text-[10px]">This address is not registered as a merchant. Payment will fail.</p>
                          </div>
                        </div>
                      )}
                      {merchantAddress === address && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Testing mode</p>
                            <p className="text-[10px]">Paying yourself. Register as merchant in dashboard first, or change merchant address</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show selected product or session product info */}
                    {(selectedProduct || productInfo) && (paymentType === PaymentType.PRODUCT || paymentType === PaymentType.SUBSCRIPTION) && (
                      <>
                        <Divider />
                        <div className="flex justify-between items-center">
                          <span className="font-sans text-sm text-dark-500">Product</span>
                          <div className="flex gap-2 items-center">
                            {productInfo?.trustless && (
                              <Badge variant="success" className="text-[8px]">
                                BLOCKCHAIN VERIFIED ✓
                              </Badge>
                            )}
                            <PaymentTypeBadge type={paymentType} />
                          </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-pixel text-[10px] uppercase tracking-wider">
                              {productInfo?.name || selectedProduct?.name}
                            </h4>
                          </div>
                          {selectedProduct?.description && (
                            <p className="text-xs text-dark-500 dark:text-dark-400 mb-2">
                              {selectedProduct.description}
                            </p>
                          )}
                          {productInfo?.trustless && (
                            <div className="text-xs text-green-600 dark:text-green-400 flex items-start gap-2 mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-500">
                              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold">Trustless Pricing</p>
                                <p className="text-[10px]">Price fetched from ProductRegistry contract. Merchant cannot manipulate.</p>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-dark-200 dark:border-dark-700">
                            <span className="font-sans text-sm text-dark-500">Price</span>
                            <span className="font-mono text-sm font-bold">
                              {productInfo ? 
                                formatTokenAmount(productInfo.amount, 6, "cUSDC") :
                                formatTokenAmount(selectedProduct?.publicPrice || 0, 6, "cUSDC")
                              }
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Show payment type badge for P2P and Donation */}
                    {(paymentType === PaymentType.P2P || paymentType === PaymentType.DONATION) && (
                      <>
                        <Divider />
                        <div className="flex justify-between items-center">
                          <span className="font-sans text-sm text-dark-500">Payment Type</span>
                          <PaymentTypeBadge type={paymentType} />
                        </div>
                      </>
                    )}

                    <Divider />
                    <div className="flex justify-between">
                      <span className="font-sans text-sm text-dark-500">Privacy</span>
                      <Badge variant="success">🔐 Encrypted</Badge>
                    </div>
                  </div>

                  {/* FHEVM Status */}
                  {!fhevmReady && (
                    <div className="p-3 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
                      <span className="font-mono text-xs text-accent-700 dark:text-accent-300">
                        Initializing encryption...
                      </span>
                    </div>
                  )}

                  {/* Amount Input - Conditional based on payment type */}
                  {(paymentType === PaymentType.P2P || paymentType === PaymentType.DONATION) ? (
                    <AmountInput
                      label="Payment Amount"
                      value={amount}
                      onChange={setAmount}
                      currency="cUSDC"
                    />
                  ) : (
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500">
                      <div className="flex justify-between items-center">
                        <span className="font-pixel text-[10px] uppercase tracking-wider text-pink-700 dark:text-pink-300">
                          Total Amount
                        </span>
                        <span className="font-mono text-xl font-bold text-pink-700 dark:text-pink-300">
                          {formatTokenAmount(parseAmount(getEffectiveAmount(), decimals), decimals, "cUSDC")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Balance Check Warning */}
                  {decryptedBalance === null ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        <p className="font-semibold">Balance not verified</p>
                        <p>Decrypt your cUSDC balance above to verify you have sufficient funds</p>
                      </div>
                    </div>
                  ) : parseAmount(amount, decimals) > decryptedBalance ? (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="text-xs text-red-600 dark:text-red-400">
                        <p className="font-semibold">Insufficient balance</p>
                        <p>You have {formatTokenAmount(decryptedBalance, decimals, "cUSDC")} but trying to pay {formatTokenAmount(parseAmount(amount, decimals), decimals, "cUSDC")}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Pay Button */}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                      onClick={() => setCurrentStep(2)}
                      disabled={isPaying}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={handlePayment}
                      isLoading={isPaying}
                      disabled={!fhevmReady}
                      glitch
                    >
                      {isPaying ? (
                        "Processing..."
                      ) : (
                        <>
                          Pay {amount} cUSDC
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center font-mono text-[10px] text-dark-500">
                    Amount encrypted with FHE before submission
                  </p>
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 4 && paymentComplete && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-500" />
                  </motion.div>
                  
                  <h3 className="font-pixel text-lg uppercase tracking-wider mb-2 text-green-600 dark:text-green-400">
                    Payment Complete!
                  </h3>
                  <p className="font-sans text-sm text-dark-500 dark:text-dark-400 mb-6">
                    Your confidential payment has been processed
                  </p>

                  {paymentTxHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${paymentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mb-6 font-mono text-xs text-pink-500 hover:underline"
                    >
                      View on Etherscan →
                    </a>
                  )}

                  {returnUrl && !window.location.href.includes('returnUrl') && (
                    <div className="mb-4 p-3 bg-accent-50 dark:bg-accent-900/20 border border-accent-500 rounded">
                      <p className="font-sans text-xs text-accent-700 dark:text-accent-300 mb-2">
                        Redirecting you back to merchant...
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {returnUrl && (
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          const url = new URL(returnUrl);
                          url.searchParams.set('status', 'success');
                          url.searchParams.set('paymentId', paymentId);
                          url.searchParams.set('txHash', paymentTxHash);
                          if (orderId) url.searchParams.set('orderId', orderId);
                          window.location.href = url.toString();
                        }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Return to Merchant
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleReset}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Make Another Payment
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500"
        >
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-accent-600" />
            <div>
              <h4 className="font-pixel text-[10px] uppercase tracking-wider text-accent-700 dark:text-accent-300 mb-1">
                How Privacy Works
              </h4>
              <p className="font-sans text-xs text-accent-600 dark:text-accent-400">
                Your payment amount is encrypted client-side using FHE (Fully
                Homomorphic Encryption) before being sent to the blockchain. The
                merchant receives the payment, but the amount stays encrypted
                on-chain.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
