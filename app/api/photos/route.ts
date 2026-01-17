import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API] Creating photo with body:", JSON.stringify(body));

    const entryId = body.entryId ? parseInt(body.entryId.toString(), 10) : null;
    const url = body.url || "";
    const offlineId = body.offlineId || null;

    if (!url) {
      return NextResponse.json({ success: false, message: "URL is required" }, { status: 400 });
    }

    const photo = await storage.createPhoto({
      entryId,
      url,
      offlineId
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("[API] Create photo error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
