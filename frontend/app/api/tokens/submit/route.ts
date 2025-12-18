/**
 * API route to submit tokens for admin approval
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Inlined type to avoid Vercel build path alias issues
interface TokenSubmission {
  id: string;
  wrapperAddress: string;
  underlyingAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  underlyingSymbol: string;
  submittedBy: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  validationResults: {
    isLegitContract: boolean;
    hasERC7984Interface: boolean;
    hasUnderlyingToken: boolean;
    isWhitelistedInGateway: boolean;
    validationErrors: string[];
  };
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: number;
}

const SUBMISSIONS_FILE = path.join(process.cwd(), "data", "token-submissions.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(SUBMISSIONS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load submissions
function loadSubmissions(): TokenSubmission[] {
  ensureDataDir();
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error loading submissions:", e);
    return [];
  }
}

// Save submissions
function saveSubmissions(submissions: TokenSubmission[]) {
  ensureDataDir();
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      wrapperAddress, 
      underlyingAddress,
      symbol,
      name,
      decimals,
      underlyingSymbol,
      submittedBy,
      validationResults 
    } = body;

    if (!wrapperAddress || !submittedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const submissions = loadSubmissions();

    // Check if already submitted
    const existing = submissions.find(
      s => s.wrapperAddress.toLowerCase() === wrapperAddress.toLowerCase()
    );

    if (existing) {
      return NextResponse.json(
        { error: "Token already submitted", submission: existing },
        { status: 409 }
      );
    }

    const newSubmission: TokenSubmission = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      wrapperAddress,
      underlyingAddress,
      symbol,
      name,
      decimals,
      underlyingSymbol,
      submittedBy,
      submittedAt: Date.now(),
      status: 'pending',
      validationResults,
    };

    submissions.push(newSubmission);
    saveSubmissions(submissions);

    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error("Token submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit token" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let submissions = loadSubmissions();

    if (status) {
      submissions = submissions.filter(s => s.status === status);
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error loading submissions:", error);
    return NextResponse.json(
      { error: "Failed to load submissions" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, adminNotes, reviewedBy } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const submissions = loadSubmissions();
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    submissions[index] = {
      ...submissions[index],
      status,
      adminNotes,
      reviewedBy,
      reviewedAt: Date.now(),
    };

    saveSubmissions(submissions);

    return NextResponse.json({ success: true, submission: submissions[index] });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
