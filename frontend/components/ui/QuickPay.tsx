'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Zap, Lock, Check } from 'lucide-react';
import { Button } from './Button';
import toast from 'react-hot-toast';

interface QuickPayButtonProps {
  productId: number;
  merchantAddress: `0x${string}`;
  productName?: string;
  maxAutoApprove?: number; // Max amount to auto-approve (e.g., $10)
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * UPI-like Quick Pay Button
 * One-click payment with optional auto-approval for small amounts
 */
export function QuickPayButton({
  productId,
  merchantAddress,
  productName = 'Product',
  maxAutoApprove = 10,
  onSuccess,
  onError,
  className = '',
}: QuickPayButtonProps) {
  const { isConnected, address } = useAccount();
  const [isPaying, setIsPaying] = useState(false);

  const handleQuickPay = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsPaying(true);

    try {
      // Create session
      const sessionResponse = await fetch('/api/payment/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantAddress,
          productId,
          orderId: `QUICK-${Date.now()}`,
          type: 'product',
          metadata: { quickPay: true }
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create payment session');
      }

      const { sessionId, checkoutUrl } = await sessionResponse.json();

      // Redirect to checkout (will decrypt price client-side)
      const finalUrl = new URL(checkoutUrl, window.location.origin);
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set('aruvi_payment', 'complete');
      returnUrl.searchParams.set('quickPay', 'true');
      finalUrl.searchParams.set('returnUrl', encodeURIComponent(returnUrl.toString()));
      
      window.location.href = finalUrl.toString();
    } catch (error: any) {
      console.error('Quick pay error:', error);
      toast.error(error.message || 'Payment failed');
      if (onError) onError(error);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Button
      onClick={handleQuickPay}
      disabled={isPaying || !isConnected}
      className={`
        group relative overflow-hidden
        bg-gradient-to-r from-pink-500 to-rose-500
        hover:from-pink-600 hover:to-rose-600
        text-white font-semibold
        shadow-lg hover:shadow-xl
        transition-all duration-200
        ${className}
      `}
    >
      {isPaying ? (
        <>
          <div className="animate-spin mr-2">⚡</div>
          Processing...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 mr-2 inline-block" />
          <Lock className="w-3 h-3 mr-1 inline-block opacity-70" />
          Quick Pay
          <span className="ml-2 text-xs opacity-80">🔒</span>
        </>
      )}
      
      {/* Privacy indicator */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </Button>
  );
}

/**
 * Quick Pay Settings Panel
 * Let users configure auto-approval limits
 */
export function QuickPaySettings() {
  const [maxAmount, setMaxAmount] = useState(10);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('aruvi_quick_pay_max', maxAmount.toString());
    localStorage.setItem('aruvi_quick_pay_biometric', biometricEnabled.toString());
    toast.success('Quick Pay settings saved');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-pink-500" />
        <h3 className="text-lg font-semibold text-white">Quick Pay Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Auto-approve up to:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="100"
              value={maxAmount}
              onChange={(e) => setMaxAmount(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white font-semibold min-w-[4rem] text-right">
              ${maxAmount}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Payments above this amount will require confirmation
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-white">Biometric Auth</p>
            <p className="text-xs text-gray-400">Use fingerprint/Face ID</p>
          </div>
          <button
            onClick={() => setBiometricEnabled(!biometricEnabled)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full
              transition-colors duration-200
              ${biometricEnabled ? 'bg-pink-500' : 'bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white
                transition-transform duration-200
                ${biometricEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Check className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
