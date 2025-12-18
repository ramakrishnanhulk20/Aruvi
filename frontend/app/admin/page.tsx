"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, Button, Badge } from "@/components/ui";
import { toast } from "react-hot-toast";
import {
  Loader2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Home,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getContractConfig } from "@/lib/contracts";
import type { MerchantRegistration } from "../api/merchant/register/route";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const [registrations, setRegistrations] = useState<MerchantRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [onChainTxHash, setOnChainTxHash] = useState<`0x${string}` | null>(null);

  const { isSuccess: isTxSuccess, isLoading: isTxPending } = useWaitForTransactionReceipt({
    hash: onChainTxHash || undefined,
  });

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/merchant/register?status=pending");
      const data = await response.json();
      if (data.success) {
        setRegistrations(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    if (isTxSuccess && onChainTxHash) {
      toast.success("Merchant registered on-chain! 🎉");
      setOnChainTxHash(null);
      fetchRegistrations(); // Refresh list
    }
  }, [isTxSuccess, onChainTxHash]);

  const handleApprove = async (registration: MerchantRegistration) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setProcessingId(registration.id);

    try {
      // Step 1: Approve off-chain
      const message = `Approve merchant registration for ${registration.businessName} (${registration.walletAddress})`;
      const signature = await signMessageAsync({ message });

      const approvalResponse = await fetch("/api/merchant/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: "approve",
          adminAddress: address,
          signature,
          message,
        }),
      });

      if (!approvalResponse.ok) {
        const error = await approvalResponse.json();
        throw new Error(error.error || "Approval failed");
      }

      toast.success("Off-chain approval successful!");

      // Step 2: Register on-chain
      toast("Registering merchant on-chain...", { duration: 3000 });
      const gatewayConfig = getContractConfig("GATEWAY");
      
      const txHash = await writeContractAsync({
        address: gatewayConfig.address,
        abi: gatewayConfig.abi,
        functionName: "registerMerchant",
        args: [registration.walletAddress as `0x${string}`],
      });

      setOnChainTxHash(txHash);
      toast("Transaction submitted. Waiting for confirmation...", { duration: 3000 });
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (registration: MerchantRegistration) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    const reason = prompt("Rejection reason (optional):");
    setProcessingId(registration.id);

    try {
      const message = `Reject merchant registration for ${registration.businessName} (${registration.walletAddress})`;
      const signature = await signMessageAsync({ message });

      const response = await fetch("/api/merchant/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: "reject",
          adminAddress: address,
          signature,
          message,
          reason: reason || "No reason provided",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rejection failed");
      }

      toast.success("Registration rejected");
      fetchRegistrations();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card>
            <div className="pt-12 pb-12 text-center">
              <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to access the admin panel
              </p>
              <ConnectButton />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <ShieldCheck className="h-10 w-10" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage merchant registration requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchRegistrations} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* Admin Info Banner */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Connected as Admin
                </p>
                <p className="text-blue-800 dark:text-blue-200 font-mono">
                  {address}
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-2">
                  Approving a merchant will execute an on-chain transaction to register them.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Registrations */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Pending Registrations</h3>
              <Badge variant="info">{registrations.length} pending</Badge>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading registrations...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">No pending registrations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <Card key={reg.id} className="border-2">
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column - Business Info */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Business Name</p>
                            <p className="font-semibold text-lg">{reg.businessName}</p>
                          </div>
                          
                          {reg.businessType && (
                            <div>
                              <p className="text-sm text-muted-foreground">Business Type</p>
                              <p>{reg.businessType}</p>
                            </div>
                          )}

                          {reg.website && (
                            <div>
                              <p className="text-sm text-muted-foreground">Website</p>
                              <a
                                href={reg.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {reg.website}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-muted-foreground">Contact Email</p>
                            <p>{reg.email}</p>
                          </div>

                          {reg.description && (
                            <div>
                              <p className="text-sm text-muted-foreground">Description</p>
                              <p className="text-sm">{reg.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Wallet & Actions */}
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                            <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                              {reg.walletAddress}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <p className="text-sm">
                              {new Date(reg.timestamp).toLocaleString()}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleApprove(reg)}
                              disabled={processingId === reg.id || isTxPending}
                              className="flex-1"
                              variant="primary"
                            >
                              {processingId === reg.id || (isTxPending && onChainTxHash) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleReject(reg)}
                              disabled={processingId === reg.id}
                              variant="danger"
                              className="flex-1"
                            >
                              {processingId === reg.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
