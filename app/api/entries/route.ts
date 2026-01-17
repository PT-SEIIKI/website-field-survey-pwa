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
    console.log("[API] Raw POST body:", JSON.stringify(body));
    
    // Extract and normalize fields
    const surveyId = body.surveyId ? parseInt(body.surveyId.toString(), 10) : 1;
    
    // The user's log shows: data: "{\"timestamp\":1768609770465}"
    // If it's already a string, we keep it. If it's an object, we stringify it.
    let data = body.data;
    if (data && typeof data === 'object') {
      data = JSON.stringify(data);
    } else if (!data) {
      data = '{}';
    }
    
    const offlineId = body.offlineId || null;
    const isSynced = body.isSynced === true || body.isSynced === 'true';

    console.log("[API] Final data to save:", { surveyId, data, offlineId, isSynced });

    const entry = await storage.createEntry({
      surveyId,
      data,
      offlineId,
      isSynced
    });

    console.log("[API] Entry created successfully:", entry.id);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[API] CRITICAL POST ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
