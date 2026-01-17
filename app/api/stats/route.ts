import { storage } from "@/server/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    // surveyId 1 is the default survey
    const entries = await storage.getEntries(1);
    
    // In our system, each entry represents one photo documentation
    // Calculate statistics
    const locations = [...new Set(entries.map((e) => {
      try {
        const data = JSON.parse(e.data);
        return data.location;
      } catch {
        return null;
      }
    }).filter(Boolean))];
    
    const dates = entries.map((e) => new Date(e.createdAt || Date.now()).toLocaleDateString("id-ID"));

    const stats = {
      totalPhotos: entries.length,
      totalSize: 0, // We'll need a better way to track actual file size if needed
      totalSizeMB: 0,
      locations: locations,
      uniqueDates: [...new Set(dates)].length,
      oldestPhoto: entries.length > 0 ? Math.min(...entries.map((e) => new Date(e.createdAt || 0).getTime())) : null,
      newestPhoto: entries.length > 0 ? Math.max(...entries.map((e) => new Date(e.createdAt || 0).getTime())) : null,
    };

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error("[API] Stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Get stats failed",
      },
      { status: 500 },
    );
  }
}
