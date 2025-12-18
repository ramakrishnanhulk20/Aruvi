"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Book,
  Code,
  Shield,
  Zap,
  Users,
  Lock,
  Terminal,
  Wallet,
  Globe,
  ArrowRight,
  Copy,
  Check,
  ChevronRight,
  FileText,
  Database,
  Key,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui";

const navigation = [
  { id: "introduction", label: "Introduction", icon: Book },
  { id: "getting-started", label: "Getting Started", icon: Zap },
  { id: "for-customers", label: "For Customers", icon: Users },
  { id: "for-merchants", label: "For Merchants", icon: Globe },
  { id: "architecture", label: "Architecture", icon: Database },
  { id: "api-reference", label: "API Reference", icon: Code },
  { id: "security", label: "Security", icon: Shield },
  { id: "faq", label: "FAQ", icon: FileText },
];

function CodeBlock({
  code,
  language = "typescript",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="p-2 bg-black/50 hover:bg-black/70 transition-colors"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-white" />
          )}
        </button>
      </div>
      <pre className="bg-black text-green-400 p-4 overflow-x-auto font-mono text-sm border-2 border-black dark:border-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-pink-500 flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h2 className="font-pixel text-2xl uppercase">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      {/* Header */}
      <div className="border-b-2 border-black dark:border-white bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Book className="h-8 w-8" />
              <span className="font-pixel text-sm uppercase text-pink-600 dark:text-pink-400">
                Documentation
              </span>
            </div>
            <h1 className="font-pixel text-4xl md:text-6xl mb-4 uppercase">
              Aruvi Docs
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Everything you need to build with privacy-first payments on
              Ethereum
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="font-pixel text-xs uppercase text-gray-500 mb-4 px-3">
                Contents
              </p>
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all ${
                    activeSection === item.id
                      ? "bg-pink-500 text-white border-2 border-black dark:border-white"
                      : "hover:bg-gray-100 dark:hover:bg-dark-800 border-2 border-transparent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Documentation Content */}
          <main className="flex-1 max-w-4xl">
            {/* Introduction */}
            <Section id="introduction" title="Introduction" icon={Book}>
              <p className="text-gray-700 dark:text-gray-300">
                Aruvi is a privacy-first payment gateway built on Ethereum using
                fhEVM (Fully Homomorphic Encryption). It enables confidential
                transactions where amounts and balances remain encrypted
                on-chain.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-2 border-black dark:border-white p-6 bg-pink-50 dark:bg-pink-900/10">
                  <Shield className="h-8 w-8 mb-3 text-pink-600" />
                  <h3 className="font-pixel text-sm mb-2">Private</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Balances & amounts encrypted using FHE
                  </p>
                </div>
                <div className="border-2 border-black dark:border-white p-6 bg-purple-50 dark:bg-purple-900/10">
                  <Zap className="h-8 w-8 mb-3 text-purple-600" />
                  <h3 className="font-pixel text-sm mb-2">Fast</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Instant payments with on-chain settlement
                  </p>
                </div>
                <div className="border-2 border-black dark:border-white p-6 bg-blue-50 dark:bg-blue-900/10">
                  <Globe className="h-8 w-8 mb-3 text-blue-600" />
                  <h3 className="font-pixel text-sm mb-2">Open</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    MIT licensed, fork and customize freely
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      Testnet Only
                    </p>
                    <p className="text-yellow-800 dark:text-yellow-300">
                      Aruvi is currently deployed on Sepolia testnet. Not
                      audited - use at your own risk.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Getting Started */}
            <Section id="getting-started" title="Getting Started" icon={Zap}>
              <div className="space-y-6">
                <div>
                  <h3 className="font-pixel text-lg mb-3 flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    For Users
                  </h3>
                  <ol className="space-y-3 ml-4">
                    <li className="flex gap-3">
                      <span className="font-pixel text-pink-600">01</span>
                      <div>
                        <p className="font-semibold">Connect Your Wallet</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Visit the{" "}
                          <a href="/tokens" className="text-pink-600 underline">
                            Tokens page
                          </a>{" "}
                          and connect with RainbowKit
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-pixel text-pink-600">02</span>
                      <div>
                        <p className="font-semibold">Get Test Tokens</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Use Circle faucet for USDC or mint xUSD from the
                          dashboard
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-pixel text-pink-600">03</span>
                      <div>
                        <p className="font-semibold">Wrap to Confidential</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Convert USDC → cUSDC or xUSD → cxUSD
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-pixel text-pink-600">04</span>
                      <div>
                        <p className="font-semibold">Authorize Gateway</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Set operator permission (1 hour default, revocable)
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-pixel text-pink-600">05</span>
                      <div>
                        <p className="font-semibold">Make Payments</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Shop on any Aruvi-integrated merchant site
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-pixel text-lg mb-3 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    For Developers
                  </h3>
                  <CodeBlock
                    code={`# Clone repository
git clone https://github.com/yourusername/aruvi.git
cd aruvi

# Install dependencies
cd contracts && npm install
cd ../frontend && npm install

# Set up environment
cp .env.example .env.local
# Add your keys to .env.local

# Deploy contracts
cd contracts
npx hardhat run deploy/deploy.ts --network sepolia

# Run frontend
cd frontend
npm run dev`}
                    language="bash"
                  />
                </div>
              </div>
            </Section>

            {/* For Customers */}
            <Section id="for-customers" title="For Customers" icon={Users}>
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">
                  As a customer, you can use Aruvi to make private payments
                  without exposing your wallet balance or transaction amounts.
                </p>

                <div className="space-y-4">
                  <div className="border-2 border-black dark:border-white p-6">
                    <h3 className="font-pixel text-sm mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Wrapping Tokens
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Convert regular tokens to confidential versions:
                    </p>
                    <ul className="text-sm space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>
                          USDC → cUSDC (confidential USDC wrapper)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>xUSD → cxUSD (confidential xUSD wrapper)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>Your balance becomes encrypted on-chain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>
                          Unwrap anytime to get original tokens back
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-2 border-black dark:border-white p-6">
                    <h3 className="font-pixel text-sm mb-3 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Operator Authorization
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      The gateway needs permission to move your tokens when you
                      make a payment:
                    </p>
                    <ul className="text-sm space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>Set expiry time (default 1 hour)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>Revoke anytime by setting expiry to 0</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>Gateway can only transfer, not view amounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>No approval needed for direct P2P transfers</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-2 border-black dark:border-white p-6">
                    <h3 className="font-pixel text-sm mb-3 flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Decrypting Your Balance
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Only you can decrypt and view your balance:
                    </p>
                    <ul className="text-sm space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Click "Decrypt Balance" button</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Sign message with your wallet</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Balance decrypts client-side only</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Stays encrypted to everyone else</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Section>

            {/* For Merchants */}
            <Section id="for-merchants" title="For Merchants" icon={Globe}>
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Integrate Aruvi into your website to accept confidential
                  payments with just a few lines of code.
                </p>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Quick Integration</h3>
                  <CodeBlock
                    code={`<!-- 1. Include SDK -->
<script src="https://cdn.aruvi.xyz/sdk.js"></script>

<!-- 2. Initialize -->
<script>
  const aruvi = new AruviSDK({
    gatewayAddress: '0xYourGatewayAddress',
    productRegistryAddress: '0xYourProductRegistryAddress',
    tokenSystem: 'USDC' // or 'xUSD'
  });

  // Register as merchant (one-time)
  await aruvi.registerMerchant();
</script>

<!-- 3. Create payment button -->
<button onclick="aruvi.createPayment({
  amount: '25.00',
  orderId: 'ORDER-' + Date.now(),
  productId: 0,
  onSuccess: (tx) => console.log('Payment success:', tx),
  onError: (err) => console.error('Payment failed:', err)
})">
  Pay with Aruvi
</button>`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">
                    Managing Products (Optional)
                  </h3>
                  <CodeBlock
                    code={`// Add a product
await aruvi.addProduct({
  name: 'Premium Coffee',
  price: 5.99,
  inventory: 100
});

// Update inventory
await aruvi.updateInventory(productId, 95);

// Get product info
const product = await aruvi.getProduct(productId);`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Handling Refunds</h3>
                  <CodeBlock
                    code={`// Initiate refund in your admin panel
await aruvi.initiateRefund({
  paymentId: 'payment_abc123',
  reason: 'Customer request'
});

// Listen for refund status
aruvi.on('refund.completed', (refund) => {
  console.log('Refund completed:', refund);
  // Update your database
});`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Viewing Revenue</h3>
                  <CodeBlock
                    code={`// Get encrypted total revenue
const encrypted = await aruvi.getMerchantTotal();

// Decrypt for dashboard display
// (requires wallet signature)
const decrypted = await aruvi.decryptTotal();
console.log(\`Total revenue: \${decrypted} cUSDC\`);

// Make total public for tax/audit
await aruvi.makeTotalPublic();`}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 p-4">
                  <div className="flex gap-3">
                    <Terminal className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                        Full SDK Reference
                      </p>
                      <p className="text-blue-800 dark:text-blue-300">
                        Check out the{" "}
                        <a href="#api-reference" className="underline">
                          API Reference
                        </a>{" "}
                        section for complete SDK documentation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Architecture */}
            <Section id="architecture" title="Architecture" icon={Database}>
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Aruvi consists of multiple smart contracts working together to
                  provide confidential payment infrastructure.
                </p>

                <div className="grid gap-4">
                  <div className="border-2 border-black dark:border-white p-6 bg-pink-50 dark:bg-pink-900/10">
                    <div className="flex items-start gap-3">
                      <Lock className="h-6 w-6 text-pink-600 shrink-0" />
                      <div>
                        <h3 className="font-pixel text-sm mb-2">
                          Confidential Wrapper (ERC7984)
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Wraps ERC20 tokens with FHE encryption
                        </p>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Encrypted balances on-chain</li>
                          <li>• Operator pattern for delegated transfers</li>
                          <li>• 1:1 backing with underlying token</li>
                          <li>• Wrap/unwrap anytime</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-black dark:border-white p-6 bg-yellow-50 dark:bg-yellow-900/10">
                    <div className="flex items-start gap-3">
                      <Globe className="h-6 w-6 text-yellow-600 shrink-0" />
                      <div>
                        <h3 className="font-pixel text-sm mb-2">
                          Payment Gateway
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Processes payments and tracks merchant revenue
                        </p>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Process payments with order tracking</li>
                          <li>• Encrypted merchant totals</li>
                          <li>• Event emission for payment history</li>
                          <li>• Integrates with RefundManager</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-black dark:border-white p-6 bg-purple-50 dark:bg-purple-900/10">
                    <div className="flex items-start gap-3">
                      <FileText className="h-6 w-6 text-purple-600 shrink-0" />
                      <div>
                        <h3 className="font-pixel text-sm mb-2">
                          Product Registry
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Optional product catalog and inventory management
                        </p>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Add/update products</li>
                          <li>• Track inventory on-chain</li>
                          <li>• Link payments to products</li>
                          <li>• Query product details</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-black dark:border-white p-6 bg-blue-50 dark:bg-blue-900/10">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="h-6 w-6 text-blue-600 shrink-0" />
                      <div>
                        <h3 className="font-pixel text-sm mb-2">
                          Refund Manager
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Handles payment refunds and disputes
                        </p>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Merchant-initiated refunds</li>
                          <li>• Automatic token return</li>
                          <li>• Refund history tracking</li>
                          <li>• Gateway integration</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-3">
                    Contract Interaction Flow
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="font-pixel text-pink-600">1</span>
                      <p>
                        User wraps USDC → cUSDC via{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1">
                          ConfidentialWrapper.wrap()
                        </code>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-pixel text-pink-600">2</span>
                      <p>
                        User authorizes gateway via{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1">
                          ConfidentialWrapper.setOperator()
                        </code>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-pixel text-pink-600">3</span>
                      <p>
                        Merchant processes payment via{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1">
                          PaymentGateway.processPayment()
                        </code>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-pixel text-pink-600">4</span>
                      <p>
                        Gateway calls{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1">
                          ConfidentialWrapper.transferFrom()
                        </code>{" "}
                        using operator permission
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-pixel text-pink-600">5</span>
                      <p>
                        If refund needed:{" "}
                        <code className="bg-gray-100 dark:bg-gray-800 px-1">
                          RefundManager.initiateRefund()
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* API Reference */}
            <Section id="api-reference" title="API Reference" icon={Code}>
              <div className="space-y-6">
                <div>
                  <h3 className="font-pixel text-sm mb-3">
                    AruviSDK Constructor
                  </h3>
                  <CodeBlock
                    code={`new AruviSDK({
  gatewayAddress: string,        // PaymentGateway contract address
  productRegistryAddress: string, // ProductRegistry contract address
  tokenSystem: 'USDC' | 'xUSD'   // Which token system to use
})`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Payment Methods</h3>
                  <div className="space-y-3">
                    <CodeBlock
                      code={`// Process a payment
aruvi.createPayment({
  amount: string,           // Amount in token units (e.g., "25.00")
  orderId: string,          // Your unique order identifier
  productId?: number,       // Optional product ID from registry
  onSuccess?: (tx) => void, // Success callback
  onError?: (err) => void   // Error callback
}): Promise<Transaction>

// Get payment history
aruvi.getPayments(
  merchant: string
): Promise<Payment[]>

// Get specific payment
aruvi.getPayment(
  paymentId: string
): Promise<Payment>`}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Merchant Methods</h3>
                  <CodeBlock
                    code={`// Register as merchant (one-time)
aruvi.registerMerchant(): Promise<Transaction>

// Get merchant total revenue (encrypted)
aruvi.getMerchantTotal(): Promise<string>

// Decrypt total for dashboard
aruvi.decryptTotal(): Promise<string>

// Make total public for audit
aruvi.makeTotalPublic(): Promise<Transaction>`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Product Methods</h3>
                  <CodeBlock
                    code={`// Add product
aruvi.addProduct({
  name: string,
  price: number,
  inventory: number
}): Promise<Transaction>

// Update product
aruvi.updateProduct(
  productId: number,
  name: string,
  price: number,
  inventory: number
): Promise<Transaction>

// Get product
aruvi.getProduct(
  productId: number
): Promise<Product>`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Refund Methods</h3>
                  <CodeBlock
                    code={`// Initiate refund
aruvi.initiateRefund({
  paymentId: string,
  reason: string
}): Promise<Transaction>

// Get refund status
aruvi.getRefund(
  refundId: string
): Promise<Refund>

// Listen to refund events
aruvi.on('refund.completed', (refund: Refund) => {
  // Handle refund completion
});`}
                  />
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Token Methods</h3>
                  <CodeBlock
                    code={`// Wrap tokens
aruvi.wrap(amount: string): Promise<Transaction>

// Unwrap tokens
aruvi.unwrap(amount: string): Promise<Transaction>

// Get balance (encrypted)
aruvi.getBalance(address: string): Promise<string>

// Decrypt balance
aruvi.decryptBalance(address: string): Promise<string>

// Set operator authorization
aruvi.setOperator(
  operator: string,
  expiry: number
): Promise<Transaction>`}
                  />
                </div>
              </div>
            </Section>

            {/* Security */}
            <Section id="security" title="Security" icon={Shield}>
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-900 dark:text-red-200 mb-1">
                        Not Audited
                      </p>
                      <p className="text-red-800 dark:text-red-300">
                        Aruvi smart contracts have not been professionally
                        audited. Use on testnet only. Do not use with real
                        funds until mainnet deployment after audit.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Encryption</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Aruvi uses fhEVM (Fully Homomorphic Encryption from Zama) to
                    keep balances and amounts private:
                  </p>
                  <ul className="space-y-2 text-sm ml-4">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                      <span>
                        All balances encrypted on-chain using FHE
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                      <span>
                        Only key holders can decrypt (wallet owner + authorized)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                      <span>No plaintext amounts stored anywhere</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                      <span>Gateway never sees unencrypted balances</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">
                    Operator Authorization
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    The operator pattern allows safe delegation:
                  </p>
                  <ul className="space-y-2 text-sm ml-4">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>Time-limited permission (1 hour default)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>Can be revoked anytime by user</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>
                        Operator can only transfer, not view amounts
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>No blanket approval - explicit authorization</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Best Practices</h3>
                  <ul className="space-y-2 text-sm ml-4">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        Always verify contract addresses before transactions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Use hardware wallets for production</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Limit operator duration to minimum needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Regular balance checks with decrypt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Monitor gateway authorization status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Never share private keys or signatures</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-pixel text-sm mb-3">Reporting Issues</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Found a security vulnerability? Please report it
                    responsibly:
                  </p>
                  <CodeBlock
                    code={`Email: security@aruvi.xyz
PGP Key: [Coming Soon]

Please do NOT open public GitHub issues for security vulnerabilities.`}
                  />
                </div>
              </div>
            </Section>

            {/* FAQ */}
            <Section id="faq" title="FAQ" icon={FileText}>
              <div className="space-y-4">
                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    What is fhEVM?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    fhEVM (Fully Homomorphic Encryption Virtual Machine) is a
                    technology by Zama that enables encrypted smart contracts on
                    Ethereum. It allows computations on encrypted data without
                    decryption.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    How is this different from privacy coins?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Privacy coins like Monero hide all transaction data. Aruvi
                    uses selective disclosure - you can prove specific
                    transactions for tax/audit while keeping everything else
                    private. Plus it works with existing stablecoins like USDC.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    Can I unwrap my tokens anytime?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes! You can unwrap cUSDC → USDC or cxUSD → xUSD anytime.
                    The wrapper maintains 1:1 backing so you always get your
                    original tokens back.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    What happens if I lose operator authorization?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If your operator authorization expires, you won't be able to
                    make payments through the gateway until you re-authorize. You
                    can still unwrap tokens and do direct P2P transfers without
                    operator permission.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    Is this ready for mainnet?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Not yet. Aruvi is currently on Sepolia testnet. We need a
                    professional security audit before mainnet deployment.
                    Planned for Q3 2025.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    How do refunds work?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Merchants can initiate refunds through the RefundManager
                    contract. The encrypted amount is automatically transferred
                    back to the customer. Both parties can track refund status
                    on-chain.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    Can anyone see my balance?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No. Your balance is encrypted using FHE. Only you (the key
                    holder) can decrypt it. Not even blockchain explorers,
                    merchants, or the gateway can see your actual balance.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    What tokens are supported?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Currently USDC and xUSD on Sepolia testnet. The wrapper
                    follows ERC7984 standard, so any ERC20 can be wrapped. More
                    tokens coming soon based on community demand.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    Is there a fee?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No platform fees currently. You only pay gas fees for
                    transactions. Future mainnet version may introduce optional
                    premium features for merchants.
                  </p>
                </div>

                <div className="border-2 border-black dark:border-white p-6">
                  <h3 className="font-pixel text-sm mb-2">
                    How can I contribute?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aruvi is open source (MIT license). Fork the repo, submit
                    PRs, report issues, or join our Discord. We're especially
                    looking for help with auditing, frontend improvements, and
                    documentation.
                  </p>
                </div>
              </div>
            </Section>

            {/* Footer CTA */}
            <div className="border-2 border-black dark:border-white p-8 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20 mt-12">
              <div className="text-center">
                <h2 className="font-pixel text-2xl mb-4 uppercase">
                  Ready to Build?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Start accepting confidential payments on your website today
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/tokens">
                    <Button variant="primary" className="gap-2">
                      Try Demo
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="https://github.com/yourusername/aruvi" target="_blank">
                    <Button variant="secondary" className="gap-2">
                      <Code className="h-4 w-4" />
                      View Source
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
