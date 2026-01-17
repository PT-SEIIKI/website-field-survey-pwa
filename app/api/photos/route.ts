import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API] Creating photo with body:", JSON.stringify(body));

    // Ensure entryId is a number if it exists
    if (body.entryId && typeof body.entryId === 'string') {
      body.entryId = parseInt(body.entryId, 10);
    }

    const photo = await storage.createPhoto(body);
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
