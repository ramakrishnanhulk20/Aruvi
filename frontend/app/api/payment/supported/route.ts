/**
 * @fileoverview Facilitator Supported Payment Methods API
 * 
 * Returns supported FHE payment methods for the Aruvi payment gateway.
 * Clients can use this to discover which tokens and networks are supported.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ENV } from '@/lib/env'

// =============================================================================
// Types
// =============================================================================

interface SupportedToken {
  address: string
  symbol: string
  name: string
  decimals: number
}

interface SupportedNetwork {
  name: string
  displayName: string
  chainId: number
  tokens: SupportedToken[]
}

interface SupportedPaymentMethod {
  scheme: 'fhe-transfer'
  network: string
  chainId: number
  asset: string
  assetSymbol: string
  assetName: string
  decimals: number
}

// =============================================================================
// Configuration
// =============================================================================

const SUPPORTED_NETWORKS: Record<number, SupportedNetwork> = {
  // Sepolia FHEVM Testnet
  11155111: {
    name: 'sepolia',
    displayName: 'Sepolia FHEVM',
    chainId: 11155111,
    tokens: [
      {
        address: ENV.WRAPPER_ADDRESS,
        symbol: 'xUSD',
        name: 'Confidential USD (Aruvi)',
        decimals: 6,
      },
    ],
  },
  // Local development (if needed)
  31337: {
    name: 'localhost',
    displayName: 'Local Development',
    chainId: 31337,
    tokens: [
      {
        address: ENV.WRAPPER_ADDRESS,
        symbol: 'xUSD',
        name: 'Confidential USD (Local)',
        decimals: 6,
      },
    ],
  },
}

// =============================================================================
// GET Handler
// =============================================================================

/**
 * GET /api/payment/supported
 * 
 * Returns supported FHE payment methods.
 * 
 * Query params:
 * - chainId: Filter by specific chain (optional)
 * - tokenAddress: Filter by specific token (optional)
 * 
 * @example Response
 * ```json
 * {
 *   "version": 1,
 *   "supportedMethods": [
 *     {
 *       "scheme": "fhe-transfer",
 *       "network": "sepolia",
 *       "chainId": 11155111,
 *       "asset": "0x...",
 *       "assetSymbol": "xUSD",
 *       "assetName": "Confidential USD (Aruvi)",
 *       "decimals": 6
 *     }
 *   ],
 *   "facilitator": {
 *     "name": "Aruvi Payment Gateway",
 *     ...
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainIdParam = searchParams.get('chainId')
    const tokenAddress = searchParams.get('tokenAddress')?.toLowerCase()
    
    const supportedMethods: SupportedPaymentMethod[] = []
    
    for (const [chainIdStr, network] of Object.entries(SUPPORTED_NETWORKS)) {
      const chainId = parseInt(chainIdStr)
      
      // Filter by chainId if specified
      if (chainIdParam && parseInt(chainIdParam) !== chainId) {
        continue
      }
      
      for (const token of network.tokens) {
        // Filter by token address if specified
        if (tokenAddress && token.address.toLowerCase() !== tokenAddress) {
          continue
        }
        
        supportedMethods.push({
          scheme: 'fhe-transfer',
          network: network.name,
          chainId,
          asset: token.address,
          assetSymbol: token.symbol,
          assetName: token.name,
          decimals: token.decimals,
        })
      }
    }
    
    return NextResponse.json({
      version: 1,
      supportedMethods,
      facilitator: {
        name: 'Aruvi Payment Gateway',
        description: 'Confidential payment verification using Fully Homomorphic Encryption',
        version: '2.0.0',
        endpoints: {
          verify: '/api/payment/verify',
          supported: '/api/payment/supported',
          health: '/api/payment/health',
        },
        features: [
          'fhe-transfer',
          'server-side-decryption',
          'erc7984-tokens',
          'http-402-protocol',
        ],
        contracts: {
          gateway: ENV.GATEWAY_ADDRESS,
          wrapper: ENV.WRAPPER_ADDRESS,
          refundManager: ENV.REFUND_MANAGER_ADDRESS,
        },
        faucet: {
          claimAmount: '10000000', // 10 xUSD
          cooldown: 3600, // 1 hour in seconds
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[/api/payment/supported] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
