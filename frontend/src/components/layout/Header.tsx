import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Menu, X, ChevronDown, Shield, ArrowRight, Send, Wallet, Activity, Receipt, LayoutDashboard, HeadphonesIcon, Rocket, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Mega menu data structure
const DOCS_URL = import.meta.env.VITE_DOCS_URL || 'https://aruvi-documentation.vercel.app';

const megaMenus = {
  personal: {
    title: 'Aruvi Personal',
    sections: [
      {
        title: 'Send & Receive',
        icon: Send,
        links: [
          { name: 'Send Money', href: '/send', description: 'Transfer funds instantly' },
          { name: 'Direct Transfer', href: '/direct-transfer', description: 'Simple P2P transfer (advanced)' },
          { name: 'Request Money', href: '/request', description: 'Request payments from anyone' },
          { name: 'Activity', href: '/activity', description: 'View transaction history' },
        ],
      },
      {
        title: 'Manage',
        icon: Wallet,
        links: [
          { name: 'Wallet', href: '/wallet', description: 'View your balance' },
          { name: 'Transaction History', href: '/activity', description: 'All your transactions' },
          { name: 'Subscriptions', href: '/subscriptions', description: 'Recurring payments' },
          { name: 'Refunds', href: '/refunds', description: 'Issue refunds' },
        ],
      },
    ],
    quickActions: [
      { name: 'Send Money', href: '/send', icon: Send, color: 'bg-paypal-navy' },
      { name: 'View Wallet', href: '/wallet', icon: Wallet, color: 'bg-paypal-blue' },
      { name: 'Activity', href: '/activity', icon: Activity, color: 'bg-paypal-navy' },
    ],
  },
  business: {
    title: 'Aruvi for Business',
    sections: [
      {
        title: 'Accept Payments',
        icon: Receipt,
        links: [
          { name: 'Payment Links', href: '/business/links', description: 'Create shareable payment links' },
          { name: 'QR Codes', href: '/business/links', description: 'Accept payments via QR' },
          { name: 'Checkout Integration', href: '/business/links', description: 'Add to your website' },
        ],
      },
      {
        title: 'Business Operations',
        icon: LayoutDashboard,
        links: [
          { name: 'Dashboard', href: '/business', description: 'Overview of your business' },
          { name: 'Analytics', href: '/business', description: 'Track your performance' },
          { name: 'Reporting Tools', href: '/business', description: 'Generate reports' },
        ],
      },
      {
        title: 'Resources',
        icon: Activity,
        links: [
          { name: 'Help Center', href: `${DOCS_URL}/docs/faq`, description: 'Get support', external: true },
          { name: 'Documentation', href: `${DOCS_URL}/docs/intro`, description: 'API and guides', external: true },
        ],
      },
    ],
    quickActions: [
      { name: 'Contact Support', href: `${DOCS_URL}/docs/faq`, icon: HeadphonesIcon, color: 'bg-paypal-navy', external: true },
      { name: 'Get Started', href: '/business/links/new', icon: Rocket, color: 'bg-paypal-blue' },
      { name: 'Pricing', href: `${DOCS_URL}/docs/faq#is-it-free-to-use`, icon: CreditCard, color: 'bg-paypal-navy', external: true },
    ],
  },
};

export function Header() {
  const location = useLocation();
  const { isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isActive = (href: string) => location.pathname === href;

  const dropdownVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.2, ease: 'easeOut' as const }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.98,
      transition: { duration: 0.15 }
    },
  };

  const renderMegaMenu = (menuKey: 'personal' | 'business') => {
    const menu = megaMenus[menuKey];
    
    return (
      <motion.div
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{ width: menuKey === 'business' ? '800px' : '650px' }}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100">
          <Link 
            to={menuKey === 'business' ? '/business' : '/wallet'} 
            className="inline-flex items-center gap-2 text-xl font-semibold text-paypal-navy hover:text-paypal-blue transition-colors group"
          >
            {menu.title}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex">
          {/* Main Content - Sections */}
          <div className="flex-1 p-6">
            <div className={cn(
              "grid gap-8",
              menuKey === 'business' ? 'grid-cols-3' : 'grid-cols-2'
            )}>
              {menu.sections.map((section) => (
                <div key={section.title}>
                  {/* Section Header */}
                  <Link
                    to={section.links[0]?.href || '#'}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-paypal-navy hover:text-paypal-blue transition-colors group mb-4"
                  >
                    {section.title}
                    <ArrowRight className="w-4 h-4 text-paypal-blue opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                  
                  {/* Section Links */}
                  <div className="space-y-1">
                    {section.links.map((link) => (
                      'external' in link && link.external ? (
                        <a
                          key={link.name}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block py-2 text-sm text-gray-600 hover:text-paypal-blue transition-colors"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          key={link.name}
                          to={link.href}
                          className={cn(
                            'block py-2 text-sm transition-colors',
                            isActive(link.href)
                              ? 'text-paypal-blue font-medium'
                              : 'text-gray-600 hover:text-paypal-blue'
                          )}
                        >
                          {link.name}
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="w-64 bg-gray-50 p-6 border-l border-gray-100">
            <div className="space-y-3">
              {menu.quickActions.map((action) => (
                'external' in action && action.external ? (
                  <a
                    key={action.name}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all group border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-paypal-navy text-sm">{action.name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-paypal-blue opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </a>
                ) : (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all group border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-paypal-navy text-sm">{action.name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-paypal-blue opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-paypal-blue rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-paypal-blue">ARUVI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isConnected && (
              <>
                {/* Personal Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setActiveDropdown('personal')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button 
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-2.5 text-base font-medium rounded-lg transition-colors",
                      activeDropdown === 'personal' 
                        ? 'text-paypal-blue bg-paypal-navy/10' 
                        : 'text-gray-700 hover:text-paypal-blue hover:bg-gray-50'
                    )}
                  >
                    Personal
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      activeDropdown === 'personal' && 'rotate-180'
                    )} />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'personal' && renderMegaMenu('personal')}
                  </AnimatePresence>
                </div>

                {/* Business Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setActiveDropdown('business')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button 
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-2.5 text-base font-medium rounded-lg transition-colors",
                      activeDropdown === 'business' 
                        ? 'text-paypal-blue bg-paypal-navy/10' 
                        : 'text-gray-700 hover:text-paypal-blue hover:bg-gray-50'
                    )}
                  >
                    Business
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      activeDropdown === 'business' && 'rotate-180'
                    )} />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'business' && renderMegaMenu('business')}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Right side - Connect Button */}
          <div className="flex items-center gap-4">
            {!isConnected ? (
              <div className="hidden sm:flex items-center gap-3">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <>
                      <Button variant="outline" size="sm" onClick={openConnectModal}>
                        Log In
                      </Button>
                      <Button variant="primary" size="sm" onClick={openConnectModal}>
                        Sign Up
                      </Button>
                    </>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : (
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
                accountStatus="avatar"
              />
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-gray-100">
                {!isConnected ? (
                  <div className="flex flex-col gap-2">
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <>
                          <Button variant="outline" className="w-full" onClick={openConnectModal}>
                            Log In
                          </Button>
                          <Button variant="primary" className="w-full" onClick={openConnectModal}>
                            Sign Up
                          </Button>
                        </>
                      )}
                    </ConnectButton.Custom>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Personal Section */}
                    <div>
                      <Link 
                        to="/wallet"
                        className="flex items-center gap-2 px-2 text-lg font-semibold text-paypal-navy mb-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Aruvi Personal
                        <ArrowRight className="w-4 h-4 text-paypal-blue" />
                      </Link>
                      {megaMenus.personal.sections.map((section) => (
                        <div key={section.title} className="mb-4">
                          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {section.title}
                          </p>
                          <div className="space-y-1">
                            {section.links.map((link) => (
                              'external' in link && link.external ? (
                                <a
                                  key={link.name}
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-2 text-base rounded-lg text-gray-700 hover:bg-gray-50"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {link.name}
                                </a>
                              ) : (
                                <Link
                                  key={link.name}
                                  to={link.href}
                                  className={cn(
                                    'block px-2 py-2 text-base rounded-lg',
                                    isActive(link.href)
                                      ? 'text-paypal-blue bg-paypal-navy/10 font-medium'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  )}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {link.name}
                                </Link>
                              )
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Business Section */}
                    <div>
                      <Link 
                        to="/business"
                        className="flex items-center gap-2 px-2 text-lg font-semibold text-paypal-navy mb-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Aruvi for Business
                        <ArrowRight className="w-4 h-4 text-paypal-blue" />
                      </Link>
                      {megaMenus.business.sections.map((section) => (
                        <div key={section.title} className="mb-4">
                          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {section.title}
                          </p>
                          <div className="space-y-1">
                            {section.links.map((link) => (
                              'external' in link && link.external ? (
                                <a
                                  key={link.name}
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-2 text-base rounded-lg text-gray-700 hover:bg-gray-50"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {link.name}
                                </a>
                              ) : (
                                <Link
                                  key={link.name}
                                  to={link.href}
                                  className={cn(
                                    'block px-2 py-2 text-base rounded-lg',
                                    isActive(link.href)
                                      ? 'text-paypal-blue bg-paypal-navy/10 font-medium'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  )}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {link.name}
                                </Link>
                              )
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
