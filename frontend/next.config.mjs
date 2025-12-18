import { withSentryConfig } from "@sentry/nextjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, 
      net: false, 
      tls: false 
    };

    // Web-only build of MetaMask SDK expects async-storage; provide a shim.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'lib/asyncStorageShim'
      ),
    };

    // Keep native FHE dependencies external so their accompanying WASM files
    // (e.g. tfhe_bg.wasm from node-tfhe) are loaded from node_modules at
    // runtime instead of being bundled without the asset.
    if (isServer) {
      config.externals.push("node-tfhe", "node-tkms");
    }

    config.externals.push("pino-pretty", "lokijs", "encoding");

    return config;
  },
};

// Sentry configuration options
const sentryOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  reactComponentAnnotation: {
    enabled: true,
  },
};

// Only apply Sentry config if DSN is set
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;

export default config;

