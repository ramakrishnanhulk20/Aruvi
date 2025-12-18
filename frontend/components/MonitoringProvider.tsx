"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { initSentry, identifyUser, trackPageView, monitoring } from "@/lib/monitoring";

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const pathname = usePathname();

  // Initialize monitoring systems once
  useEffect(() => {
    if (typeof window !== "undefined") {
      initSentry();
      
      if (monitoring.sentry) {
        console.info("🔍 Monitoring initialized:", {
          sentry: monitoring.sentry,
          environment: process.env.NODE_ENV,
        });
      }
    }
  }, []);

  // Identify user when wallet connects
  useEffect(() => {
    if (address) {
      identifyUser(address, {
        connectedAt: new Date().toISOString(),
      });
    }
  }, [address]);

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname, {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      });
    }
  }, [pathname]);

  return <>{children}</>;
}
