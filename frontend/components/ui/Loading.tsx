"use client";

import { cn } from "@/lib/utils";

// Skeleton loader with shimmer effect
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-none",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-dark-200 dark:bg-dark-700",
        "shimmer",
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

// Spinner
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin border-2 border-current border-t-transparent rounded-full",
        sizes[size],
        className
      )}
    />
  );
}

// Loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            {/* Pixel loading animation */}
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-pink-500"
                  style={{
                    animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
            <p className="font-pixel text-[10px] uppercase tracking-wider text-dark-500">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Progress bar
interface ProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function Progress({
  value,
  max = 100,
  showValue = false,
  className,
  variant = "default",
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors = {
    default: "bg-pink-500",
    success: "bg-green-500",
    warning: "bg-accent-500",
    danger: "bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="h-4 bg-dark-200 dark:bg-dark-700 border-2 border-black dark:border-white overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <p className="mt-1 font-mono text-xs text-right text-dark-500">
          {percentage.toFixed(0)}%
        </p>
      )}
    </div>
  );
}

// Step indicator
interface Step {
  label: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center border-2 border-black dark:border-white font-pixel text-xs",
                  isComplete && "bg-pink-500 text-white",
                  isActive && "bg-accent-500 text-dark-900",
                  !isComplete && !isActive && "bg-dark-100 dark:bg-dark-700"
                )}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <p
                className={cn(
                  "mt-2 font-pixel text-[8px] uppercase tracking-wider text-center max-w-[80px]",
                  isActive ? "text-pink-500" : "text-dark-500"
                )}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2",
                  isComplete ? "bg-pink-500" : "bg-dark-200 dark:bg-dark-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
