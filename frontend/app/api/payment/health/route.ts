/**
 * @fileoverview Payment Service Health Check API
 *
 * Provides a health check endpoint for the payment verification service.
 * Useful for load balancers, monitoring, and service discovery.
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { GATEWAY_ABI } from '@/lib/contracts';

// Contract and network configuration
const GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_GATEWAY_ADDRESS || '0xEcC6317E60C3115A782D577d02322eDc3c27119a';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia.gateway.tatum.io';
const NETWORK = 'sepolia';
const CHAIN_ID = 11155111;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: number;
  network: {
    name: string;
    chainId: number;
    rpcConnected: boolean;
    blockNumber?: number;
  };
  contracts: {
    gateway: {
      address: string;
      accessible: boolean;
      error?: string;
    };
  };
  uptime: number;
}

// Track service start time
const SERVICE_START_TIME = Date.now();

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    version: '1.0.0',
    timestamp: startTime,
    network: {
      name: NETWORK,
      chainId: CHAIN_ID,
      rpcConnected: false,
    },
    contracts: {
      gateway: {
        address: GATEWAY_ADDRESS,
        accessible: false,
      },
    },
    uptime: Math.floor((startTime - SERVICE_START_TIME) / 1000),
  };

  try {
    // Check RPC connection
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Get block number (validates RPC connection)
    const blockNumber = await provider.getBlockNumber();
    health.network.rpcConnected = true;
    health.network.blockNumber = blockNumber;

    // Check gateway contract accessibility
    try {
      const gateway = new ethers.Contract(GATEWAY_ADDRESS, GATEWAY_ABI, provider);
      // Try to call a view function to verify contract is accessible
      await gateway.owner();
      health.contracts.gateway.accessible = true;
    } catch (contractError) {
      health.contracts.gateway.accessible = false;
      health.contracts.gateway.error = contractError instanceof Error 
        ? contractError.message 
        : 'Contract not accessible';
      health.status = 'degraded';
    }

  } catch (error) {
    health.network.rpcConnected = false;
    health.status = 'unhealthy';
  }

  // Determine HTTP status code based on health
  const httpStatus = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: httpStatus });
}
