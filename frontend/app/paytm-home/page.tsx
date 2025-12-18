"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Zap,
  Lock,
  Users,
  Store,
  Send,
  ArrowRight,
  QrCode,
  Smartphone,
  Globe,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui";

export default function PaytmStyleHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section - Paytm Style */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                🔒 Powered by Zama FHE
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-pink-200 to-purple-200 bg-clip-text text-transparent">
              The Payment Platform
              <br />
              <span className="text-5xl md:text-6xl">for Confidential Tokens</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Send money, pay merchants, and transact with complete privacy.
              All on Zama's confidential blockchain.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/checkout">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-6 text-lg">
                  <Send className="w-5 h-5 mr-2" />
                  Send Money
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button variant="outline" className="border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white px-8 py-6 text-lg">
                  <Store className="w-5 h-5 mr-2" />
                  For Business
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Two Main Features - Like Paytm */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* P2P Payments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-8 border border-pink-500/30 hover:border-pink-500 transition-all group"
            >
              <div className="bg-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-4">
                Send Money to Anyone
              </h3>
              
              <p className="text-gray-300 mb-6 text-lg">
                Transfer confidential tokens to friends & family instantly.
                Amounts stay private on blockchain.
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  Instant P2P transfers
                </li>
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  Zero transaction fees
                </li>
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  Complete privacy (FHE)
                </li>
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  Any ERC7984 token
                </li>
              </ul>
              
              <Link href="/checkout?type=p2p">
                <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                  Send Money Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            {/* Merchant Payments */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30 hover:border-blue-500 transition-all group"
            >
              <div className="bg-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Store className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-4">
                Pay Merchants Privately
              </h3>
              
              <p className="text-gray-300 mb-6 text-lg">
                Shop online & offline with complete payment privacy.
                Merchants accept confidential tokens.
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  QR code payments
                </li>
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  One-click checkout
                </li>
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  Automatic refunds
                </li>
                <li className="flex items-center text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                  Business dashboard
                </li>
              </ul>
              
              <Link href="/merchant-demo.html">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Try Demo Store
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Aruvi - Privacy Focus */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose Aruvi?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The complete payment platform built for Zama's confidential ecosystem
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-pink-500 transition-all"
            >
              <Lock className="w-12 h-12 text-pink-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                100% Privacy
              </h3>
              <p className="text-gray-300">
                Powered by Fully Homomorphic Encryption. No one can see your transaction amounts - not even blockchain validators.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
            >
              <Zap className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-300">
                Instant payments with encryption. One-click approvals, QR codes, and seamless merchant integration.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-500 transition-all"
            >
              <Globe className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Zama Ecosystem
              </h3>
              <p className="text-gray-300">
                Works with all ERC7984 confidential tokens on Zama blockchain. The future of private DeFi starts here.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Built for Businesses
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Accept confidential token payments on your website, app, or store.
                  Integration takes just 5 minutes.
                </p>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <div className="bg-pink-500 rounded-full p-1 mr-3 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Easy SDK Integration</h4>
                      <p className="text-gray-400">Add "Pay with Aruvi" button in 3 lines of code</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="bg-pink-500 rounded-full p-1 mr-3 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Business Dashboard</h4>
                      <p className="text-gray-400">Track payments, manage products, issue refunds</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="bg-pink-500 rounded-full p-1 mr-3 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Customer Privacy</h4>
                      <p className="text-gray-400">Build trust with encrypted payments</p>
                    </div>
                  </li>
                </ul>
                
                <div className="flex gap-4">
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                      Get Started
                    </Button>
                  </Link>
                  
                  <Link href="/merchant-demo.html">
                    <Button variant="outline" className="border-2 border-gray-600 text-white hover:bg-gray-800">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-8 border border-pink-500/30">
                  <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
                    <div className="text-green-400 mb-2">// Install SDK</div>
                    <div className="text-gray-300 mb-4">
                      &lt;script src="https://aruvi.app/sdk.js"&gt;&lt;/script&gt;
                    </div>
                    
                    <div className="text-green-400 mb-2">// Initialize</div>
                    <div className="text-gray-300 mb-4">
                      const aruvi = Aruvi.init(&#123;<br />
                      &nbsp;&nbsp;merchantAddress: '0x...'<br />
                      &#125;);
                    </div>
                    
                    <div className="text-green-400 mb-2">// Add payment button</div>
                    <div className="text-gray-300">
                      aruvi.checkout(&#123; productId: 0 &#125;);
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">Ready in 5 minutes ⚡</span>
                    <span className="text-pink-400">100% Private 🔒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Private Payments?
          </h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join the future of confidential transactions on Zama blockchain
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/checkout">
              <Button className="bg-white text-pink-500 hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
                <Send className="w-5 h-5 mr-2" />
                Send Money Now
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold">
                <Store className="w-5 h-5 mr-2" />
                Become a Merchant
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
