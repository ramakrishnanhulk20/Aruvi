"use client";

import { cn } from "@/lib/utils";

// Badge component
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[8px]",
    md: "px-2 py-1 text-[10px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-pixel uppercase tracking-wider",
        "border border-current",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status indicator dot
interface StatusDotProps {
  status: "online" | "offline" | "pending" | "error";
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  const colors = {
    online: "bg-green-500",
    offline: "bg-dark-400",
    pending: "bg-accent-500 animate-pulse",
    error: "bg-red-500",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", colors[status])} />
      {label && (
        <span className="font-mono text-xs text-dark-500 dark:text-dark-400">
          {label}
        </span>
      )}
    </div>
  );
}

// Tooltip
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("relative group inline-block", className)}>
      {children}
      <div
        className={cn(
          "absolute z-50 px-2 py-1 opacity-0 invisible",
          "group-hover:opacity-100 group-hover:visible",
          "transition-all duration-150",
          "bg-dark-900 text-white dark:bg-white dark:text-dark-900",
          "font-mono text-xs whitespace-nowrap",
          "border border-dark-700 dark:border-dark-300",
          positions[position]
        )}
      >
        {content}
      </div>
    </div>
  );
}

// Divider
interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="flex-1 h-0.5 bg-dark-200 dark:bg-dark-700" />
        <span className="font-pixel text-[8px] uppercase tracking-wider text-dark-500">
          {label}
        </span>
        <div className="flex-1 h-0.5 bg-dark-200 dark:bg-dark-700" />
      </div>
    );
  }

  return (
    <div
      className={cn("h-0.5 bg-dark-200 dark:bg-dark-700 w-full", className)}
    />
  );
}

// Empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-dark-300 dark:text-dark-600">{icon}</div>
      )}
      <h3 className="font-pixel text-sm uppercase tracking-wider mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-sans text-sm text-dark-500 dark:text-dark-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// Copy button
interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors",
        className
      )}
      title="Copy to clipboard"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
        />
      </svg>
    </button>
  );
}
