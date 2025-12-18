"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Textarea,
} from "@/components/ui";
import type { TokenSubmission } from "@/types/tokenSubmission";
import toast from "react-hot-toast";

export default function AdminTokensPage() {
  const { address } = useAccount();
  const [submissions, setSubmissions] = useState<TokenSubmission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  // Load submissions
  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/tokens/submit${params}`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch("/api/tokens/submit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          adminNotes: adminNotes[id] || '',
          reviewedBy: address,
        }),
      });

      if (!response.ok) {
        throw new Error("Review failed");
      }

      toast.success(`Token ${status}!`);
      loadSubmissions();
    } catch (error) {
      console.error("Review error:", error);
      toast.error("Failed to review token");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const getValidationIcon = (value: boolean) => {
    return value ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-pink-500" />
          <h1 className="text-3xl font-pixel uppercase tracking-wider">
            Token Administration
          </h1>
        </div>
        <p className="text-dark-600 dark:text-dark-300">
          Review and approve ERC7984 token submissions
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-dark-400">
              Loading submissions...
            </CardContent>
          </Card>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-dark-400">
              No {filter !== 'all' ? filter : ''} submissions found
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-pixel uppercase">
                        {submission.symbol} - {submission.name}
                      </CardTitle>
                      <CardDescription>
                        Submitted by {submission.submittedBy.slice(0, 10)}... 
                        {' '}on {new Date(submission.submittedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-1">Wrapper Contract (ERC7984)</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded font-mono">
                          {submission.wrapperAddress}
                        </code>
                        <a
                          href={`https://sepolia.etherscan.io/address/${submission.wrapperAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-500 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-1">Underlying Token ({submission.underlyingSymbol})</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded font-mono">
                          {submission.underlyingAddress}
                        </code>
                        <a
                          href={`https://sepolia.etherscan.io/address/${submission.underlyingAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-500 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Validation Results */}
                  <div className="border border-dark-200 dark:border-dark-700 rounded-lg p-4 bg-dark-50 dark:bg-dark-900/30">
                    <h4 className="font-pixel text-sm uppercase mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Validation Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        {getValidationIcon(submission.validationResults.isLegitContract)}
                        <span className="text-sm">Legit Contract</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(submission.validationResults.hasERC7984Interface)}
                        <span className="text-sm">ERC7984 Interface</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(submission.validationResults.hasUnderlyingToken)}
                        <span className="text-sm">Has Underlying Token</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(submission.validationResults.isWhitelistedInGateway)}
                        <span className="text-sm">Gateway Whitelisted</span>
                      </div>
                    </div>
                    {submission.validationResults.validationErrors.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Errors: {submission.validationResults.validationErrors.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Admin Actions (only for pending) */}
                  {submission.status === 'pending' && (
                    <div className="space-y-3 pt-4 border-t border-dark-200 dark:border-dark-700">
                      <Textarea
                        value={adminNotes[submission.id] || ''}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [submission.id]: e.target.value })}
                        placeholder="Admin notes (optional)..."
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          onClick={() => handleReview(submission.id, 'approved')}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Approve & Whitelist
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReview(submission.id, 'rejected')}
                          className="flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Review Info (for reviewed submissions) */}
                  {submission.status !== 'pending' && (
                    <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
                      <p className="text-sm text-dark-500 dark:text-dark-400">
                        Reviewed by {submission.reviewedBy?.slice(0, 10)}... 
                        {' '}on {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {submission.adminNotes && (
                        <p className="text-sm mt-2 p-2 bg-dark-100 dark:bg-dark-800 rounded">
                          <strong>Notes:</strong> {submission.adminNotes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
