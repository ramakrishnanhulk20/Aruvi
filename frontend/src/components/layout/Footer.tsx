import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-paypal-navy text-white">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-paypal-navy" />
              </div>
              <span className="text-xl font-bold">ARUVI</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Private payments for Web3. Built on Zama's fhEVM with Fully Homomorphic Encryption.
            </p>
          </div>

          {/* Personal */}
          <div>
            <h3 className="font-semibold text-base mb-5">Personal</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/send" className="hover:text-white transition-colors">
                  Send Money
                </Link>
              </li>
              <li>
                <Link to="/request" className="hover:text-white transition-colors">
                  Request Money
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-white transition-colors">
                  Wallet
                </Link>
              </li>
              <li>
                <Link to="/activity" className="hover:text-white transition-colors">
                  Activity
                </Link>
              </li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h3 className="font-semibold text-base mb-5">Business</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/business" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/business" className="hover:text-white transition-colors">
                  Payment Links
                </Link>
              </li>
              <li>
                <Link to="/business" className="hover:text-white transition-colors">
                  Accept Payments
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-base mb-5">Resources</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a
                  href="https://docs.zama.ai/fhevm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  About fhEVM
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Block Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} Aruvi. Built for Zama fhEVM showcase.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Sepolia Testnet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
