import * as Sentry from "@sentry/nextjs";

// Next.js instrumentation entrypoint for Sentry (server + edge).
export const register = () => {
  // Avoid initializing on edge if DSN not provided or runtime is edge without Sentry desired.
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  // Skip edge runtime if you prefer not to run Sentry there to avoid Node-only warnings.
  if (process.env.NEXT_RUNTIME === "edge") return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: false,
    integrations: (integrations) => integrations,
  });
};

// Capture server-side request errors (Next.js instrumentation hook)
export const onRequestError = (err: unknown) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureException(err);
};
