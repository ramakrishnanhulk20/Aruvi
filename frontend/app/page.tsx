"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Zap,
  Lock,
  RefreshCw,
  ChevronRight,
  Wallet,
  Code,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui";

const features = [
  {
    icon: Shield,
    title: "Confidential Payments",
    description:
      "Amounts and identities stay encrypted on-chain. Even blockchain explorers can't see your transaction details.",
  },
  {
    icon: Zap,
    title: "Easy Integration",
    description:
      'Add "Pay with Aruvi" to any website in minutes. Just like Stripe, but for confidential tokens.',
  },
  {
    icon: Lock,
    title: "Full Privacy",
    description:
      "Powered by Zama FHEVM. Fully Homomorphic Encryption ensures maximum privacy for all payments.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Refunds",
    description:
      "One-click refunds for merchants. The encrypted amount is automatically returned to customers.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect Wallet",
    description: "Connect your wallet to get started with confidential tokens.",
  },
  {
    number: "02",
    title: "Wrap Tokens",
    description: "Convert standard USDC to confidential cUSDC with one click.",
  },
  {
    number: "03",
    title: "Pay Privately",
    description: "Pay merchants without revealing amounts on the blockchain.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 scanlines">
        {/* Pixel grid background */}
        <div className="absolute inset-0 pixel-grid opacity-50" />

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 left-10 w-32 h-32 bg-pink-200/30 dark:bg-pink-500/10"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-40 right-20 w-24 h-24 bg-accent-200/30 dark:bg-accent-500/10"
          />
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-20 left-1/3 w-16 h-16 bg-pink-300/20 dark:bg-pink-400/10"
          />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 dark:bg-accent-900/30 border-2 border-accent-500 text-accent-700 dark:text-accent-300 font-pixel text-[8px] uppercase tracking-wider mb-6"
            >
              <span className="w-2 h-2 bg-accent-500 animate-pulse" />
              Live on Sepolia Testnet
            </motion.div>

            {/* Main Heading */}
            <h1 className="font-pixel text-3xl md:text-5xl lg:text-6xl uppercase tracking-wider mb-6">
              <span className="glitch" data-text="Stripe for">
                Stripe for
              </span>
              <br />
              <span className="text-pink-500 glitch" data-text="Confidential">
                Confidential
              </span>
              <br />
              <span className="glitch" data-text="Tokens">
                Tokens
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-lg md:text-xl text-dark-600 dark:text-dark-300 max-w-2xl mx-auto mb-8">
              Accept private cryptocurrency payments on any website. Customer
              identities and amounts stay encrypted, while you get full merchant
              tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/checkout">
                <Button size="lg" glitch>
                  <Wallet className="w-4 h-4 mr-2" />
                  Start Paying
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  <Code className="w-4 h-4 mr-2" />
                  Merchant Dashboard
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Register as Merchant
                </Button>
              </Link>
            </div>

            {/* Tax Audit Link */}
            <div className="mt-4">
              <Link href="/audit">
                <Button variant="ghost" size="sm">
                  <Shield className="w-3 h-3 mr-2" />
                  Tax Audit Portal
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-wrap justify-center gap-6 text-dark-500 dark:text-dark-400"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-500" />
                <span className="font-mono text-xs">FHE Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-pink-500" />
                <span className="font-mono text-xs">Zero Knowledge</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-pink-500" />
                <span className="font-mono text-xs">ERC-7984 Standard</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white dark:bg-dark-950" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-dark-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-pixel text-xl md:text-2xl uppercase tracking-wider mb-4">
              Why{" "}
              <span className="text-pink-500 glitch" data-text="Aruvi">
                Aruvi
              </span>
              ?
            </h2>
            <p className="font-sans text-dark-500 dark:text-dark-400 max-w-xl mx-auto">
              The first payment gateway built for confidential tokens. Privacy
              by default.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={item}
                className="group p-6 border-2 border-black dark:border-white bg-white dark:bg-dark-800 shadow-pixel hover:shadow-pixel-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <feature.icon className="w-6 h-6 text-pink-500 group-hover:text-white" />
                </div>
                <h3 className="font-pixel text-[10px] uppercase tracking-wider mb-2">
                  {feature.title}
                </h3>
                <p className="font-sans text-sm text-dark-500 dark:text-dark-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-pink-50 dark:bg-dark-900 scanlines">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-pixel text-xl md:text-2xl uppercase tracking-wider mb-4">
              How It{" "}
              <span className="text-accent-500 glitch" data-text="Works">
                Works
              </span>
            </h2>
            <p className="font-sans text-dark-500 dark:text-dark-400 max-w-xl mx-auto">
              Three simple steps to private payments
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 border-2 border-black dark:border-white bg-white dark:bg-dark-800 flex items-center justify-center font-pixel text-xl text-pink-500">
                    {step.number}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
                    {step.title}
                  </h3>
                  <p className="font-sans text-dark-500 dark:text-dark-400">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute left-8 mt-16 w-0.5 h-8 bg-pink-300 dark:bg-pink-700" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/checkout">
              <Button size="lg" variant="secondary">
                Try It Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dark-900 dark:bg-dark-950 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-pixel text-2xl md:text-3xl uppercase tracking-wider mb-6">
              Ready to accept{" "}
              <span className="text-pink-500">private payments</span>?
            </h2>
            <p className="font-sans text-dark-300 mb-8">
              Join the future of confidential commerce. Set up your merchant
              account in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" glitch>
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <a
                href="https://docs.zama.org/protocol"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Read Docs
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
