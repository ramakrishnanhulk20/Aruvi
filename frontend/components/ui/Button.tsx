"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  glitch?: boolean;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-pink-500 text-white border-black dark:border-white
    hover:bg-pink-400 hover:shadow-glow
    active:bg-pink-600
  `,
  secondary: `
    bg-accent-500 text-dark-900 border-black dark:border-dark-900
    hover:bg-accent-400 hover:shadow-glow-yellow
    active:bg-accent-600
  `,
  outline: `
    bg-transparent border-pink-500 text-pink-500
    hover:bg-pink-500 hover:text-white
    dark:border-pink-400 dark:text-pink-400
    dark:hover:bg-pink-500 dark:hover:text-white
  `,
  ghost: `
    bg-transparent border-transparent text-pink-500
    hover:bg-pink-100 dark:hover:bg-pink-900/30
    active:bg-pink-200 dark:active:bg-pink-900/50
  `,
  danger: `
    bg-red-500 text-white border-black dark:border-white
    hover:bg-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]
    active:bg-red-600
  `,
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[8px]",
  md: "px-5 py-2.5 text-[10px]",
  lg: "px-8 py-4 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      glitch = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98, x: 2, y: 2 }}
        transition={{ duration: 0.1 }}
        className={cn(
          // Base styles
          "relative font-pixel uppercase tracking-wider",
          "border-2 transition-all duration-150",
          "shadow-pixel active:shadow-none",
          "active:translate-x-1 active:translate-y-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "disabled:active:translate-x-0 disabled:active:translate-y-0",
          "disabled:active:shadow-pixel",
          "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
          "dark:focus:ring-offset-dark-900",
          // Variant styles
          variants[variant],
          // Size styles
          sizes[size],
          // Glitch effect
          glitch && "glitch",
          className
        )}
        disabled={isDisabled}
        data-text={glitch ? children?.toString() : undefined}
        {...(props as any)}
      >
        <span className={cn("flex items-center justify-center gap-2", isLoading && "opacity-0")}>
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// Icon Button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", isLoading, children, ...props }, ref) => {
    const iconSizes: Record<ButtonSize, string> = {
      sm: "p-1.5",
      md: "p-2",
      lg: "p-3",
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(iconSizes[size], "aspect-square", className)}
        isLoading={isLoading}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
