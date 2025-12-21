import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function TestnetBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm font-medium">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Testnet Demo</strong> — This is a showcase of privacy-preserving payments using{' '}
          <a 
            href="https://www.zama.ai/fhevm" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            Zama's fhEVM
          </a>
          . Not real money.
        </span>
        <button 
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
