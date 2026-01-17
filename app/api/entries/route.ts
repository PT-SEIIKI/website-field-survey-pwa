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
    if (body.surveyId && typeof body.surveyId === 'string') {
      body.surveyId = parseInt(body.surveyId, 10);
    } else if (body.surveyId === undefined || body.surveyId === null) {
      // Default to 1 if missing, as seen in user report
      body.surveyId = 1;
    }
    
    // Ensure data is a string if it's an object
    if (body.data && typeof body.data === 'object') {
      body.data = JSON.stringify(body.data);
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
