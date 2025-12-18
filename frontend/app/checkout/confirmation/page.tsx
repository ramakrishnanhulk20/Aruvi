"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ExternalLink,
  Copy,
  ArrowLeft,
  Shield,
  Lock,
  Clock,
  Home,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Divider,
  CopyButton,
} from "@/components/ui";
import { formatAddress } from "@/lib/utils";

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"success" | "pending" | "failed">("success");
  const [txHash, setTxHash] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [merchant, setMerchant] = useState<string>("");
  const [returnUrl, setReturnUrl] = useState<string>("");

  useEffect(() => {
    if (searchParams) {
      const urlStatus = searchParams.get("status");
      const urlTxHash = searchParams.get("txHash");
      const urlPaymentId = searchParams.get("paymentId");
      const urlOrderId = searchParams.get("orderId");
      const urlMerchant = searchParams.get("merchant");
      const urlReturnUrl = searchParams.get("returnUrl");

      if (urlStatus === "success" || urlStatus === "pending" || urlStatus === "failed") {
        setStatus(urlStatus);
      }
      if (urlTxHash) setTxHash(urlTxHash);
      if (urlPaymentId) setPaymentId(urlPaymentId);
      if (urlOrderId) setOrderId(urlOrderId);
      if (urlMerchant) setMerchant(urlMerchant);
      if (urlReturnUrl) setReturnUrl(decodeURIComponent(urlReturnUrl));
    }
  }, [searchParams]);

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-500",
      title: "Payment Complete!",
      description: "Your confidential payment has been processed successfully.",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-500",
      title: "Payment Pending",
      description: "Your payment is being processed. This may take a few moments.",
    },
    failed: {
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-500",
      title: "Payment Failed",
      description: "There was an issue processing your payment. Please try again.",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-8 px-4">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-pixel text-2xl uppercase tracking-wider mb-2">
            <span className="glitch" data-text="Confirmation">
              Confirmation
            </span>
          </h1>
          <p className="font-sans text-dark-500 dark:text-dark-400">
            Payment Receipt
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-8">
              {/* Status Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-center mb-6"
              >
                <div className={`inline-flex p-4 rounded-full ${config.bgColor}`}>
                  <StatusIcon className={`w-16 h-16 ${config.color}`} />
                </div>
              </motion.div>

              {/* Status Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
              >
                <h2 className={`font-pixel text-lg uppercase tracking-wider mb-2 ${config.color}`}>
                  {config.title}
                </h2>
                <p className="font-sans text-sm text-dark-500 dark:text-dark-400">
                  {config.description}
                </p>
              </motion.div>

              {/* Privacy Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center mb-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500 rounded-full">
                  <Lock className="w-4 h-4 text-pink-500" />
                  <span className="font-pixel text-[10px] uppercase tracking-wider text-pink-700 dark:text-pink-300">
                    Amount Encrypted
                  </span>
                </div>
              </motion.div>

              <Divider label="Payment Details" />

              {/* Payment Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 my-6"
              >
                {/* Payment ID */}
                {paymentId && (
                  <div className="flex justify-between items-center p-3 bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700">
                    <span className="text-sm text-dark-500">Payment ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{formatAddress(paymentId, 8)}</span>
                      <CopyButton text={paymentId} />
                    </div>
                  </div>
                )}

                {/* Transaction Hash */}
                {txHash && (
                  <div className="flex justify-between items-center p-3 bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700">
                    <span className="text-sm text-dark-500">Transaction</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-pink-500 hover:underline flex items-center gap-1"
                      >
                        {formatAddress(txHash, 8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <CopyButton text={txHash} />
                    </div>
                  </div>
                )}

                {/* Order ID */}
                {orderId && (
                  <div className="flex justify-between items-center p-3 bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700">
                    <span className="text-sm text-dark-500">Order ID</span>
                    <span className="font-mono text-xs">{orderId}</span>
                  </div>
                )}

                {/* Merchant */}
                {merchant && (
                  <div className="flex justify-between items-center p-3 bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700">
                    <span className="text-sm text-dark-500">Merchant</span>
                    <span className="font-mono text-xs">{formatAddress(merchant, 8)}</span>
                  </div>
                )}

                {/* Amount - ENCRYPTED */}
                <div className="flex justify-between items-center p-3 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500">
                  <span className="text-sm text-pink-700 dark:text-pink-300">Amount</span>
                  <Badge variant="success">🔐 Encrypted On-Chain</Badge>
                </div>
              </motion.div>

              {/* Privacy Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-4 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500 mb-6"
              >
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 flex-shrink-0 text-accent-600" />
                  <div>
                    <h4 className="font-pixel text-[10px] uppercase tracking-wider text-accent-700 dark:text-accent-300 mb-1">
                      Privacy Protected
                    </h4>
                    <p className="font-sans text-xs text-accent-600 dark:text-accent-400">
                      Your payment amount is encrypted using FHE (Fully Homomorphic Encryption). 
                      Only you and the merchant can decrypt the amount with your wallet signatures.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                {returnUrl && (
                  <a href={returnUrl} className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return to Merchant
                    </Button>
                  </a>
                )}

                <Link href="/checkout">
                  <Button variant="outline" size="lg" className="w-full">
                    Make Another Payment
                  </Button>
                </Link>

                <Link href="/">
                  <Button variant="ghost" size="sm" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center font-mono text-[10px] text-dark-400 mt-6"
        >
          Powered by Aruvi • FHE-Encrypted Payments on Sepolia
        </motion.p>
      </div>
    </div>
  );
}
