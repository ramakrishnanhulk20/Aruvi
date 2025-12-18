"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth";

const AUTH_MESSAGE = "Sign this message to authenticate with Aruvi";

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const login = useCallback(async () => {
    if (!address) {
      toast.error("Please connect wallet first");
      return null;
    }

    setIsAuthenticating(true);
    const toastId = toast.loading("Authenticating...");

    try {
      const timestamp = Date.now().toString();
      const message = `${AUTH_MESSAGE}\n\nTimestamp: ${timestamp}`;

      // Request signature
      toast.loading("Waiting for signature...", { id: toastId });
      const signature = await signMessageAsync({ message });

      // Send to API with timeout
      toast.loading("Verifying signature...", { id: toastId });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, timestamp }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Authentication failed");
      }

      const { token } = await response.json();
      setAuth(token, address);

      toast.success("Authenticated successfully!", { id: toastId });
      return token;
    } catch (error: unknown) {
      const err = error as Error & { name?: string; message?: string };
      console.error("[Auth] Login failed:", err);
      
      if (err.name === 'AbortError') {
        toast.error("Authentication timed out. Please try again.", { id: toastId });
      } else if (err.message?.includes('User rejected')) {
        toast.error("Signature rejected", { id: toastId });
      } else {
        toast.error(err.message || "Authentication failed", { id: toastId });
      }
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessageAsync, setAuth]);

  const logout = useCallback(async () => {
    // Clear cookie via API
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("[Auth] Logout API failed:", error);
    }
    
    // Clear local state
    clearAuth();
    toast.success("Logged out");
    
    // Redirect to home
    window.location.href = "/";
  }, [clearAuth]);

  const verifyToken = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch("/api/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [token, clearAuth]);

  return {
    token,
    isAuthenticated,
    isAuthenticating,
    login,
    logout,
    verifyToken,
  };
}
