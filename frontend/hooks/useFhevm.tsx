"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

// CDN SDK global type
interface FhevmRelayerSDKType {
  initSDK: (options?: unknown) => Promise<boolean>;
  createInstance: (config: unknown) => Promise<RelayerInstance>;
  SepoliaConfig: {
    aclContractAddress: string;
    kmsContractAddress: string;
    gatewayUrl: string;
    [key: string]: unknown;
  };
  __initialized__?: boolean;
}

// Type for RelayerSDK instance
interface RelayerInstance {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string
  ) => EncryptedInputBuilder;
  userDecrypt: (
    handles: { handle: string; contractAddress: string }[],
    signature: string
  ) => Promise<bigint[]>;
  getPublicKey: () => { publicKey: string; publicParams: string };
  getPublicParams: (size: number) => unknown;
}

interface EncryptedInputBuilder {
  add64: (value: bigint) => EncryptedInputBuilder;
  add32: (value: number) => EncryptedInputBuilder;
  add8: (value: number) => EncryptedInputBuilder;
  addBool: (value: boolean) => EncryptedInputBuilder;
  addAddress: (value: string) => EncryptedInputBuilder;
  encrypt: () => Promise<{
    handles: string[];
    inputProof: string;
  }>;
}

// Extend Window type
declare global {
  interface Window {
    relayerSDK?: FhevmRelayerSDKType;
    RelayerSDK?: FhevmRelayerSDKType;
    ethereum?: any;
  }
}

interface FhevmContextType {
  instance: RelayerInstance | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
  status: "idle" | "loading-sdk" | "initializing-sdk" | "creating-instance" | "ready" | "error";
  reinitialize: () => Promise<void>;
}

const FhevmContext = createContext<FhevmContextType>({
  instance: null,
  isLoading: true,
  error: null,
  isReady: false,
  status: "idle",
  reinitialize: async () => {},
});

// Helper to get SDK from window (handles both naming conventions)
function getRelayerSDK(): FhevmRelayerSDKType | null {
  if (typeof window === "undefined") return null;
  return window.relayerSDK || window.RelayerSDK || null;
}

// Helper to check if SDK is loaded and valid
function isSDKLoaded(): boolean {
  const sdk = getRelayerSDK();
  if (!sdk) return false;
  return (
    typeof sdk.initSDK === "function" &&
    typeof sdk.createInstance === "function" &&
    typeof sdk.SepoliaConfig === "object"
  );
}

// Helper to check if SDK is initialized
function isSDKInitialized(): boolean {
  const sdk = getRelayerSDK();
  return sdk?.__initialized__ === true;
}

export function FhevmProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [instance, setInstance] = useState<RelayerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<FhevmContextType["status"]>("idle");
  const initRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initialize = useCallback(async () => {
    // Abort any previous initialization
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Skip if not connected
    if (!isConnected || !address) {
      setInstance(null);
      setIsLoading(false);
      setStatus("idle");
      return;
    }

    // Must be in browser
    if (typeof window === "undefined") {
      setError(new Error("Cannot initialize FHEVM on server"));
      setIsLoading(false);
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus("loading-sdk");

    try {
      // Wait for SDK to load from CDN (up to 10 seconds)
      let attempts = 0;
      const maxAttempts = 100;
      while (!isSDKLoaded() && attempts < maxAttempts) {
        if (signal.aborted) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!isSDKLoaded()) {
        throw new Error(
          "RelayerSDK not loaded from CDN. Check that the script is included in layout.tsx"
        );
      }

      if (signal.aborted) return;

      const sdk = getRelayerSDK()!;

      // Initialize SDK if not already
      if (!isSDKInitialized()) {
        setStatus("initializing-sdk");
        const initResult = await sdk.initSDK();
        if (!initResult) {
          throw new Error("SDK initSDK() returned false");
        }
        sdk.__initialized__ = true;
      }

      if (signal.aborted) return;

      // Create instance with wallet provider
      setStatus("creating-instance");

      const config = {
        ...sdk.SepoliaConfig,
        network: window.ethereum, // Bind to user's wallet provider
      };

      const fhevmInstance = await sdk.createInstance(config);

      if (signal.aborted) return;

      setInstance(fhevmInstance);
      setError(null);
      setStatus("ready");
    } catch (err) {
      // Ignore abort errors
      if (signal.aborted) return;

      console.error("[FHEVM] Failed to initialize:", err);
      setError(err instanceof Error ? err : new Error("Failed to initialize FHEVM"));
      setStatus("error");
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initialize();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialize]);

  // Reinitialize when wallet changes
  useEffect(() => {
    if (initRef.current) {
      initialize();
    }
  }, [address, initialize]);

  const reinitialize = useCallback(async () => {
    initRef.current = false;
    await initialize();
    initRef.current = true;
  }, [initialize]);

  return (
    <FhevmContext.Provider
      value={{
        instance,
        isLoading,
        error,
        isReady: !!instance && !isLoading && !error,
        status,
        reinitialize,
      }}
    >
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error("useFhevm must be used within FhevmProvider");
  }
  return context;
}

// Hook for encrypting payment amounts
export function useFhevmEncrypt() {
  const { instance, isReady, error } = useFhevm();
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState<Error | null>(null);

  const encryptAmount = useCallback(
    async (
      amount: bigint,
      contractAddress: string = CONTRACTS.GATEWAY
    ): Promise<{ handles: string[]; inputProof: string } | null> => {
      if (!instance || !address || !isReady) {
        setEncryptError(new Error("FHEVM not ready"));
        return null;
      }

      setIsEncrypting(true);
      setEncryptError(null);

      try {
        const input = instance.createEncryptedInput(contractAddress, address);
        input.add64(amount);
        const encrypted = await input.encrypt();

        // Convert Uint8Array or array to proper hex string
        const toHexString = (value: unknown): string => {
          if (typeof value === 'string') {
            return value.startsWith('0x') ? value : `0x${value}`;
          }
          if (value instanceof Uint8Array || Array.isArray(value)) {
            return '0x' + Array.from(value as number[] | Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');
          }
          return String(value);
        };

        // Ensure proper format - handles and inputProof should be hex strings
        return {
          handles: encrypted.handles.map(h => toHexString(h)),
          inputProof: toHexString(encrypted.inputProof)
        };
      } catch (err) {
        console.error("[FHEVM] Encryption failed:", err);
        setEncryptError(err instanceof Error ? err : new Error("Encryption failed"));
        return null;
      } finally {
        setIsEncrypting(false);
      }
    },
    [instance, address, isReady]
  );

  return {
    encryptAmount,
    isEncrypting,
    error: error || encryptError,
    isReady,
  };
}

// Signature cache using IndexedDB pattern from Filez
const signatureCache = new Map<string, { signature: string; timestamp: number }>();
const SIGNATURE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCachedSignature(key: string): string | null {
  const cached = signatureCache.get(key);
  if (cached && Date.now() - cached.timestamp < SIGNATURE_TTL) {
    return cached.signature;
  }
  signatureCache.delete(key);
  return null;
}

function setCachedSignature(key: string, signature: string): void {
  signatureCache.set(key, { signature, timestamp: Date.now() });
}

// Hook for decrypting merchant data
export function useFhevmDecrypt() {
  const { instance, isReady, error } = useFhevm();
  const { address } = useAccount();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<Error | null>(null);

  const decryptHandle = useCallback(
    async (
      handle: string,
      contractAddress: string,
      signTypedData: (typedData: any) => Promise<string>
    ): Promise<bigint | null> => {
      if (!instance || !address || !isReady) {
        setDecryptError(new Error("FHEVM not ready"));
        return null;
      }

      if (!handle || handle === "0x" + "0".repeat(64)) {
        return 0n; // Empty handle = zero value
      }

      setIsDecrypting(true);
      setDecryptError(null);

      try {
        // Generate keypair for this decryption session
        const keypair = instance.generateKeypair();
        
        const handleContractPairs = [{
          handle: handle,
          contractAddress: contractAddress,
        }];
        
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";
        const contractAddresses = [contractAddress];

        // Create EIP-712 typed data - requires 4 parameters
        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        );

        // User signs the typed data (MetaMask popup)
        const signature = await signTypedData({
          domain: eip712.domain,
          types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          message: eip712.message,
          primaryType: 'UserDecryptRequestVerification',
        });

        // Request decryption from relayer - requires 8 parameters
        const result = await instance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace("0x", ""),
          contractAddresses,
          address,
          startTimestamp,
          durationDays
        );

        return BigInt(result[handle] ?? 0);
      } catch (err) {
        console.error("[FHEVM] Decryption failed:", err);
        setDecryptError(err instanceof Error ? err : new Error("Decryption failed"));
        return null;
      } finally {
        setIsDecrypting(false);
      }
    },
    [instance, address, isReady]
  );

  return {
    decryptHandle,
    isDecrypting,
    error: error || decryptError,
    isReady,
  };
}

// Hook for public decryption (no signature needed)
export function useFhevmPublicDecrypt() {
  const { instance, isReady, error } = useFhevm();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<Error | null>(null);

  const publicDecrypt = useCallback(
    async (handles: string[]): Promise<Record<string, bigint> | null> => {
      if (!instance || !isReady) {
        setDecryptError(new Error("FHEVM not ready"));
        return null;
      }

      // Filter out empty handles
      const validHandles = handles.filter(h => h && h !== "0x" + "0".repeat(64));
      if (validHandles.length === 0) {
        return {};
      }

      setIsDecrypting(true);
      setDecryptError(null);

      try {
        // Public decryption - no signature required
        const result = await instance.publicDecrypt(validHandles);
        
        // Convert to Record<string, bigint>
        const decrypted: Record<string, bigint> = {};
        for (const handle of validHandles) {
          const value = result.clearValues[handle];
          decrypted[handle] = typeof value === 'bigint' ? value : BigInt(value ?? 0);
        }
        
        return decrypted;
      } catch (err) {
        console.error("[FHEVM] Public decryption failed:", err);
        setDecryptError(err instanceof Error ? err : new Error("Public decryption failed"));
        return null;
      } finally {
        setIsDecrypting(false);
      }
    },
    [instance, isReady]
  );

  return {
    publicDecrypt,
    isDecrypting,
    error: error || decryptError,
    isReady,
  };
}
