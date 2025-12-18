"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useReadContract, useSignTypedData } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { parseAbiItem } from "viem";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Clock,
  Shield,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  Home,
  Package,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  StatCard,
  Badge,
  Divider,
  EmptyState,
  Skeleton,
  Input,
  ConfirmModal,
} from "@/components/ui";
import { usePaymentGateway, useMerchantOperations } from "@/hooks/usePaymentGateway";
import { useRefundManager } from "@/hooks/useRefundManager";
import { useFhevmDecrypt } from "@/hooks/useFhevm";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentEvents } from "@/hooks/usePaymentEvents";
import { formatTokenAmount, formatAddress, formatDate, getMonthBucket } from "@/lib/utils";
import { CONTRACTS, GATEWAY_ABI } from "@/lib/contracts";
import { CONFIDENTIAL_TOKENS, getDefaultToken, type ConfidentialToken } from "@/lib/tokenRegistry";
import Link from "next/link";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();
  const { logout } = useAuth();
  const [showTotals, setShowTotals] = useState(false);
  const [decryptedTotal, setDecryptedTotal] = useState<bigint | null>(null);
  const [decryptedRefundTotal, setDecryptedRefundTotal] = useState<bigint | null>(null);
  const [decryptedMonthly, setDecryptedMonthly] = useState<bigint | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [refundCustomer, setRefundCustomer] = useState("");
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [showRefundPublicWarning, setShowRefundPublicWarning] = useState(false);
  const [selectedToken, setSelectedToken] = useState<ConfidentialToken>(getDefaultToken());

  // Hooks
  const { isMerchant, merchantTotalHandle, merchantRefundTotalHandle, refetchMerchant, fhevmReady } = usePaymentGateway(selectedToken);
  const { payments: paymentEvents, isLoading: paymentsLoading, refetch: refetchPayments } = usePaymentEvents(address);
  const { makeTotalPublic, makeRefundTotalPublic, isPending: merchantOpPending } = useMerchantOperations();
  const { queueRefund, processRefund, isProcessing: refundProcessing } = useRefundManager();
  const { decryptHandle, isDecrypting } = useFhevmDecrypt();

  // Get monthly total handle
  const currentBucket = getMonthBucket();
  const GATEWAY_ADDRESS = CONTRACTS.GATEWAY as `0x${string}`; // Use selected token's gateway
  const { data: monthlyTotalHandle } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchantMonthlyTotals(address, uint256) view returns (bytes32)")],
    functionName: "merchantMonthlyTotals",
    args: address ? [address, BigInt(currentBucket)] : undefined,
    query: { enabled: !!address && isMerchant },
  });

  // Wrapper for signTypedDataAsync to match expected type
  const signTypedData = async (typedData: any) => {
    return signTypedDataAsync(typedData);
  };

  // Decrypt totals
  const handleDecryptTotals = async () => {
    if (!fhevmReady) return;

    if (merchantTotalHandle) {
      const total = await decryptHandle(
        merchantTotalHandle,
        GATEWAY_ADDRESS,
        signTypedData
      );
      if (total !== null) setDecryptedTotal(total);
    }

    if (merchantRefundTotalHandle && merchantRefundTotalHandle !== "0x" + "0".repeat(64)) {
      const refundTotal = await decryptHandle(
        merchantRefundTotalHandle,
        GATEWAY_ADDRESS,
        signTypedData
      );
      if (refundTotal !== null) setDecryptedRefundTotal(refundTotal);
    }

    if (monthlyTotalHandle) {
      const monthly = await decryptHandle(
        monthlyTotalHandle as string,
        GATEWAY_ADDRESS,
        signTypedData
      );
      if (monthly !== null) setDecryptedMonthly(monthly);
    }

    setShowTotals(true);
  };

  // Handle refund
  const handleRefund = async (paymentId: string) => {
    if (!refundCustomer) return;
    await queueRefund(paymentId as `0x${string}`, refundCustomer as `0x${string}`);
    setSelectedPayment(null);
    setRefundCustomer("");
  };

  // Handle make public with confirmation
  const handleMakePublic = async () => {
    await makeTotalPublic();
    setShowPublicWarning(false);
  };

  // Handle make refund total public with confirmation
  const handleMakeRefundPublic = async () => {
    await makeRefundTotalPublic();
    setShowRefundPublicWarning(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center py-16">
            <CardContent>
              <Wallet className="w-16 h-16 mx-auto mb-6 text-pink-500" />
              <h2 className="font-pixel text-lg uppercase tracking-wider mb-4">
                Connect Wallet
              </h2>
              <p className="font-sans text-dark-500 dark:text-dark-400 mb-6">
                Connect your wallet to access the merchant dashboard
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="font-pixel text-xl md:text-2xl uppercase tracking-wider mb-2">
              <span className="glitch" data-text="Dashboard">
                Dashboard
              </span>
            </h1>
            <p className="font-sans text-dark-500 dark:text-dark-400">
              Manage your confidential payments
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Token Selector */}
            <div className="flex gap-2">
              {CONFIDENTIAL_TOKENS.map((token) => (
                <Button
                  key={token.wrapperAddress}
                  variant={selectedToken.wrapperAddress === token.wrapperAddress ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedToken(token)}
                  className="text-xs"
                >
                  {token.underlyingSymbol}
                </Button>
              ))}
            </div>
            
            <Badge variant={isMerchant ? "success" : "warning"}>
              {isMerchant ? "Merchant" : "Not Registered"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetchMerchant()}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            {isMerchant && (
              <Link href="/dashboard/products">
                <Button variant="outline" size="sm">
                  <Package className="w-3 h-3 mr-1" />
                  Products
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="w-3 h-3 mr-1" />
                Home
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Not a merchant warning */}
        {!isMerchant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500"
          >
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-accent-600" />
              <div>
                <h4 className="font-pixel text-[10px] uppercase tracking-wider text-accent-700 dark:text-accent-300 mb-1">
                  Merchant Registration Required
                </h4>
                <p className="font-sans text-xs text-accent-600 dark:text-accent-400">
                  Your wallet is not registered as a merchant. Contact the platform
                  admin to register your address: {formatAddress(address || "", 6)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            title="Gross Revenue"
            value={
              showTotals && decryptedTotal !== null
                ? formatTokenAmount(decryptedTotal, 6, "")
                : "🔐 Encrypted"
            }
            subtitle="Total payments received"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Total Refunds"
            value={
              showTotals && decryptedRefundTotal !== null
                ? formatTokenAmount(decryptedRefundTotal, 6, "")
                : merchantRefundTotalHandle && merchantRefundTotalHandle !== "0x" + "0".repeat(64)
                ? "🔐 Encrypted"
                : "0.00"
            }
            subtitle="Refunds issued"
            icon={<RefreshCw className="w-6 h-6" />}
          />
          <StatCard
            title="Net Revenue"
            value={
              showTotals && decryptedTotal !== null
                ? formatTokenAmount(
                    decryptedTotal - (decryptedRefundTotal || 0n),
                    6,
                    ""
                  )
                : "🔐 Encrypted"
            }
            subtitle="Gross - Refunds"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Payments"
            value={paymentsLoading ? "..." : paymentEvents.length}
            subtitle="Total transactions"
            icon={<CreditCard className="w-6 h-6" />}
          />
        </motion.div>

        {/* Decrypt Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-500" />
                Revenue Privacy
              </CardTitle>
              <CardDescription>
                Your revenue totals are encrypted on-chain. Decrypt to view or make public for tax reporting.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={handleDecryptTotals}
                isLoading={isDecrypting}
                disabled={!fhevmReady || !isMerchant}
              >
                {showTotals ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {showTotals ? "Refresh Totals" : "Decrypt Totals"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPublicWarning(true)}
                isLoading={merchantOpPending}
                disabled={!isMerchant}
              >
                <Download className="w-4 h-4 mr-2" />
                Make Gross Public (Tax)
              </Button>
              {merchantRefundTotalHandle && merchantRefundTotalHandle !== "0x" + "0".repeat(64) && (
                <Button
                  variant="secondary"
                  onClick={() => setShowRefundPublicWarning(true)}
                  isLoading={merchantOpPending}
                  disabled={!isMerchant}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Make Refunds Public (Tax)
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-pink-500" />
                  Recent Payments
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => refetchPayments()}
                  disabled={paymentsLoading}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${paymentsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-pink-500" />
                  <p className="font-mono text-sm text-dark-500">Loading payments...</p>
                </div>
              ) : paymentEvents.length === 0 ? (
                <EmptyState
                  icon={<CreditCard className="w-12 h-12" />}
                  title="No Payments Yet"
                  description="Payments will appear here once customers start paying"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-mobile">
                    <thead>
                      <tr className="border-b-2 border-black dark:border-white bg-dark-50 dark:bg-dark-900">
                        <th className="px-4 py-3 text-left font-pixel text-[8px] uppercase tracking-wider">
                          Payment ID
                        </th>
                        <th className="px-4 py-3 text-left font-pixel text-[8px] uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left font-pixel text-[8px] uppercase tracking-wider hide-mobile">
                          Payer
                        </th>
                        <th className="px-4 py-3 text-left font-pixel text-[8px] uppercase tracking-wider hide-mobile">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left font-pixel text-[8px] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-pixel text-[8px] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentEvents.map((payment, index) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-dark-200 dark:border-dark-700 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors"
                        >
                          <td data-label="Payment ID" className="px-4 py-3 font-mono text-xs">
                            {formatAddress(payment.paymentId, 8)}
                          </td>
                          <td data-label="Amount" className="px-4 py-3">
                            <Badge variant="info">🔐 Encrypted</Badge>
                          </td>
                          <td data-label="Payer" className="px-4 py-3 font-mono text-xs hide-mobile">
                            {formatAddress(payment.payer, 6)}
                          </td>
                          <td data-label="Date" className="px-4 py-3 font-sans text-sm text-dark-500 hide-mobile">
                            {formatDate(Number(payment.timestamp))}
                          </td>
                          <td data-label="Status" className="px-4 py-3">
                            {payment.isRefunded ? (
                              <Badge variant="warning">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                refunded
                              </Badge>
                            ) : (
                              <Badge variant="success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                completed
                              </Badge>
                            )}
                          </td>
                          <td data-label="Actions" className="px-4 py-3 text-right">
                            {!payment.isRefunded ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPayment(payment.paymentId)}
                              >
                                Refund
                              </Button>
                            ) : (
                              <span className="text-xs text-dark-400">Refunded</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Refund Modal - Improved UX */}
        <AnimatePresence>
          {selectedPayment && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelectedPayment(null);
                  setRefundCustomer("");
                }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-pink-500" />
                      Process Refund
                    </CardTitle>
                    <CardDescription>
                      Refund payment to original customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment ID Display */}
                    <div className="p-3 bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-dark-500">Payment ID</span>
                        <span className="font-mono text-xs">{formatAddress(selectedPayment, 10)}</span>
                      </div>
                    </div>

                    {/* Customer Address - Auto-populated if available */}
                    <div>
                      <label className="block font-pixel text-[10px] uppercase tracking-wider text-dark-500 mb-2">
                        Customer Address
                      </label>
                      {(() => {
                        const payment = paymentEvents.find(p => p.paymentId === selectedPayment);
                        if (payment?.payer && !refundCustomer) {
                          // Auto-populate on first render
                          setTimeout(() => setRefundCustomer(payment.payer), 0);
                        }
                        return (
                          <>
                            <Input
                              placeholder="0x..."
                              value={refundCustomer || payment?.payer || ""}
                              onChange={(e) => setRefundCustomer(e.target.value)}
                            />
                            {payment?.payer && (
                              <p className="mt-1 text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Auto-filled from payment record
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Amount Info */}
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-pink-700 dark:text-pink-300">Refund Amount</span>
                        <Badge variant="success">🔐 Full Encrypted Amount</Badge>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="p-3 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500">
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-accent-600 mt-0.5" />
                        <div className="text-xs text-accent-600 dark:text-accent-400">
                          <p className="font-semibold mb-1">Before proceeding:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Ensure you have authorized the gateway as operator on cUSDC</li>
                            <li>The full encrypted payment amount will be refunded</li>
                            <li>This action cannot be undone</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPayment(null);
                          setRefundCustomer("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleRefund(selectedPayment)}
                        isLoading={refundProcessing}
                        disabled={!refundCustomer || !refundCustomer.startsWith("0x")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Process Refund
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 text-pink-500" />
              <div>
                <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-1">
                  Privacy First
                </h4>
                <p className="font-sans text-xs text-dark-500 dark:text-dark-400">
                  Individual payment amounts are always encrypted. Only you can
                  decrypt your aggregate totals.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex gap-3">
              <Download className="w-5 h-5 flex-shrink-0 text-pink-500" />
              <div>
                <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-1">
                  Tax Compliance
                </h4>
                <p className="font-sans text-xs text-dark-500 dark:text-dark-400">
                  Use "Make Public" to create a verifiable on-chain disclosure of
                  your aggregate revenue for tax or audit purposes.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Warning Modal for Make Public */}
      <ConfirmModal
        isOpen={showPublicWarning}
        onClose={() => setShowPublicWarning(false)}
        onConfirm={handleMakePublic}
        title="⚠️ Make Gross Revenue Public?"
        message="This action is PERMANENT and IRREVERSIBLE. Once made public, anyone will be able to view your total gross revenue forever. This cannot be undone. Only use this for tax reporting or regulatory compliance when required by law."
        confirmText="I Understand - Make Public"
        cancelText="Cancel"
        variant="danger"
        isLoading={merchantOpPending}
      />

      {/* Warning Modal for Make Refund Total Public */}
      <ConfirmModal
        isOpen={showRefundPublicWarning}
        onClose={() => setShowRefundPublicWarning(false)}
        onConfirm={handleMakeRefundPublic}
        title="⚠️ Make Refund Total Public?"
        message="This action is PERMANENT and IRREVERSIBLE. Once made public, anyone will be able to view your total refunds forever. This cannot be undone. Only use this for tax reporting or regulatory compliance when required by law."
        confirmText="I Understand - Make Public"
        cancelText="Cancel"
        variant="danger"
        isLoading={merchantOpPending}
      />
    </div>
  );
}
