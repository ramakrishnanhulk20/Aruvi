import * as Sentry from "@sentry/nextjs";

// Configuration flags
const isProduction = process.env.NODE_ENV === "production";
const isSentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  if (!isSentryEnabled) {
    console.info("Sentry monitoring disabled (no DSN configured)");
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: isProduction,

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Note: Integrations are automatically configured by @sentry/nextjs

    // Filtering
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "ResizeObserver loop",
      // Network errors
      "NetworkError",
      "Failed to fetch",
      // Wallet connection errors (expected)
      "User rejected",
      "user rejected transaction",
      "MetaMask Tx Signature",
    ],

    beforeSend(event, hint) {
      // Filter out low-priority errors in production
      if (isProduction && event.level === "warning") {
        return null;
      }

      // Add custom context
      if (event.user) {
        event.user.ip_address = "{{auto}}"; // Use Sentry's IP detection
      }

      return event;
    },
  });

  console.info("Sentry initialized successfully");
}

/**
 * LogRocket removed due to React 18 compatibility issues
 * Use Sentry Session Replay instead for session recording
 */
export function initLogRocket() {
  // Removed - LogRocket has compatibility issues with React 18
  // Consider using Sentry Session Replay as alternative
}

/**
 * Identify user in monitoring systems
 */
export function identifyUser(address: string, traits?: Record<string, any>) {
  if (!address) return;

  // Identify in Sentry
  if (isSentryEnabled) {
    Sentry.setUser({
      id: address,
      username: address,
      ...traits,
    });
  }
}

/**
 * Track custom events
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (isSentryEnabled) {
    Sentry.addBreadcrumb({
      category: "custom",
      message: eventName,
      level: "info",
      data: properties,
    });
  }
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, any>) {
  console.error("Captured error:", error, context);

  if (isSentryEnabled) {
    Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  }
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (isSentryEnabled) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Set custom context for monitoring
 */
export function setContext(key: string, value: Record<string, any>) {
  if (isSentryEnabled) {
    Sentry.setContext(key, value);
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  trackEvent("Page View", {
    page: pageName,
    ...properties,
  });
}

/**
 * Track transaction
 */
export function trackTransaction(
  txHash: string,
  type: string,
  properties?: Record<string, any>
) {
  trackEvent("Transaction", {
    txHash,
    type,
    ...properties,
  });
}

// Export monitoring status
export const monitoring = {
  sentry: isSentryEnabled,
  isProduction,
};
