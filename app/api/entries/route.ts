import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const surveyId = searchParams.get("surveyId");
    
    if (!surveyId) {
      return NextResponse.json({ success: false, message: "surveyId is required" }, { status: 400 });
    }

    const entries = await storage.getEntries(parseInt(surveyId));
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("[API] Fetch entries error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API] Creating entry with body:", JSON.stringify(body));
    
    // Ensure surveyId is a number
    if (typeof body.surveyId === 'string') {
      body.surveyId = parseInt(body.surveyId, 10);
    }
    
    const entry = await storage.createEntry(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[API] Create entry error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
