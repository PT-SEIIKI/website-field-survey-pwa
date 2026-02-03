import { readFile } from "fs/promises"
import { join } from "path"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = process.env.NODE_ENV === "production" 
      ? join("/var/www/survei.seyiki.com", "uploads")
      : join(process.cwd(), "public", "uploads")
    const fs = await import("fs/promises")

    // Get query params for filtering
    const houseId = request.nextUrl.searchParams.get("houseId")
    const villageId = request.nextUrl.searchParams.get("villageId")
    const subVillageId = request.nextUrl.searchParams.get("subVillageId")
    const location = request.nextUrl.searchParams.get("location")
    const startDate = request.nextUrl.searchParams.get("startDate")
    const endDate = request.nextUrl.searchParams.get("endDate")

    const files = await fs.readdir(uploadsDir)
    console.log("[API] Files in uploadsDir:", files)

    // Read all metadata files
    const photos = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          try {
            const content = await readFile(join(uploadsDir, f), "utf-8")
            const data = JSON.parse(content)
            
            // Add unique ID for client-side tracking, use db ID if available
            if (!data.id) {
              data.id = data.photoId || f.replace(".json", "");
            }

            // Ensure URL is absolute for the client if it's just a filename
            if (!data.url) {
              const fileName = data.fileName || data.filename || data.fileName || f.replace(".json", ".jpg");
              data.url = `/uploads/${fileName}`;
            } else if (!data.url.startsWith("http") && !data.url.startsWith("/")) {
              data.url = `/uploads/${data.url}`;
            }
            // Add filename for client fallback
            if (!data.fileName && !data.filename) {
               data.fileName = f.replace(".json", ".jpg");
            }
            return data
          } catch {
            return null
          }
        }),
    )

    // Filter out nulls
    let filteredPhotos = photos.filter((p) => p !== null)

    // Apply filters
    if (houseId) {
      filteredPhotos = filteredPhotos.filter((p) => {
        const pId = String(p.houseId || p.house_id);
        return pId === String(houseId);
      })
    }
    if (villageId) {
      filteredPhotos = filteredPhotos.filter((p) => String(p.villageId) === villageId)
    }
    if (subVillageId) {
      filteredPhotos = filteredPhotos.filter((p) => String(p.subVillageId) === subVillageId)
    }
    if (location) {
      filteredPhotos = filteredPhotos.filter((p) => p.location?.toLowerCase().includes(location.toLowerCase()))
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0
      const end = endDate ? new Date(endDate).getTime() : Date.now()

      filteredPhotos = filteredPhotos.filter((p) => {
        const photoTime = p.timestamp || 0
        return photoTime >= start && photoTime <= end
      })
    }

    // Sort by timestamp descending
    filteredPhotos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

    return NextResponse.json(
      {
        success: true,
        photos: filteredPhotos,
        total: filteredPhotos.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[API] List photos error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "List photos failed",
      },
      { status: 500 },
    )
  }
}
