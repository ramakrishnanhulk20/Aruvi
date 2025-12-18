/**
 * @fileoverview Aruvi Payment Middleware
 *
 * Server-side middleware for protecting API routes with confidential payments.
 * Handles:
 * - Returning 402 Payment Required responses with requirements
 * - Extracting and parsing payment headers
 * - Verifying payments with the verification service
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  PaymentRequirement,
  PaymentPayload,
  PaymentVerifyResult,
} from './types';

// =============================================================================
// Types
// =============================================================================

/**
 * Payment requirement with required verifier URL.
 */
export interface PaymentRequirementWithVerifier extends Omit<PaymentRequirement, 'resource'> {
  /** URL of the verification service (required) */
  verifier: string;
}

// =============================================================================
// Response Helpers
// =============================================================================

/**
 * Creates a 402 Payment Required response with payment requirements.
 *
 * This response tells the client what payment is required to access the
 * resource. The requirements are included in the `X-Accept-Payment` header.
 */
export function createPaymentRequiredResponse(
  requirement: PaymentRequirement & { verifier: string },
  message?: string
): NextResponse {
  // Calculate price display (assuming 6 decimals like cUSDC)
  const decimals = 6;
  const price = (parseInt(requirement.maxAmountRequired) / Math.pow(10, decimals)).toFixed(2);

  return new NextResponse(
    JSON.stringify({
      message: message || 'Payment required to access this resource',
      price: `$${price}`,
      scheme: 'confidential-transfer',
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Accept-Payment': JSON.stringify([requirement]),
      },
    }
  );
}

// =============================================================================
// Header Extraction
// =============================================================================

/**
 * Extracts and parses the payment payload from the x-payment header.
 *
 * The x-payment header contains a base64-encoded JSON payment payload.
 */
export function extractPaymentFromHeader(request: NextRequest): PaymentPayload | null {
  const paymentHeader = request.headers.get('x-payment');

  if (!paymentHeader) {
    return null;
  }

  try {
    const decoded = atob(paymentHeader);
    const payload = JSON.parse(decoded) as PaymentPayload;

    // Basic validation
    if (
      payload.version !== 1 ||
      !payload.payload?.txHash ||
      !payload.payload?.decryptionSignature
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// =============================================================================
// Payment Verification
// =============================================================================

/**
 * Verifies a payment with the verification service.
 *
 * This function sends the payment payload and requirements to the verifier
 * service, which extracts the transfer from the blockchain and decrypts the
 * amount to verify it meets the requirements.
 */
export async function verifyPaymentWithService(
  paymentPayload: PaymentPayload,
  requirement: Omit<PaymentRequirement, 'verifier'>,
  verifierUrl: string
): Promise<PaymentVerifyResult> {
  try {
    const verifyResponse = await fetch(`${verifierUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 1,
        paymentPayload,
        paymentRequirements: requirement,
      }),
    });

    if (!verifyResponse.ok) {
      let errorDetails = `Verification service returned HTTP ${verifyResponse.status}`;

      try {
        const errorBody = await verifyResponse.json();
        if (errorBody.invalidReason) {
          errorDetails = errorBody.invalidReason;
        } else if (errorBody.error || errorBody.message) {
          errorDetails = `${errorDetails}: ${errorBody.error || errorBody.message}`;
        }
      } catch {
        if (verifyResponse.statusText) {
          errorDetails = `${errorDetails}: ${verifyResponse.statusText}`;
        }
      }

      return {
        isValid: false,
        invalidReason: errorDetails,
      };
    }

    const result = await verifyResponse.json();
    return {
      isValid: result.isValid,
      invalidReason: result.invalidReason,
      txHash: result.txHash,
      amount: result.amount,
    };
  } catch (error) {
    console.error('[Aruvi] Payment verification error:', error);

    let errorMessage = 'Verification failed';
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Verification service unavailable';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      isValid: false,
      invalidReason: errorMessage,
    };
  }
}

// =============================================================================
// Route Protection
// =============================================================================

/**
 * Middleware helper to protect API routes with confidential payment verification.
 *
 * This is the main function to use in API routes. It:
 * 1. Checks if a payment header is present
 * 2. If not, returns 402 with payment requirements
 * 3. If yes, verifies the payment with the verification service
 * 4. Returns null if payment is valid (allowing the route to proceed)
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const paymentResponse = await requirePayment(request, requirement)
 *
 *   if (paymentResponse) {
 *     return paymentResponse // 402 or error
 *   }
 *
 *   // Payment verified - return premium content
 *   return NextResponse.json({ premium: 'content' })
 * }
 * ```
 */
export async function requirePayment(
  request: NextRequest,
  requirement: PaymentRequirementWithVerifier
): Promise<NextResponse | null> {
  const payment = extractPaymentFromHeader(request);

  // No payment provided - return 402 with requirements
  if (!payment) {
    const url = new URL(request.url);
    const resourceUrl = `${url.protocol}//${url.host}${url.pathname}`;

    return createPaymentRequiredResponse({
      ...requirement,
      resource: resourceUrl,
    });
  }

  // Verify payment with service
  const url = new URL(request.url);
  const resourceUrl = `${url.protocol}//${url.host}${url.pathname}`;

  const verifyResult = await verifyPaymentWithService(
    payment,
    {
      scheme: requirement.scheme,
      network: requirement.network,
      chainId: requirement.chainId,
      payTo: requirement.payTo,
      maxAmountRequired: requirement.maxAmountRequired,
      asset: requirement.asset,
      resource: resourceUrl,
      description: requirement.description,
      mimeType: requirement.mimeType,
      maxTimeoutSeconds: requirement.maxTimeoutSeconds,
    },
    requirement.verifier
  );

  if (!verifyResult.isValid) {
    return NextResponse.json(
      {
        error: 'Invalid payment',
        reason: verifyResult.invalidReason,
      },
      { status: 400 }
    );
  }

  // Payment is valid - allow the request to proceed
  return null;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Gets payment info from a verified request.
 *
 * Use this in API handlers after payment verification to access payment details.
 */
export function getPaymentInfo(request: NextRequest): PaymentPayload | null {
  return extractPaymentFromHeader(request);
}

/**
 * Encodes a payment payload for the x-payment header.
 */
export function encodePaymentHeader(payload: PaymentPayload): string {
  return btoa(JSON.stringify(payload));
}

/**
 * Parses payment requirements from a 402 response.
 */
export function parsePaymentRequirements(response: Response): PaymentRequirement[] {
  const header = response.headers.get('X-Accept-Payment');
  if (!header) {
    return [];
  }

  try {
    return JSON.parse(header) as PaymentRequirement[];
  } catch {
    return [];
  }
}
