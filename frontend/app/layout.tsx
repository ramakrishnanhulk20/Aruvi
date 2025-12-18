import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "@/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MonitoringProvider } from "@/components/MonitoringProvider";
import { HelpButton, FirstTimeOnboarding } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aruvi - Private Crypto Payments",
  description:
    "Stripe for confidential tokens. Accept private cryptocurrency payments on any website with Aruvi.",
  keywords: [
    "crypto payments",
    "confidential tokens",
    "FHEVM",
    "privacy",
    "blockchain",
    "payment gateway",
  ],
  authors: [{ name: "Aruvi" }],
  openGraph: {
    title: "Aruvi - Private Crypto Payments",
    description: "Stripe for confidential tokens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muthirai",
    description: "Stripe for confidential tokens",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        {/* FHEVM Relayer SDK - must load before React hydration */}
        <Script
          src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
          strategy="beforeInteractive"
        />
        <ErrorBoundary>
          <Providers>
            <MonitoringProvider>
              <Header />
              <main className="flex-1 pb-20 sm:pb-0">{children}</main>
              <Footer />
              {/* FHE Help System */}
              <HelpButton />
              <FirstTimeOnboarding />
            </MonitoringProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
