/**
 * ERC7984 Token Registry
 * Lists all known confidential tokens on Sepolia testnet
 */

export interface ConfidentialToken {
  name: string;
  symbol: string;
  wrapperAddress: `0x${string}`;
  underlyingAddress: `0x${string}`;
  underlyingSymbol: string;
  decimals: number;
  isDefault?: boolean;
}

export const CONFIDENTIAL_TOKENS: ConfidentialToken[] = [
  {
    name: "Confidential USDC (Official)",
    symbol: "cUSDC",
    wrapperAddress: "0x5f8D47C188478fDf89a9aff7275b86553fc126fe",
    underlyingAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    underlyingSymbol: "USDC",
    decimals: 6,
    isDefault: true,
  },
  {
    name: "Confidential xUSD (Test)",
    symbol: "cXUSD",
    wrapperAddress: "0xbA89Abc56387D3bA5864E6A0a0a5e7cd9d872845",
    underlyingAddress: "0xC392ceE2b731A6a719BAd5205B9Cb44F346F012a",
    underlyingSymbol: "xUSD",
    decimals: 6,
    isDefault: false,
  },
];

/**
 * Get default payment token
 */
export function getDefaultToken(): ConfidentialToken {
  return CONFIDENTIAL_TOKENS.find(t => t.isDefault) || CONFIDENTIAL_TOKENS[0];
}

/**
 * Get token by wrapper address
 */
export function getTokenByWrapper(address: string): ConfidentialToken | undefined {
  return CONFIDENTIAL_TOKENS.find(
    t => t.wrapperAddress.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get token by underlying address
 */
export function getTokenByUnderlying(address: string): ConfidentialToken | undefined {
  return CONFIDENTIAL_TOKENS.find(
    t => t.underlyingAddress.toLowerCase() === address.toLowerCase()
  );
}
