"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReadContract } from "wagmi";
import { parseAbiItem } from "viem";
import {
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Home,
  Eye,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Badge,
} from "@/components/ui";
import { useFhevmPublicDecrypt } from "@/hooks";
import { formatTokenAmount, formatAddress } from "@/lib/utils";
import { CONTRACTS } from "@/lib/contracts";
import { CONFIDENTIAL_TOKENS, getDefaultToken, type ConfidentialToken } from "@/lib/tokenRegistry";

export default function AuditPage() {
  const [merchantAddress, setMerchantAddress] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null);
  const [decryptedGross, setDecryptedGross] = useState<bigint | null>(null);
  const [decryptedRefunds, setDecryptedRefunds] = useState<bigint | null>(null);
  const [decryptStatus, setDecryptStatus] = useState<"idle" | "success" | "not-public" | "error">("idle");
  const [selectedToken, setSelectedToken] = useState<ConfidentialToken>(getDefaultToken());

  const { publicDecrypt, isDecrypting } = useFhevmPublicDecrypt();

  const GATEWAY_ADDRESS = CONTRACTS.GATEWAY as `0x${string}`; // Use default gateway for now

  // Get merchant total handle
  const { data: merchantTotalHandle, refetch: refetchTotal } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchantTotals(address) view returns (bytes32)")],
    functionName: "merchantTotals",
    args: searchedAddress ? [searchedAddress as `0x${string}`] : undefined,
    query: { enabled: !!searchedAddress },
  });

  // Get merchant refund total handle
  const { data: merchantRefundTotalHandle, refetch: refetchRefundTotal } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchantRefundTotals(address) view returns (bytes32)")],
    functionName: "merchantRefundTotals",
    args: searchedAddress ? [searchedAddress as `0x${string}`] : undefined,
    query: { enabled: !!searchedAddress },
  });

  // Check if merchant is registered
  const { data: isMerchant } = useReadContract({
    address: GATEWAY_ADDRESS,
    abi: [parseAbiItem("function merchants(address) view returns (bool)")],
    functionName: "merchants",
    args: searchedAddress ? [searchedAddress as `0x${string}`] : undefined,
    query: { enabled: !!searchedAddress },
  });

  const handleSearch = async () => {
    if (!merchantAddress || !merchantAddress.startsWith("0x")) {
      return;
    }

    setSearchedAddress(merchantAddress);
    setDecryptedGross(null);
    setDecryptedRefunds(null);
    setDecryptStatus("idle");

    // Wait for the contract calls to complete
    await Promise.all([refetchTotal(), refetchRefundTotal()]);
  };

  const handleDecrypt = async () => {
    if (!merchantTotalHandle || merchantTotalHandle === "0x" + "0".repeat(64)) {
      setDecryptStatus("error");
      return;
    }

    setDecryptStatus("idle");
    
    try {
      // Decrypt gross revenue
      const handles = [merchantTotalHandle as string];
      
      // Add refund total if it exists
      if (merchantRefundTotalHandle && merchantRefundTotalHandle !== "0x" + "0".repeat(64)) {
        handles.push(merchantRefundTotalHandle as string);
      }
      
      const result = await publicDecrypt(handles);
      
      if (result && result[merchantTotalHandle as string]) {
        setDecryptedGross(result[merchantTotalHandle as string]);
        
        if (merchantRefundTotalHandle && result[merchantRefundTotalHandle as string]) {
          setDecryptedRefunds(result[merchantRefundTotalHandle as string]);
        }
        
        setDecryptStatus("success");
      } else {
        setDecryptStatus("not-public");
      }
    } catch (err) {
      console.error("[Audit] Public decrypt failed:", err);
      setDecryptStatus("not-public");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-pink-500" />
          </div>
          <h1 className="font-pixel text-2xl md:text-3xl uppercase tracking-wider mb-2">
            <span className="glitch" data-text="Tax Audit">
              Tax Audit
            </span>
          </h1>
          <p className="font-sans text-dark-500 dark:text-dark-400 max-w-2xl mx-auto">
            Public portal for tax authorities and auditors to view merchant revenue
            disclosures. Only merchants who have made their totals public can be viewed here.
          </p>
          
          {/* Token Selector */}
          <div className="flex justify-center gap-2 mt-4 mb-4">
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
          
          <Link href="/" className="inline-block mt-2">
            <Button variant="outline" size="sm">
              <Home className="w-3 h-3 mr-1" />
              Home
            </Button>
          </Link>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-accent-500 bg-accent-50 dark:bg-accent-900/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-accent-600" />
                <div>
                  <h4 className="font-pixel text-[10px] uppercase tracking-wider text-accent-700 dark:text-accent-300 mb-1">
                    No Login Required
                  </h4>
                  <p className="font-sans text-xs text-accent-600 dark:text-accent-400">
                    This is a public portal. No wallet connection or authentication is needed.
                    Simply enter a merchant address to check if they have disclosed their revenue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-4 h-4 text-pink-500" />
                Search Merchant
              </CardTitle>
              <CardDescription>
                Enter a merchant's Ethereum address to check their public revenue disclosure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="0x..."
                  value={merchantAddress}
                  onChange={(e) => setMerchantAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={!merchantAddress || !merchantAddress.startsWith("0x")}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Card */}
        {searchedAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-pink-500" />
                  Merchant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Merchant Address */}
                <div className="p-4 bg-dark-50 dark:bg-dark-900 border-2 border-black dark:border-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-pixel text-[10px] uppercase tracking-wider text-dark-500">
                      Merchant Address
                    </span>
                  </div>
                  <p className="font-mono text-xs break-all">{searchedAddress}</p>
                </div>

                {/* Registration Status */}
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-dark-500">Registration Status</span>
                  <Badge variant={isMerchant ? "success" : "danger"}>
                    {isMerchant ? "Registered Merchant" : "Not Registered"}
                  </Badge>
                </div>

                {/* Total Revenue Handle */}
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-dark-500">Revenue Data</span>
                  <Badge variant={merchantTotalHandle && merchantTotalHandle !== "0x" + "0".repeat(64) ? "success" : "warning"}>
                    {merchantTotalHandle && merchantTotalHandle !== "0x" + "0".repeat(64) ? "Has Data" : "No Data"}
                  </Badge>
                </div>

                {/* Decrypt Section */}
                {merchantTotalHandle && merchantTotalHandle !== "0x" + "0".repeat(64) && (
                  <>
                    <div className="border-t-2 border-dark-200 dark:border-dark-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-1">
                            Total Revenue
                          </h4>
                          <p className="font-sans text-xs text-dark-500">
                            Attempt to decrypt publicly disclosed revenue
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleDecrypt}
                          isLoading={isDecrypting}
                          disabled={decryptStatus === "success"}
                        >
                          {decryptStatus === "success" ? "Decrypted" : "Decrypt"}
                        </Button>
                      </div>

                      {/* Decryption Result */}
                      {decryptStatus === "success" && decryptedGross !== null && (
                        <div className="space-y-4">
                          {/* Gross Revenue */}
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-pixel text-[10px] uppercase tracking-wider text-green-700 dark:text-green-300 mb-2">
                                  Gross Revenue (Public Disclosure)
                                </h5>
                                <div className="font-mono text-2xl text-green-800 dark:text-green-200 mb-1">
                                  {formatTokenAmount(decryptedGross, 6, "cUSDC")}
                                </div>
                                <p className="font-sans text-xs text-green-600 dark:text-green-400">
                                  Total payments received by this merchant
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Refunds */}
                          {decryptedRefunds !== null && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500">
                              <div className="flex items-start gap-3">
                                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="font-pixel text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
                                    Total Refunds (Public Disclosure)
                                  </h5>
                                  <div className="font-mono text-2xl text-blue-800 dark:text-blue-200 mb-1">
                                    {formatTokenAmount(decryptedRefunds, 6, "cUSDC")}
                                  </div>
                                  <p className="font-sans text-xs text-blue-600 dark:text-blue-400">
                                    Total refunds issued by this merchant
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Net Revenue */}
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500">
                            <div className="flex items-start gap-3">
                              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-pixel text-[10px] uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2">
                                  Net Revenue (Calculated)
                                </h5>
                                <div className="font-mono text-3xl font-bold text-purple-800 dark:text-purple-200 mb-1">
                                  {formatTokenAmount(decryptedGross - (decryptedRefunds || 0n), 6, "cUSDC")}
                                </div>
                                <p className="font-sans text-xs text-purple-600 dark:text-purple-400">
                                  Gross revenue minus total refunds = actual earnings
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Verification Note */}
                          <div className="p-3 bg-dark-50 dark:bg-dark-900 border border-dark-300 dark:border-dark-600">
                            <p className="font-sans text-xs text-dark-600 dark:text-dark-400">
                              ✓ These values are cryptographically verified and permanently disclosed on-chain.
                              {!decryptedRefunds && " Note: Refund total not publicly disclosed - net revenue may be higher than shown gross revenue."}
                            </p>
                          </div>
                        </div>
                      )}

                      {decryptStatus === "not-public" && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-pixel text-[10px] uppercase tracking-wider text-yellow-700 dark:text-yellow-300 mb-1">
                                Not Publicly Disclosed
                              </h5>
                              <p className="font-sans text-xs text-yellow-600 dark:text-yellow-400">
                                This merchant has not made their revenue public. They need to click
                                "Make Public (Tax)" in their dashboard to enable public disclosure.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {decryptStatus === "error" && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-pixel text-[10px] uppercase tracking-wider text-red-700 dark:text-red-300 mb-1">
                                Decryption Failed
                              </h5>
                              <p className="font-sans text-xs text-red-600 dark:text-red-400">
                                Unable to decrypt the revenue data. This may indicate the merchant
                                has not processed any payments or has not enabled public disclosure.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* No Data */}
                {(!merchantTotalHandle || merchantTotalHandle === "0x" + "0".repeat(64)) && (
                  <div className="p-4 bg-dark-50 dark:bg-dark-900 border-2 border-dark-300 dark:border-dark-600 text-center py-8">
                    <p className="font-sans text-sm text-dark-500">
                      No revenue data found for this merchant address.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How This Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-pixel text-[10px]">
                  1
                </div>
                <p className="font-sans text-xs text-dark-600 dark:text-dark-300">
                  Merchants' revenue is encrypted on-chain by default for privacy
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-pixel text-[10px]">
                  2
                </div>
                <p className="font-sans text-xs text-dark-600 dark:text-dark-300">
                  For tax/regulatory compliance, merchants can make their gross revenue and refund totals public
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-pixel text-[10px]">
                  3
                </div>
                <p className="font-sans text-xs text-dark-600 dark:text-dark-300">
                  Once public, anyone (including tax authorities) can decrypt and calculate net revenue
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-pixel text-[10px]">
                  4
                </div>
                <p className="font-sans text-xs text-dark-600 dark:text-dark-300">
                  Net revenue = Gross revenue - Refunds (all cryptographically verified on-chain)
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
