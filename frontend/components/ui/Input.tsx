"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block font-pixel text-[10px] uppercase tracking-wider text-dark-700 dark:text-dark-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            className={cn(
              "w-full px-4 py-3 font-mono text-sm",
              "bg-white dark:bg-dark-800",
              "border-2 border-black dark:border-white",
              "focus:outline-none focus:ring-2 focus:ring-pink-500",
              "placeholder:text-gray-400 dark:placeholder:text-gray-600",
              "transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-pixel text-[8px] text-red-500"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="font-mono text-xs text-dark-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Amount Input with currency formatting
interface AmountInputProps extends Omit<InputProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  decimals?: number;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, currency = "USD", decimals = 2, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Allow only numbers and one decimal point
      const cleaned = input.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = cleaned.split(".");
      if (parts.length > 2) return;
      // Limit decimal places
      if (parts[1]?.length > decimals) return;
      onChange(cleaned);
    };

    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-pixel text-sm text-dark-500">
          $
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          className={cn("pl-8 pr-20 text-right font-mono text-lg", className)}
          {...props}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-pixel text-[10px] text-dark-500 pointer-events-none">
          {currency}
        </span>
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";
