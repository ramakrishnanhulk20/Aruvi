import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRef, useState } from 'react';
import { 
  Shield, 
  Lock, 
  Globe, 
  ArrowRight,
  Eye,
  EyeOff,
  Wallet,
  Send,
  QrCode,
  CreditCard,
  Users,
  CheckCircle2,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, TestnetBanner } from '../components/ui';

// Wave SVG Component for section transitions
const WaveDivider = ({ flip = false, color = '#001435' }: { flip?: boolean; color?: string }) => (
  <div className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`}>
    <svg
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      <path
        d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V0H1380C1320 0 1200 0 1080 0C960 0 840 0 720 0C600 0 480 0 360 0C240 0 120 0 60 0H0V120Z"
        fill={color}
      />
    </svg>
  </div>
);

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

// Phone Mockup Component
const PhoneMockup = () => (
  <motion.div
    initial={{ opacity: 0, y: 100 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="relative mx-auto w-[280px] sm:w-[320px]"
  >
    {/* Phone Frame */}
    <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
      {/* Screen */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden">
        {/* Status Bar */}
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-gray-400 rounded-sm" />
            <div className="w-4 h-4 bg-gray-400 rounded-full" />
          </div>
        </div>
        
        {/* App Content */}
        <div className="px-5 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-paypal-navy rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-gray-900">Aruvi</span>
            </div>
            <button className="p-2 bg-gray-100 rounded-full">
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Balance Card */}
          <div className="bg-paypal-navy rounded-2xl p-5 mb-4">
            <p className="text-white/70 text-sm mb-1">Confidential Balance</p>
            <motion.p 
              className="text-3xl font-bold text-white mb-4"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              $•••••
            </motion.p>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <Lock className="w-3 h-3" />
              <span>Encrypted on-chain</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: Send, label: 'Send' },
              { icon: Wallet, label: 'Request' },
              { icon: QrCode, label: 'Scan' }
            ].map((action) => (
              <button key={action.label} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <action.icon className="w-5 h-5 text-paypal-navy" />
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Recent Transaction */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-paypal-blue/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-paypal-blue" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Payment Received</p>
                  <p className="text-gray-500 text-xs">Just now</p>
                </div>
              </div>
              <span className="font-semibold text-paypal-blue text-sm">+$•••</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Home Indicator */}
      <div className="mt-2 mx-auto w-32 h-1 bg-gray-600 rounded-full" />
    </div>
  </motion.div>
);

// Feature Card Component (Horizontal Scroll)
const FeatureCard = ({ title, icon: Icon, index }: { title: string; icon: React.ElementType; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="flex-shrink-0 w-[320px] sm:w-[380px] bg-white rounded-2xl p-8 cursor-pointer group"
  >
    <h3 className="text-2xl font-bold text-paypal-navy mb-24">{title}</h3>
    <div className="flex items-center justify-between">
      <div className="w-12 h-12 bg-paypal-navy/10 rounded-full flex items-center justify-center group-hover:bg-paypal-navy/20 transition-colors">
        <Icon className="w-6 h-6 text-paypal-navy" />
      </div>
      <div className="w-12 h-12 bg-paypal-navy/10 rounded-full flex items-center justify-center group-hover:bg-paypal-navy group-hover:text-white transition-all">
        <ArrowRight className="w-5 h-5 text-paypal-navy group-hover:text-white transition-colors" />
      </div>
    </div>
  </motion.div>
);

// Link Card Component
const LinkCard = ({ title, href }: { title: string; href: string }) => (
  <Link to={href}>
    <motion.div
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between hover:border-paypal-blue hover:shadow-lg transition-all cursor-pointer"
    >
      <span className="font-semibold text-paypal-navy text-lg">{title}</span>
      <div className="w-10 h-10 bg-paypal-navy/10 rounded-full flex items-center justify-center">
        <ArrowRight className="w-5 h-5 text-paypal-navy" />
      </div>
    </motion.div>
  </Link>
);

// Feature Cards Section with Navigation
const FeatureCardsSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    { title: 'Send with complete privacy', icon: EyeOff },
    { title: 'Receive encrypted payments', icon: Shield },
    { title: 'Create payment links', icon: CreditCard },
    { title: 'Self-custody your funds', icon: Lock },
  ];

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      
      // Calculate active card index
      const cardWidth = 380 + 24; // card width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, features.length - 1));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = 380 + 24; // card width + gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative">
      {/* Wave Transition */}
      <WaveDivider color="#001435" />
      
      <div className="bg-paypal-navy py-20 -mt-1">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <div className="flex items-end justify-between mb-16">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-bold text-white max-w-lg"
            >
              Your way to pay,<br />
              with Aruvi
            </motion.h2>
            
            {/* Navigation Arrows - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center transition-all ${
                  canScrollLeft 
                    ? 'hover:bg-white hover:text-paypal-navy text-white cursor-pointer' 
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center transition-all ${
                  canScrollRight 
                    ? 'hover:bg-white hover:text-paypal-navy text-white cursor-pointer' 
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Horizontal Scrolling Cards */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="overflow-x-auto pb-8 scrollbar-hide scroll-smooth"
        >
          <div className="flex gap-6 px-6 sm:px-8 lg:px-12">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} title={feature.title} icon={feature.icon} index={index} />
            ))}
            {/* Spacer for last card visibility */}
            <div className="flex-shrink-0 w-4 sm:w-8 lg:w-12" />
          </div>
        </div>
        
        {/* Scroll Indicators - Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const cardWidth = 380 + 24;
                  scrollContainerRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                }
              }}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
        
        {/* Swipe hint - Mobile */}
        <p className="md:hidden text-center text-white/50 text-sm mt-4">
          Swipe to see more →
        </p>
      </div>
    </section>
  );
};

export function Landing() {
  useAccount();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TestnetBanner />
      <Header />
      
      {/* ============================================
          HERO SECTION - PayPal Style
          ============================================ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-white pt-20">
        <motion.div style={{ opacity: heroOpacity }} className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto mb-12">
            {/* Label */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-paypal-blue font-semibold text-lg mb-6"
            >
              Powered by Zama fhEVM
            </motion.p>
            
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-paypal-navy leading-[1.1] mb-6"
            >
              Pay private,<br />
              fast, and secure.
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              The first PayPal-like experience with true on-chain privacy. 
              Your balance and transactions are encrypted using fully homomorphic encryption.
            </motion.p>
            
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ConnectButton.Custom>
                {({ account, openConnectModal }) => (
                  account ? (
                    <Link to="/dashboard">
                      <Button 
                        size="lg" 
                        className="bg-paypal-blue hover:bg-paypal-dark text-white px-10 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={openConnectModal}
                      className="bg-paypal-blue hover:bg-paypal-dark text-white px-10 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Get the App
                    </Button>
                  )
                )}
              </ConnectButton.Custom>
            </motion.div>
          </div>
          
          {/* Phone Mockup */}
          <motion.div style={{ y: phoneY }} className="relative z-10">
            <PhoneMockup />
          </motion.div>
        </motion.div>
        
        {/* Floating QR Code - Desktop Only */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="hidden lg:block fixed right-8 bottom-24 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 z-50"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
            <QrCode className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-center text-sm font-medium text-gray-700">Get the App</p>
        </motion.div>
      </section>

      {/* ============================================
          FEATURES SECTION - Dark Navy with Horizontal Scroll
          ============================================ */}
      <FeatureCardsSection />

      {/* ============================================
          PRIVACY SHOWCASE SECTION - White Background
          ============================================ */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-[600px] bg-gradient-to-r from-gray-100 to-transparent -z-10" />
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Product Mockup */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInLeft}
              className="relative"
            >
              {/* Mockup Card */}
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md mx-auto">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-paypal-navy rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <Wallet className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image Area */}
                    <div className="w-40 h-40 bg-paypal-navy/5 rounded-2xl flex items-center justify-center">
                      <Shield className="w-16 h-16 text-paypal-navy/30" />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">Private Payment</h4>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4].map((i) => (
                          <span key={i} className="text-paypal-navy text-sm">★</span>
                        ))}
                        <span className="text-gray-300 text-sm">★</span>
                      </div>
                      <motion.p 
                        className="text-2xl font-bold text-gray-900 mb-4"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        $•••.••
                      </motion.p>
                      
                      <p className="text-sm text-gray-500 mb-3">Status:</p>
                      <div className="flex gap-2">
                        <span className="w-6 h-6 bg-paypal-navy rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </span>
                        <span className="w-6 h-6 bg-paypal-navy/20 rounded-full" />
                        <span className="w-6 h-6 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Pay Button */}
                  <button className="w-full mt-6 bg-paypal-blue text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-paypal-dark transition-colors">
                    <span className="text-xl font-bold">A</span>
                    <span>Pay with Aruvi</span>
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Right - Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-paypal-blue mb-6">
                Simplified private checkout
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Pay with your Aruvi account at any participating merchant. Rest easy knowing 
                your transaction amounts are encrypted and your privacy is protected.
              </p>
              <ConnectButton.Custom>
                {({ account, openConnectModal }) => (
                  account ? (
                    <Link to="/dashboard">
                      <Button className="bg-paypal-blue hover:bg-paypal-dark text-white px-8 py-4 rounded-full font-semibold">
                        Check Out With Aruvi
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={openConnectModal}
                      className="bg-paypal-blue hover:bg-paypal-dark text-white px-8 py-4 rounded-full font-semibold"
                    >
                      Check Out With Aruvi
                    </Button>
                  )
                )}
              </ConnectButton.Custom>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          SEND PAYMENTS SECTION - Blue Background
          ============================================ */}
      <section className="relative">
        {/* Wave Transition */}
        <WaveDivider color="#003087" />
        
        <div className="bg-paypal-blue py-24 -mt-1">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Floating Avatars */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInLeft}
                className="relative h-[400px]"
              >
                {/* Central Payment Card */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl z-10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-paypal-navy rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div className="w-8 h-8 bg-paypal-navy rounded-full flex items-center justify-center -ml-4">
                      <span className="text-white text-xs">+$</span>
                    </div>
                  </div>
                  <motion.p 
                    className="text-3xl font-bold text-gray-900 mb-1"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    $•••.••
                  </motion.p>
                  <p className="text-gray-500 text-sm">Private payment</p>
                  <p className="text-paypal-navy font-semibold text-sm">Encrypted</p>
                </motion.div>
                
                {/* Floating Avatars */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-16 top-8"
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                    <Users className="w-12 h-12 text-paypal-navy/40" />
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute left-8 bottom-16"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                    <Smartphone className="w-10 h-10 text-paypal-navy/40" />
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute right-16 bottom-8"
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                    <Globe className="w-12 h-12 text-paypal-navy/40" />
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Right - Content */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInRight}
              >
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Send payments<br />your way
                </h2>
                <p className="text-xl text-white/90 mb-8 leading-relaxed">
                  You can pay for goods and services privately, from shopping at online stores 
                  to paying individuals for projects. All transaction amounts stay encrypted.
                </p>
                <ConnectButton.Custom>
                {({ account, openConnectModal }) => (
                  account ? (
                    <Link to="/send">
                      <Button className="bg-white hover:bg-white/90 text-paypal-navy px-8 py-4 rounded-full font-semibold border-2 border-white">
                        Send Payments Securely
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={openConnectModal}
                      className="bg-white hover:bg-white/90 text-paypal-navy px-8 py-4 rounded-full font-semibold border-2 border-white"
                    >
                      Send Payments Securely
                    </Button>
                  )
                )}
              </ConnectButton.Custom>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <WaveDivider flip color="#003087" />
      </section>

      {/* ============================================
          HOW IT WORKS - Steps Section
          ============================================ */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-bold text-paypal-navy mb-6"
            >
              It's easy to begin
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600"
            >
              Start using Aruvi in a few simple steps.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                step: '01',
                title: 'Connect your wallet',
                description: 'Connect MetaMask or any Web3 wallet. Select your account and approve the connection.',
              },
              {
                step: '02',
                title: 'Wrap your tokens',
                description: 'Convert public USDC to confidential cUSDC. Your balance becomes fully encrypted.',
              },
              {
                step: '03',
                title: 'Start transacting',
                description: 'Send, receive, or create payment links. All amounts stay private and secure.',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="text-6xl font-bold text-paypal-blue/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold text-paypal-navy mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================
          ZERO FEES SECTION
          ============================================ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-paypal-navy mb-12">Zero platform fees</h2>
            
            <div className="grid sm:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 rounded-2xl p-8">
                <p className="text-5xl font-bold text-paypal-blue mb-2">$0</p>
                <p className="text-gray-600">Account opening fees</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8">
                <p className="text-5xl font-bold text-paypal-blue mb-2">$0</p>
                <p className="text-gray-600">Subscription fees</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              *Pay only minimal network gas costs. <Link to="#" className="text-paypal-blue hover:underline">Learn more about fees</Link>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          DISCOVER MORE SECTION - Link Cards
          ============================================ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-3xl sm:text-4xl font-bold text-paypal-navy mb-12 text-center"
          >
            Discover even more ways to use Aruvi
          </motion.h2>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 gap-4"
          >
            <motion.div variants={fadeInUp}>
              <LinkCard title="The Aruvi App" href="/dashboard" />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <LinkCard title="How Aruvi Works" href="#how-it-works" />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <LinkCard title="Send and Receive" href="/send" />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <LinkCard title="Direct Transfer" href="/direct-transfer" />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <LinkCard title="Business Payments" href="/business" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA SECTION
          ============================================ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-paypal-navy mb-4">
              We support users
            </motion.h2>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-paypal-blue mb-8">
              just like you
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Everyone deserves financial privacy. From secure payment processing to complete transaction encryption, we're here for you.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <ConnectButton.Custom>
                {({ account, openConnectModal }) => (
                  account ? (
                    <Link to="/dashboard">
                      <Button className="bg-paypal-blue hover:bg-paypal-dark text-white px-10 py-4 rounded-full font-semibold text-lg">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={openConnectModal}
                      className="bg-paypal-blue hover:bg-paypal-dark text-white px-10 py-4 rounded-full font-semibold text-lg"
                    >
                      Sign Up
                    </Button>
                  )
                )}
              </ConnectButton.Custom>
              <Link to="/business">
                <Button variant="outline" className="border-2 border-paypal-blue text-paypal-blue hover:bg-paypal-blue hover:text-white px-10 py-4 rounded-full font-semibold text-lg">
                  Business Solutions
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
