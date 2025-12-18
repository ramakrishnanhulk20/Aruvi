"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, Button, Input, Label, Textarea } from "@/components/ui";
import { toast } from "react-hot-toast";
import { Loader2, Store, CheckCircle, AlertCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    website: "",
    email: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate form
    if (!formData.businessName || !formData.email) {
      toast.error("Business name and email are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/merchant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          ...formData,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setIsSuccess(true);
      toast.success("Registration submitted successfully! 🎉");
      toast("You'll be notified once approved by the admin", { duration: 5000 });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <div className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-6">
                  <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">Registration Submitted!</h1>
              <p className="text-muted-foreground mb-6 text-lg">
                Your merchant registration request has been received. Our team will
                review your application and approve it within 24-48 hours.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                You'll receive confirmation at <strong>{formData.email}</strong> once approved.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push("/")} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
                <Button onClick={() => setIsSuccess(false)}>
                  Register Another Merchant
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Merchant Registration</h1>
            <p className="text-muted-foreground">
              Join Aruvi's confidential payment network
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Registration Form */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <Store className="h-5 w-5" />
              Business Information
            </h3>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to register as a merchant
                </p>
                <ConnectButton />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Wallet Address Display */}
                <div className="bg-muted p-4 rounded-lg">
                  <Label className="text-sm text-muted-foreground">
                    Wallet Address
                  </Label>
                  <p className="font-mono text-sm mt-1 break-all">{address}</p>
                </div>

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="e.g., Acme Coffee Shop"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    name="businessType"
                    placeholder="e.g., Retail, E-commerce, Services"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Contact Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="merchant@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your business and why you want to accept confidential payments..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">What happens next?</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                        <li>Your registration will be reviewed by our team</li>
                        <li>Approval typically takes 24-48 hours</li>
                        <li>Once approved, your wallet will be registered on-chain</li>
                        <li>You'll receive an email confirmation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Store className="mr-2 h-4 w-4" />
                      Submit Registration
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
