import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API] Creating photo with body:", JSON.stringify(body));

    let entryId = body.entryId ? parseInt(body.entryId.toString(), 10) : null;
    let houseId = body.houseId ? parseInt(body.houseId.toString(), 10) : null;
    const url = body.url || "";
    const offlineId = body.offlineId || null;

    if (!url) {
      return NextResponse.json({ success: false, message: "URL is required" }, { status: 400 });
    }

    // Validate entryId exists if provided
    if (entryId) {
      try {
        const entries = await storage.getEntries(1); // Get entries to check
        const entry = entries.find(e => e.id === entryId);
        if (!entry) {
          console.log("[API] Entry not found for ID:", entryId, "setting to null");
          entryId = null;
        }
      } catch (error) {
        console.log("[API] Error checking entry existence:", error, "setting entryId to null");
        entryId = null;
      }
    }

    // Validate houseId exists if provided
    if (houseId) {
      try {
        const houses = await storage.getHouses();
        const house = houses.find(h => h.id === houseId);
        if (!house) {
          console.log("[API] House not found for ID:", houseId, "setting to null");
          houseId = null;
        }
      } catch (error) {
        console.log("[API] Error checking house existence:", error, "setting houseId to null");
        houseId = null;
      }
    }

    console.log("[API] Final photo data:", { entryId, houseId, url, offlineId });

    const photo = await storage.createPhoto({
      entryId,
      houseId,
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
