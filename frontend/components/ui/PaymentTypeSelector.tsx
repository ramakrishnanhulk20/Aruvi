"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Repeat, Heart, Users } from "lucide-react";

export enum PaymentType {
  P2P = 3,
  PRODUCT = 0,
  SUBSCRIPTION = 1,
  DONATION = 2,
}

interface PaymentTypeSelectorProps {
  value: PaymentType;
  onChange: (type: PaymentType) => void;
  disabled?: boolean;
}

const paymentTypes = [
  {
    type: PaymentType.P2P,
    label: "P2P Transfer",
    description: "Send to any address",
    icon: Users,
    color: "pink",
  },
  {
    type: PaymentType.PRODUCT,
    label: "Product",
    description: "Buy a product",
    icon: ShoppingBag,
    color: "blue",
  },
  {
    type: PaymentType.SUBSCRIPTION,
    label: "Subscription",
    description: "Recurring payment",
    icon: Repeat,
    color: "purple",
  },
  {
    type: PaymentType.DONATION,
    label: "Donation",
    description: "Support a cause",
    icon: Heart,
    color: "red",
  },
];

export function PaymentTypeSelector({
  value,
  onChange,
  disabled = false,
}: PaymentTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {paymentTypes.map(({ type, label, description, icon: Icon, color }) => {
        const isSelected = value === type;
        return (
          <motion.button
            key={type}
            type="button"
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            className={`
              relative p-4 border-2 text-left transition-all
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${
                isSelected
                  ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                  : "border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-dark-300 dark:hover:border-dark-600"
              }
            `}
          >
            {isSelected && (
              <motion.div
                layoutId="payment-type-indicator"
                className="absolute inset-0 border-2 border-pink-500"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-start gap-3">
              <div
                className={`
                p-2 rounded-lg
                ${
                  isSelected
                    ? "bg-pink-500 text-white"
                    : "bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400"
                }
              `}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-pixel text-[10px] uppercase tracking-wider ${
                    isSelected
                      ? "text-pink-700 dark:text-pink-300"
                      : "text-dark-700 dark:text-dark-200"
                  }`}
                >
                  {label}
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5 truncate">
                  {description}
                </p>
              </div>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export function PaymentTypeBadge({ type }: { type: PaymentType }) {
  const config = paymentTypes.find((p) => p.type === type);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 text-xs font-medium rounded">
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
