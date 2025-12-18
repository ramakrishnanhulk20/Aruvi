"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-accent-500" />
        </motion.div>

        <h1
          className="font-pixel text-4xl md:text-6xl uppercase tracking-wider mb-4 glitch"
          data-text="404"
        >
          404
        </h1>

        <p className="font-pixel text-sm uppercase tracking-wider mb-2 text-pink-500">
          Page Not Found
        </p>

        <p className="font-sans text-dark-500 dark:text-dark-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button variant="primary" glitch>
            <Home className="w-4 h-4 mr-2" />
            Back Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
