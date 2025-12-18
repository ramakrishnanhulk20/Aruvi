import { NextRequest, NextResponse } from "next/server";
import { handleCors, setCorsHeaders } from "@/lib/cors";
import { verifyMessage } from "viem";
import * as fs from "fs";
import * as path from "path";

// File-based persistent storage (shared with register route)
const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

// Load registrations from file
function loadRegistrations(): Map<string, any> {
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
function saveRegistrations(registrations: Map<string, any>): void {
  try {
    const obj = Object.fromEntries(registrations);
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving registrations:", error);
  }
}

export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { registrationId, action, adminAddress, signature, message } = body;

    // Validation
    if (!registrationId || !action || !adminAddress || !signature || !message) {
      const response = NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
      return setCorsHeaders(response, request);
    }

    if (!["approve", "reject"].includes(action)) {
      const response = NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
      return setCorsHeaders(response, request);
    }

    // Verify admin signature
    try {
      const isValid = await verifyMessage({
        address: adminAddress as `0x${string}`,
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
    } catch (error) {
      console.error("Signature verification failed:", error);
      const response = NextResponse.json(
        { error: "Failed to verify signature" },
        { status: 401 }
      );
      return setCorsHeaders(response, request);
    }

    // In production, verify that adminAddress is actually an admin
    // For now, any valid signature can approve (you should secure this!)

    // Find the registration
    const registrationRequests = loadRegistrations();
    const registration = registrationRequests.get(registrationId);
    if (!registration) {
      const response = NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
      return setCorsHeaders(response, request);
    }

    if (registration.status !== "pending") {
      const response = NextResponse.json(
        { error: `Registration already ${registration.status}` },
        { status: 409 }
      );
      return setCorsHeaders(response, request);
    }

    // Update registration status
    if (action === "approve") {
      registration.status = "approved";
      registration.approvedBy = adminAddress;
      registration.approvedAt = Date.now();
    } else {
      registration.status = "rejected";
      registration.rejectionReason = body.reason || "No reason provided";
    }

    saveRegistrations(registrationRequests);
    registrationRequests.set(registrationId, registration);

    // In production, you would:
    // 1. Update database
    // 2. Call the smart contract registerMerchant() function
    // 3. Send email notification to merchant
    // 4. Log the approval action

    const response = NextResponse.json({
      success: true,
      message: `Registration ${action}d successfully`,
      registration,
      // Include contract transaction info if you implement on-chain registration
      contractTx: action === "approve" 
        ? { 
            message: "Admin should now call registerMerchant() on-chain with address: " + registration.walletAddress,
            note: "On-chain registration not automated yet - requires manual contract call"
          }
        : undefined,
    });
    return setCorsHeaders(response, request);
  } catch (error) {
    console.error("Approval error:", error);
    const response = NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
    return setCorsHeaders(response, request);
  }
}
