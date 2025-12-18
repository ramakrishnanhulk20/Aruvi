import { NextRequest, NextResponse } from "next/server";
import { handleCors, setCorsHeaders } from "@/lib/cors";
import { apiRateLimit } from "@/lib/rateLimit";
import * as fs from "fs";
import * as path from "path";

// Inlined type to avoid Vercel build path alias issues
interface MerchantRegistration {
  id: string;
  walletAddress: string;
  businessName: string;
  businessType?: string;
  website?: string;
  email: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  timestamp: number;
  approvedBy?: string;
  approvedAt?: number;
  rejectionReason?: string;
}

// File-based persistent storage
const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load registrations from file
function loadRegistrations(): Map<string, MerchantRegistration> {
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      const data = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error("Error loading registrations:", error);
  }
  return new Map();
}

// Save registrations to file
function saveRegistrations(registrations: Map<string, MerchantRegistration>): void {
  try {
    const obj = Object.fromEntries(registrations);
    const jsonStr = JSON.stringify(obj, null, 2);
    fs.writeFileSync(REGISTRATIONS_FILE, jsonStr, "utf-8");
  } catch (error) {
    console.error("Error saving registrations:", error);
  }
}

export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = apiRateLimit(ip);
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          }
        }
      );
      return setCorsHeaders(response, request);
    }

    const body = await request.json();
    const { walletAddress, businessName, businessType, website, email, description, timestamp } = body;

    // Validation
    if (!walletAddress || !businessName || !email) {
      const response = NextResponse.json(
        { error: "Missing required fields: walletAddress, businessName, email" },
        { status: 400 }
      );
      return setCorsHeaders(response, request);
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      const response = NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
      return setCorsHeaders(response, request);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const response = NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
      return setCorsHeaders(response, request);
    }

    // Check if wallet already has a pending or approved registration
    const registrationRequests = loadRegistrations();
    const existingRequest = Array.from(registrationRequests.values()).find(
      (req) => req.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        const response = NextResponse.json(
          { error: "You already have a pending registration request" },
          { status: 409 }
        );
        return setCorsHeaders(response, request);
      }
      if (existingRequest.status === "approved") {
        const response = NextResponse.json(
          { error: "This wallet is already registered as a merchant" },
          { status: 409 }
        );
        return setCorsHeaders(response, request);
      }
    }

    // Create registration request
    const registrationId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const registration: MerchantRegistration = {
      id: registrationId,
      walletAddress: walletAddress.toLowerCase(),
      businessName,
      businessType: businessType || undefined,
      website: website || undefined,
      email,
      description: description || undefined,
      status: "pending",
      timestamp: timestamp || Date.now(),
    };

    registrationRequests.set(registrationId, registration);
    saveRegistrations(registrationRequests);

    // In production, you would:
    // 1. Save to database
    // 2. Send notification email to admin
    // 3. Send confirmation email to merchant

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration request submitted successfully",
        registrationId,
      },
      { status: 201 }
    );
    return setCorsHeaders(response, request);
  } catch (error) {
    console.error("Merchant registration error:", error);
    const response = NextResponse.json(
      { error: "Failed to process registration request" },
      { status: 500 }
    );
    return setCorsHeaders(response, request);
  }
}

// GET - List all pending registrations (admin only)
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // In production, verify admin authentication here
    // For now, we'll allow anyone to list (you should secure this!)
    
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";

    const registrationRequests = loadRegistrations();
    const requests = Array.from(registrationRequests.values())
      .filter((req) => status === "all" || req.status === status)
      .sort((a, b) => b.timestamp - a.timestamp);

    const response = NextResponse.json({
      success: true,
      requests,
      total: requests.length,
    });
    return setCorsHeaders(response, request);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    const response = NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
    return setCorsHeaders(response, request);
  }
}

// Helper to get all registrations (for admin dashboard)
function getAllRegistrations(): MerchantRegistration[] {
  const registrationRequests = loadRegistrations();
  return Array.from(registrationRequests.values());
}
