"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Heart,
  Plus,
  Users,
  TrendingUp,
  Calendar,
  Wallet,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Textarea,
} from "@/components/ui";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

// Inlined types to avoid Vercel build path alias issues
interface DonationRequest {
  id: string;
  walletAddress: string;
  cause: string;
  description?: string;
  targetAmount?: string;
  receivedAmount: string;
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
}

interface DonationSubmission {
  walletAddress: string;
  cause: string;
  description?: string;
  targetAmount?: string;
}

export default function DonationsPage() {
  const { address, isConnected } = useAccount();
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<DonationSubmission>({
    walletAddress: address || "",
    cause: "",
    description: "",
    targetAmount: "",
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (address) {
      setFormData((prev) => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  const fetchDonations = async () => {
    try {
      const response = await fetch("/api/donations");
      if (response.ok) {
        const data = await response.json();
        setDonations(data);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donation requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.cause.trim()) {
      toast.error("Please enter the cause for your donation request");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Donation request submitted successfully!");
        setShowSubmitForm(false);
        setFormData({
          walletAddress: address || "",
          cause: "",
          description: "",
          targetAmount: "",
        });
        fetchDonations();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit donation request");
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      toast.error("Failed to submit donation request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50/20 to-dark-50 dark:from-dark-950 dark:via-pink-950/10 dark:to-dark-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            <span>Support Causes You Care About</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Donation Requests
          </h1>
          <p className="text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
            Browse active donation requests or submit your own cause to receive support from the community
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{donations.length}</p>
                  <p className="text-sm text-dark-500">Active Causes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {donations.filter(d => parseFloat(d.receivedAmount) > 0).length}
                  </p>
                  <p className="text-sm text-dark-500">Funded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                disabled={!isConnected}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showSubmitForm ? "Cancel" : "Submit Request"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Submit Form */}
        {showSubmitForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  Submit Donation Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Wallet Address
                    </label>
                    <Input
                      value={formData.walletAddress}
                      readOnly
                      className="bg-dark-100 dark:bg-dark-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cause / Reason <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.cause}
                      onChange={(e) =>
                        setFormData({ ...formData, cause: e.target.value })
                      }
                      placeholder="e.g., Medical Emergency, Education Fund, Community Project"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description (Optional)
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Provide more details about your cause..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target Amount (Optional)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.targetAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, targetAmount: e.target.value })
                      }
                      placeholder="e.g., 100"
                    />
                  </div>

                  <Button type="submit" isLoading={isSubmitting} className="w-full">
                    Submit Donation Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Donations List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-600" />
                <p className="text-dark-500">Loading donation requests...</p>
              </CardContent>
            </Card>
          ) : donations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-dark-300" />
                <p className="text-dark-500 mb-4">No active donation requests yet</p>
                <Button onClick={() => setShowSubmitForm(true)} disabled={!isConnected}>
                  <Plus className="w-4 h-4 mr-2" />
                  Be the First to Submit
                </Button>
              </CardContent>
            </Card>
          ) : (
            donations.map((donation) => (
              <motion.div
                key={donation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                          <h3 className="text-xl font-bold">{donation.cause}</h3>
                        </div>
                        {donation.description && (
                          <p className="text-dark-600 dark:text-dark-400 mb-3">
                            {donation.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-dark-500">
                          <div className="flex items-center gap-1">
                            <Wallet className="w-4 h-4" />
                            <span className="font-mono">{formatAddress(donation.walletAddress)}</span>
                            <a
                              href={`https://sepolia.etherscan.io/address/${donation.walletAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-500 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {donation.targetAmount && (
                          <div className="mb-2">
                            <p className="text-xs text-dark-500">Target</p>
                            <p className="text-lg font-bold">{donation.targetAmount} cUSDC</p>
                          </div>
                        )}
                        <Link href={`/checkout?merchant=${donation.walletAddress}&type=donation&cause=${encodeURIComponent(donation.cause)}`}>
                          <Button size="sm" className="mt-2">
                            <Heart className="w-4 h-4 mr-2" />
                            Donate Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
