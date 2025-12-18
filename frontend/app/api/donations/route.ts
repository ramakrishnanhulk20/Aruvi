import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Inlined types to avoid Vercel build path alias issues
interface DonationRequest {
  id: string;
  walletAddress: string;
  cause: string;
  description?: string;
  targetAmount?: string;
  receivedAmount: string;
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
}

interface DonationSubmission {
  walletAddress: string;
  cause: string;
  description?: string;
  targetAmount?: string;
}

const DONATIONS_FILE = join(process.cwd(), "data", "donations.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(dataDir, { recursive: true });
  }
}

function readDonations(): DonationRequest[] {
  ensureDataDir();
  if (!existsSync(DONATIONS_FILE)) {
    return [];
  }
  const data = readFileSync(DONATIONS_FILE, "utf-8");
  return JSON.parse(data);
}

function writeDonations(donations: DonationRequest[]) {
  ensureDataDir();
  writeFileSync(DONATIONS_FILE, JSON.stringify(donations, null, 2));
}

// GET - List all active donation requests
export async function GET() {
  try {
    const donations = readDonations();
    const activeDonations = donations
      .filter((d) => d.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(activeDonations);
  } catch (error) {
    console.error("Error reading donations:", error);
    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }
}

// POST - Submit new donation request
export async function POST(request: NextRequest) {
  try {
    const body: DonationSubmission = await request.json();
    
    // Validate required fields
    if (!body.walletAddress || !body.cause) {
      return NextResponse.json(
        { error: "Wallet address and cause are required" },
        { status: 400 }
      );
    }

    // Check if user already has an active donation
    const donations = readDonations();
    const existingActive = donations.find(
      (d) => d.walletAddress.toLowerCase() === body.walletAddress.toLowerCase() && d.status === 'active'
    );

    if (existingActive) {
      return NextResponse.json(
        { error: "You already have an active donation request" },
        { status: 400 }
      );
    }

    // Create new donation request
    const newDonation: DonationRequest = {
      id: `donation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      walletAddress: body.walletAddress,
      cause: body.cause,
      description: body.description,
      targetAmount: body.targetAmount,
      receivedAmount: "0",
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    donations.push(newDonation);
    writeDonations(donations);

    return NextResponse.json(newDonation, { status: 201 });
  } catch (error) {
    console.error("Error creating donation:", error);
    return NextResponse.json({ error: "Failed to create donation request" }, { status: 500 });
  }
}

// PATCH - Update donation (pause/complete)
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    const donations = readDonations();
    const index = donations.findIndex((d) => d.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    donations[index].status = status;
    writeDonations(donations);

    return NextResponse.json(donations[index]);
  } catch (error) {
    console.error("Error updating donation:", error);
    return NextResponse.json({ error: "Failed to update donation" }, { status: 500 });
  }
}
