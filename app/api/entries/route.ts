import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const surveyId = searchParams.get("surveyId") || "1";
    
    const entries = await storage.getEntries(parseInt(surveyId));
    // The entries from storage already have the joined fields
    return NextResponse.json(entries);
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
    let surveyId = body.surveyId ? parseInt(body.surveyId.toString(), 10) : 1;
    if (isNaN(surveyId)) {
      surveyId = 1; // Default fallback
    }
    
    // The user's log shows: data: "{\"timestamp\":1768610296799}"
    // This is a stringified JSON. If we receive it as a string, we keep it. 
    // If we receive it as an object, we stringify it.
    let data = body.data;
    if (data && typeof data === 'object') {
      data = JSON.stringify(data);
    } else if (typeof data === 'string') {
      // It might already be a stringified JSON string from the client
      try {
        // Just verify it's valid JSON
        JSON.parse(data);
      } catch (e) {
        // If not valid JSON, wrap it
        data = JSON.stringify({ value: data });
      }
    } else {
      data = '{}';
    }
    
    const offlineId = body.offlineId || null;
    const isSynced = body.isSynced === true || body.isSynced === 'true';
    
    let folderId = body.folderId ? parseInt(body.folderId.toString(), 10) : null;
    if (body.folderId && isNaN(folderId!)) {
      folderId = null; // Fallback for invalid folderId
    }
    
    // Additional validation: if folderId is provided, check if folder exists
    if (folderId) {
      try {
        const folders = await storage.getFolders();
        const folder = folders.find(f => f.id === folderId);
        if (!folder) {
          console.log("[API] Folder not found for ID:", folderId, "setting to null");
          folderId = null;
        }
      } catch (error) {
        console.log("[API] Error checking folder existence:", error, "setting folderId to null");
        folderId = null;
      }
    }

    console.log("[API] Final normalized data:", { surveyId, folderId, data, offlineId, isSynced });

    const entry = await storage.createEntry({
      surveyId,
      folderId,
      data,
      offlineId,
      isSynced
    });

    console.log("[API] Entry created successfully with ID:", entry.id);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[API] CRITICAL POST ERROR:", error);
    
    // Check for specific database connection or permission errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: errorMessage,
      details: "Check server logs for full stack trace",
      stack: errorStack
    }, { status: 500 });
  }
}
