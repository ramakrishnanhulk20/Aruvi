"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
  hover?: boolean;
  glow?: boolean;
}

const cardVariants = {
  default: "bg-white dark:bg-dark-800 border-2 border-black dark:border-white shadow-pixel",
  elevated: "bg-white dark:bg-dark-800 border-2 border-black dark:border-white shadow-pixel-lg",
  outlined: "bg-transparent border-2 border-pink-500 dark:border-pink-400",
  glass: "bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-pink-200 dark:border-pink-800",
};

export function Card({
  children,
  className,
  variant = "default",
  hover = false,
  glow = false,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "8px 8px 0 0 rgba(0,0,0,0.2)" } : {}}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-none",
        cardVariants[variant],
        glow && "hover:shadow-glow",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Card Header
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-b-2 border-black dark:border-white",
        className
      )}
    >
      {children}
    </div>
  );
}

// Card Title
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  glitch?: boolean;
}

export function CardTitle({ children, className, glitch }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-pixel text-sm uppercase tracking-wider",
        glitch && "glitch",
        className
      )}
      data-text={glitch ? children?.toString() : undefined}
    >
      {children}
    </h3>
  );
}

// Card Description
interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("font-sans text-sm text-dark-500 dark:text-dark-400 mt-1", className)}>
      {children}
    </p>
  );
}

// Card Content
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

// Card Footer
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t-2 border-black dark:border-white bg-dark-50 dark:bg-dark-900",
        className
      )}
    >
      {children}
    </div>
  );
}

// Stat Card (for dashboard)
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-dark-500",
  };

  return (
    <Card className={cn("p-6", className)} hover>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="font-pixel text-[8px] uppercase tracking-wider text-dark-500 dark:text-dark-400">
            {title}
          </p>
          <p className="font-mono text-2xl font-bold">{value}</p>
          {(subtitle || trendValue) && (
            <div className="flex items-center gap-2">
              {trendValue && trend && (
                <span className={cn("font-mono text-xs", trendColors[trend])}>
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="font-sans text-xs text-dark-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-500">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
