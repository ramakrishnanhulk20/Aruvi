import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { verifyMessage } from "viem";
import { authRateLimit } from "@/lib/rateLimit";
import { handleCors, setCorsHeaders } from "@/lib/cors";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aruvi-dev-secret-key-32-chars-min"
);
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

// EIP-712 domain for Muthirai authentication
const AUTH_DOMAIN = {
  name: "Muthirai",
  version: "1",
  chainId: 11155111, // Sepolia
};

const AUTH_MESSAGE = "Sign this message to authenticate with Aruvi";

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting by IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = authRateLimit(ip);
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
          }
        }
      );
      return setCorsHeaders(response, request);
    }

    const body = await request.json();
    const { address, signature, timestamp } = body;

    if (!address || !signature || !timestamp) {
      const response = NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
      return setCorsHeaders(response, request);
    }

    // Verify timestamp is recent (within 5 minutes)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (now - requestTime > 5 * 60 * 1000) {
      const response = NextResponse.json(
        { error: "Signature expired" },
        { status: 401 }
      );
      return setCorsHeaders(response, request);
    }

    // Construct message that was signed
    const message = `${AUTH_MESSAGE}\n\nTimestamp: ${timestamp}`;

    // Verify signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      const response = NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
      return setCorsHeaders(response, request);
    }

    // Generate JWT
    const token = await new SignJWT({
      address: address.toLowerCase(),
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRY)
      .setIssuedAt()
      .setSubject(address.toLowerCase())
      .sign(JWT_SECRET);

    // Create response with cookie
    const response = NextResponse.json({
      token,
      address: address.toLowerCase(),
      expiresIn: JWT_EXPIRY,
    });

    // Set HTTP-only cookie for middleware
    response.cookies.set("aruvi_jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return setCorsHeaders(response, request);
  } catch (error) {
    console.error("[Auth] Error:", error);
    const response = NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
    return setCorsHeaders(response, request);
  }
}

// Verify existing token
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      valid: true,
      address: payload.sub,
      exp: payload.exp,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}

// Helper to verify JWT in other API routes
export async function verifyAuth(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}
