"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchInterval?: number;
}

export function GlitchText({
  text,
  className = "",
  glitchInterval = 3000,
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, glitchInterval);

    return () => clearInterval(interval);
  }, [glitchInterval]);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className={isGlitching ? "glitch" : ""} data-text={text}>
        {text}
      </span>
    </span>
  );
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
}

export function TypewriterText({
  text,
  className = "",
  speed = 50,
  delay = 0,
  cursor = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  useEffect(() => {
    if (!cursor) return;
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, [cursor]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && (
        <span
          className={`inline-block w-2 h-5 ml-1 bg-pink-500 align-middle ${
            showCursor ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </span>
  );
}

interface PixelRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PixelReveal({
  children,
  className = "",
  delay = 0,
}: PixelRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
      animate={{ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface PixelTransitionProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PixelTransition({
  isVisible,
  children,
  className = "",
}: PixelTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ScanlineOverlayProps {
  opacity?: number;
}

export function ScanlineOverlay({ opacity = 0.03 }: ScanlineOverlayProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, ${opacity}) 2px,
          rgba(0, 0, 0, ${opacity}) 4px
        )`,
      }}
    />
  );
}

interface PixelBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function PixelBorder({
  children,
  className = "",
  color = "pink-500",
}: PixelBorderProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Pixel corners */}
      <div className={`absolute -top-1 -left-1 w-3 h-3 bg-${color}`} />
      <div className={`absolute -top-1 -right-1 w-3 h-3 bg-${color}`} />
      <div className={`absolute -bottom-1 -left-1 w-3 h-3 bg-${color}`} />
      <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-${color}`} />
      {children}
    </div>
  );
}

interface NumberCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function NumberCounter({
  value,
  prefix = "",
  suffix = "",
  className = "",
  duration = 1000,
}: NumberCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
