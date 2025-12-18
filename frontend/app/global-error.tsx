"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Global error boundary for the App Router.
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Capture on mount to ensure the error is reported once.
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-300">We have logged the error. You can retry the last action.</p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded border border-white px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
