/**
 * Environment variable validation and configuration
 * Uses .env.local values with fallback defaults from deployed contracts
 */

function getEnvOrDefault(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (!value) {
    if (typeof window !== 'undefined') {
      console.warn(`⚠️  Using default for ${key}`);
    }
    return defaultValue;
  }
  return value;
}

// Environment configuration with Sepolia defaults
export const ENV = {
  // Network
  CHAIN_ID: parseInt(getEnvOrDefault("NEXT_PUBLIC_CHAIN_ID", "11155111")),
  SEPOLIA_RPC: getEnvOrDefault(
    "NEXT_PUBLIC_SEPOLIA_RPC", 
    "https://eth-sepolia.g.alchemy.com/v2/demo"
  ),
  
  // Contracts (Sepolia deployed addresses)
  WRAPPER_ADDRESS: getEnvOrDefault(
    "NEXT_PUBLIC_WRAPPER_ADDRESS",
    "0xbA89Abc56387D3bA5864E6A0a0a5e7cd9d872845"
  ) as `0x${string}`,
  GATEWAY_ADDRESS: getEnvOrDefault(
    "NEXT_PUBLIC_GATEWAY_ADDRESS",
    "0xEcC6317E60C3115A782D577d02322eDc3c27119a"
  ) as `0x${string}`,
  PRODUCT_REGISTRY_ADDRESS: getEnvOrDefault(
    "NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS",
    "0x9523Bb7B1f1e3E773fc575Bc86f9b874C70B4D1D"
  ) as `0x${string}`,
  REFUND_MANAGER_ADDRESS: getEnvOrDefault(
    "NEXT_PUBLIC_REFUND_MANAGER_ADDRESS",
    "0xe637B2B335F6Ab8A108d8d1Bc39916589703dC4E"
  ) as `0x${string}`,
  UNDERLYING_ERC20: getEnvOrDefault(
    "NEXT_PUBLIC_UNDERLYING_ERC20",
    "0xC392ceE2b731A6a719BAd5205B9Cb44F346F012a"
  ) as `0x${string}`,
  
  // Zama
  RELAYER_URL: getEnvOrDefault(
    "NEXT_PUBLIC_RELAYER_URL", 
    "https://relayer.testnet.zama.org"
  ),
  
  // WalletConnect
  WALLETCONNECT_PROJECT_ID: getEnvOrDefault(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
    "cf5d11022a642e528f427d4210e992db"
  ),
  
  // Server-side only
  JWT_SECRET: typeof window === 'undefined' 
    ? getEnvOrDefault("JWT_SECRET", "dev-secret-change-in-production") 
    : '',
  JWT_EXPIRY: typeof window === 'undefined' 
    ? getEnvOrDefault("JWT_EXPIRY", "7d") 
    : '',
} as const;

// Validate address format
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Validate all contract addresses (warn only, don't throw)
const addresses = [
  { name: 'WRAPPER', addr: ENV.WRAPPER_ADDRESS },
  { name: 'GATEWAY', addr: ENV.GATEWAY_ADDRESS },
  { name: 'REFUND_MANAGER', addr: ENV.REFUND_MANAGER_ADDRESS },
  { name: 'XUSD', addr: ENV.UNDERLYING_ERC20 },
];

if (typeof window !== 'undefined') {
  for (const { name, addr } of addresses) {
    if (!isValidAddress(addr)) {
      console.error(`❌ Invalid contract address format for ${name}: ${addr}`);
    }
  }
}

// Validate chain ID
if (ENV.CHAIN_ID !== 11155111) {
  console.warn(`⚠️  Running on chain ID ${ENV.CHAIN_ID}, expected 11155111 (Sepolia)`);
}

// Export environment configuration
export default ENV;
