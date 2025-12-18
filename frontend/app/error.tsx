"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <AlertTriangle className="w-20 h-20 mx-auto mb-6 text-red-500" />
        </motion.div>

        <h1
          className="font-pixel text-xl uppercase tracking-wider mb-4 glitch"
          data-text="Error"
        >
          Error
        </h1>

        <p className="font-sans text-dark-500 dark:text-dark-400 mb-4">
          Something went wrong. This might be a temporary issue.
        </p>

        {error.message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-left">
            <p className="font-mono text-xs text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        <Button variant="primary" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    </div>
  );
}
