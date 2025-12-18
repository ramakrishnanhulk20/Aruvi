import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface PaymentSession {
  sessionId: string;
  merchantAddress: string;
  productId?: number; // Product ID (0, 1, 2...) for ProductRegistry lookup
  amount?: number;
  productName?: string;
  orderId?: string;
  type?: 'product' | 'subscription' | 'donation' | 'p2p';
  metadata?: Record<string, any>;
  expiresAt: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  createdAt: number;
}

// In-memory session store (replace with database in production)
const sessions = new Map<string, PaymentSession>();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate secure session ID
 */
function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'sess_' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * POST /api/payment/session
 * Create a new payment session (amount stays encrypted)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantAddress,
      productId,
      amount,
      productName,
      orderId,
      type = 'product',
      metadata = {}
    } = body;

    // Validate merchant address
    if (!merchantAddress || !merchantAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid merchant address' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create session
    const sessionId = generateSessionId();
    const now = Date.now();
    const session: PaymentSession = {
      sessionId,
      merchantAddress,
      productId,
      amount,
      productName,
      orderId,
      type,
      metadata,
      expiresAt: now + (30 * 60 * 1000), // 30 minutes
      status: 'pending',
      createdAt: now
    };

    sessions.set(sessionId, session);

    const trustlessFlag = metadata.trustless ? ' (blockchain-verified)' : '';
    console.log(`[Session] Created ${sessionId} for merchant ${merchantAddress}${trustlessFlag}`);
    if (productName) {
      console.log(`[Session] Product: ${productName} (ID: ${productId}) - ${amount ? (amount / 1e6).toFixed(2) : 'N/A'} cUSDC`);
    }

    return NextResponse.json(
      {
        sessionId,
        expiresAt: session.expiresAt,
        checkoutUrl: `/checkout?session=${sessionId}`
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Session] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/payment/session?sessionId=xxx
 * Retrieve session details
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if expired
    if (session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 410, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        sessionId: session.sessionId,
        merchantAddress: session.merchantAddress,
        productId: session.productId,
        amount: session.amount,
        productName: session.productName,
        orderId: session.orderId,
        type: session.type,
        metadata: session.metadata,
        status: session.status,
        expiresAt: session.expiresAt
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Session] Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PATCH /api/payment/session
 * Update session status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, status, paymentId, txHash } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update status
    session.status = status;
    if (!session.metadata) session.metadata = {};
    if (paymentId) session.metadata.paymentId = paymentId;
    if (txHash) session.metadata.txHash = txHash;

    sessions.set(sessionId, session);

    console.log(`[Session] Updated ${sessionId} to status ${status}`);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Session] Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
