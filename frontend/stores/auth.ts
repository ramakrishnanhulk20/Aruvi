import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  address: string | null;
  isAuthenticated: boolean;
  merchantId: string | null;
  
  // Actions
  setAuth: (token: string, address: string, merchantId?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      address: null,
      isAuthenticated: false,
      merchantId: null,

      setAuth: (token, address, merchantId) => {
        set({
          token,
          address,
          isAuthenticated: true,
          merchantId: merchantId || null,
        });
      },

      clearAuth: () => {
        set({
          token: null,
          address: null,
          isAuthenticated: false,
          merchantId: null,
        });
      },
    }),
    {
      name: "aruvi-auth",
      partialize: (state) => ({
        token: state.token,
        address: state.address,
        merchantId: state.merchantId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
