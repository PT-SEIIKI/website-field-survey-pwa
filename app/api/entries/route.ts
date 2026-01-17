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
    
    const surveyId = body.surveyId ? parseInt(body.surveyId.toString(), 10) : 1;
    const data = typeof body.data === 'object' ? JSON.stringify(body.data) : (body.data || '{}');
    const offlineId = body.offlineId || null;
    const isSynced = body.isSynced === true || body.isSynced === 'true';

    console.log("[API] Normalized entry:", { surveyId, data, offlineId, isSynced });

    const entry = await storage.createEntry({
      surveyId,
      data,
      offlineId,
      isSynced
    });

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
