"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Wallet,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Button, Card, CardContent, Badge, Modal } from "@/components/ui";

interface FHETooltipProps {
  children: React.ReactNode;
  content: string;
}

export function FHETooltip({ children, content }: FHETooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 text-pink-500 hover:text-pink-600 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-64"
          >
            <div className="p-3 bg-dark-800 dark:bg-dark-900 text-white text-xs rounded-lg shadow-lg border border-dark-700">
              {content}
              <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-dark-800 dark:bg-dark-900 border-r border-b border-dark-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is FHE (Fully Homomorphic Encryption)?",
    answer:
      "FHE allows computations on encrypted data without decrypting it first. Your payment amounts stay encrypted on the blockchain, even during processing. Only you and the recipient can decrypt the actual value.",
  },
  {
    question: "Who can see my payment amounts?",
    answer:
      "Only you and the merchant can decrypt your payment amounts using your wallet signatures. The blockchain stores encrypted values that look like random data to everyone else.",
  },
  {
    question: "What is a confidential token (cUSDC)?",
    answer:
      "A confidential token wraps a standard token (like USDC) with FHE encryption. Your balance and transfer amounts are encrypted on-chain. You can wrap/unwrap between regular and confidential tokens anytime.",
  },
  {
    question: "Why do I need to authorize the gateway?",
    answer:
      "The gateway needs temporary permission (1 hour) to transfer your encrypted tokens for payment. This is similar to ERC20 approvals but time-limited for better security.",
  },
  {
    question: "Can the platform see my data?",
    answer:
      "No. We never store decrypted amounts. All encryption/decryption happens in your browser using your wallet. We only see encrypted values that we cannot decrypt.",
  },
  {
    question: "What happens during a refund?",
    answer:
      "The merchant initiates a refund using the encrypted payment amount. The same encrypted value is transferred back to you. Neither the refund amount nor the original payment is ever revealed publicly.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {faqItems.map((item, index) => (
        <motion.div
          key={index}
          initial={false}
          className="border-2 border-dark-200 dark:border-dark-700"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
          >
            <span className="font-sans text-sm font-medium pr-4">
              {item.question}
            </span>
            {openIndex === index ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0 text-pink-500" />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-dark-400" />
            )}
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 text-sm text-dark-500 dark:text-dark-400">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

const onboardingSteps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Connect your Ethereum wallet to get started",
    color: "bg-blue-500",
  },
  {
    icon: Sparkles,
    title: "Get Confidential Tokens",
    description: "Wrap your USDC into encrypted cUSDC tokens",
    color: "bg-purple-500",
  },
  {
    icon: Shield,
    title: "Authorize Gateway",
    description: "Give temporary permission for encrypted transfers",
    color: "bg-pink-500",
  },
  {
    icon: Lock,
    title: "Pay Privately",
    description: "Your payment amount is encrypted before submission",
    color: "bg-green-500",
  },
];

export function OnboardingGuide({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {onboardingSteps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                index <= currentStep
                  ? step.color + " text-white"
                  : "bg-dark-200 dark:bg-dark-700 text-dark-400"
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </div>
            {index < onboardingSteps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-colors ${
                  index < currentStep
                    ? "bg-pink-500"
                    : "bg-dark-200 dark:bg-dark-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-center py-8"
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full ${onboardingSteps[currentStep].color} flex items-center justify-center`}
          >
            {(() => {
              const Icon = onboardingSteps[currentStep].icon;
              return <Icon className="w-8 h-8 text-white" />;
            })()}
          </div>
          <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
            {onboardingSteps[currentStep].title}
          </h3>
          <p className="text-sm text-dark-500 dark:text-dark-400 mb-6 max-w-xs mx-auto">
            {onboardingSteps[currentStep].description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < onboardingSteps.length - 1 ? (
          <Button
            variant="primary"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button variant="primary" onClick={onComplete} glitch>
            <Zap className="w-4 h-4 mr-2" />
            Get Started
          </Button>
        )}
      </div>
    </div>
  );
}

export function PrivacyExplainer() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-1">
                What&apos;s Visible
              </h4>
              <ul className="text-xs text-dark-500 dark:text-dark-400 space-y-1">
                <li>• Transaction occurred (public)</li>
                <li>• Merchant address (public)</li>
                <li>• Encrypted amount blob (random data)</li>
              </ul>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <EyeOff className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h4 className="font-pixel text-[10px] uppercase tracking-wider mb-1">
                What&apos;s Hidden
              </h4>
              <ul className="text-xs text-dark-500 dark:text-dark-400 space-y-1">
                <li>• Payment amount (encrypted)</li>
                <li>• Your identity connection (unlinkable)</li>
                <li>• Spending patterns (private)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
      <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-500">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 flex-shrink-0 text-accent-600" />
          <div>
            <h4 className="font-pixel text-[10px] uppercase tracking-wider text-accent-700 dark:text-accent-300 mb-1">
              Zero-Knowledge Proof of Privacy
            </h4>
            <p className="text-xs text-accent-600 dark:text-accent-400">
              Even blockchain explorers and analytics tools cannot determine
              payment amounts. The encryption is mathematically impossible to
              break without your wallet signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "faq" | "privacy">("guide");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Privacy Guide" size="lg">
      {/* Tabs */}
      <div className="flex border-b border-dark-200 dark:border-dark-700 mb-6">
        {[
          { id: "guide", label: "Quick Guide" },
          { id: "faq", label: "FAQ" },
          { id: "privacy", label: "Privacy" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 font-pixel text-[10px] uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-dark-500 hover:text-dark-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === "guide" && <OnboardingGuide onComplete={onClose} />}
          {activeTab === "faq" && <FAQAccordion />}
          {activeTab === "privacy" && <PrivacyExplainer />}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 p-0 bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export function FirstTimeOnboarding() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    setMounted(true);
    const hasSeenOnboarding = localStorage.getItem("aruvi_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShow(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("aruvi_onboarding_seen", "true");
    setShow(false);
  };

  // Prevent rendering on server and first client render to avoid hydration mismatch
  if (!mounted || !show) return null;

  return (
    <Modal
      isOpen={show}
      onClose={handleComplete}
      title="Welcome to Aruvi"
      size="md"
    >
      <div className="text-center mb-6">
        <Badge variant="success" className="mb-4">
          🔐 Privacy-First Payments
        </Badge>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Learn how your payments are protected with FHE encryption
        </p>
      </div>
      <OnboardingGuide onComplete={handleComplete} />
    </Modal>
  );
}
