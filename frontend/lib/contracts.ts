import { ENV } from "./env";

// Import proper JSON ABIs from contract artifacts
import PaymentGatewayArtifact from "./abi/PaymentGateway.json";
import ConfidentialUSDCWrapperArtifact from "./abi/ConfidentialUSDCWrapper.json";
import RefundManagerArtifact from "./abi/RefundManager.json";
import ProductRegistryArtifact from "./abi/ProductRegistry.json";

// Contract addresses from validated environment
export const CONTRACTS = {
  WRAPPER: ENV.WRAPPER_ADDRESS,
  GATEWAY: ENV.GATEWAY_ADDRESS,
  PRODUCT_REGISTRY: ENV.PRODUCT_REGISTRY_ADDRESS,
  REFUND_MANAGER: ENV.REFUND_MANAGER_ADDRESS,
  UNDERLYING_ERC20: ENV.UNDERLYING_ERC20,
} as const;

// Chain configuration
export const CHAIN_ID = ENV.CHAIN_ID;
export const RELAYER_URL = ENV.RELAYER_URL;

// ERC20 ABI (for underlying token)
export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function mintTo(uint256)",
] as const;

// Payment Gateway ABI - Use proper JSON ABI from artifacts
export const GATEWAY_ABI = PaymentGatewayArtifact.abi;

// Product Registry ABI - Use proper JSON ABI from artifacts
export const PRODUCT_REGISTRY_ABI = ProductRegistryArtifact.abi;

// Refund Manager ABI - Use proper JSON ABI from artifacts
export const REFUND_MANAGER_ABI = RefundManagerArtifact.abi;

// Wrapper ABI - Use proper JSON ABI from artifacts  
export const WRAPPER_ABI = ConfidentialUSDCWrapperArtifact.abi;

// Type-safe contract config helper
export function getContractConfig<T extends keyof typeof CONTRACTS>(
  contract: T
): { address: `0x${string}`; abi: any } {
  const address = CONTRACTS[contract];
  const abiMap = {
    WRAPPER: WRAPPER_ABI,
    GATEWAY: GATEWAY_ABI,
    PRODUCT_REGISTRY: PRODUCT_REGISTRY_ABI,
    REFUND_MANAGER: REFUND_MANAGER_ABI,
    UNDERLYING_ERC20: ERC20_ABI,
  };
  return { address, abi: abiMap[contract] };
}