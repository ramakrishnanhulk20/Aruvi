/**
 * @fileoverview Payment Verification API Route
 *
 * POST /api/payment/verify
 *
 * Verifies confidential payments by:
 * 1. Validating the request structure
 * 2. Checking the transaction exists on-chain
 * 3. Extracting the ConfidentialTransfer event
 * 4. Decrypting the encrypted amount using user's authorization
 * 5. Verifying the amount meets requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/payment/verification';
import type { VerifyRequest, VerifyResponse } from '@/lib/payment/types';

// =============================================================================
// Request Validation
// =============================================================================

function validateRequest(body: unknown): { valid: boolean; error?: string; data?: VerifyRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = body as Record<string, unknown>;

  if (req.version !== 1) {
    return { valid: false, error: 'Unsupported protocol version' };
  }

  if (!req.paymentPayload || typeof req.paymentPayload !== 'object') {
    return { valid: false, error: 'Missing paymentPayload' };
  }

  if (!req.paymentRequirements || typeof req.paymentRequirements !== 'object') {
    return { valid: false, error: 'Missing paymentRequirements' };
  }

  const payload = req.paymentPayload as Record<string, unknown>;
  
  if (!payload.payload || typeof payload.payload !== 'object') {
    return { valid: false, error: 'Missing payload.payload' };
  }

  const innerPayload = payload.payload as Record<string, unknown>;

  if (!innerPayload.txHash || typeof innerPayload.txHash !== 'string') {
    return { valid: false, error: 'Missing or invalid txHash' };
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(innerPayload.txHash)) {
    return { valid: false, error: 'Invalid txHash format' };
  }

  if (!innerPayload.decryptionSignature || typeof innerPayload.decryptionSignature !== 'object') {
    return { valid: false, error: 'Missing decryptionSignature' };
  }

  return { valid: true, data: body as VerifyRequest };
}

// =============================================================================
// API Handler
// =============================================================================

/**
 * POST /api/payment/verify
 *
 * Verifies a confidential payment by extracting the transfer from the
 * blockchain and decrypting the amount using the user's authorization.
 *
 * Request Body:
 * {
 *   "version": 1,
 *   "paymentPayload": {
 *     "version": 1,
 *     "scheme": "confidential-transfer",
 *     "network": "sepolia",
 *     "chainId": 11155111,
 *     "payload": {
 *       "txHash": "0x...",
 *       "decryptionSignature": { ... }
 *     }
 *   },
 *   "paymentRequirements": {
 *     "scheme": "confidential-transfer",
 *     "network": "sepolia",
 *     "chainId": 11155111,
 *     "payTo": "0x...",
 *     "maxAmountRequired": "1000000",
 *     "asset": "0x...",
 *     ...
 *   }
 * }
 *
 * Success Response (200):
 * { "isValid": true, "txHash": "0x...", "amount": "1000000" }
 *
 * Error Response (400):
 * { "isValid": false, "invalidReason": "Insufficient payment..." }
 */
export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  try {
    const body = await request.json();

    // Validate request structure
    const validation = validateRequest(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { isValid: false, invalidReason: validation.error || 'Invalid request' },
        { status: 400 }
      );
    }

    const { paymentPayload, paymentRequirements } = validation.data;

    // Verify network/chainId consistency
    if (paymentPayload.network !== paymentRequirements.network) {
      return NextResponse.json(
        { isValid: false, invalidReason: 'Network mismatch between payload and requirements' },
        { status: 400 }
      );
    }

    if (paymentPayload.chainId !== paymentRequirements.chainId) {
      return NextResponse.json(
        { isValid: false, invalidReason: 'ChainId mismatch between payload and requirements' },
        { status: 400 }
      );
    }

    // Perform verification
    const result = await verifyPayment(paymentPayload, paymentRequirements);

    // Return result with appropriate status code
    return NextResponse.json(result, { status: result.isValid ? 200 : 400 });

  } catch (error) {
    console.error('[Aruvi] Verify endpoint error:', error);
    return NextResponse.json(
      {
        isValid: false,
        invalidReason: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// CORS Preflight
// =============================================================================

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-payment',
    },
  });
}
