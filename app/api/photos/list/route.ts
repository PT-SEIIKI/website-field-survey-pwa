import { readFile } from "fs/promises"
import { join } from "path"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const fs = await import("fs/promises")

    // Get query params for filtering
    const houseId = request.nextUrl.searchParams.get("houseId")
    const villageId = request.nextUrl.searchParams.get("villageId")
    const subVillageId = request.nextUrl.searchParams.get("subVillageId")
    const location = request.nextUrl.searchParams.get("location")
    const startDate = request.nextUrl.searchParams.get("startDate")
    const endDate = request.nextUrl.searchParams.get("endDate")

    const files = await fs.readdir(uploadsDir)

    // Read all metadata files
    const photos = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          try {
            const content = await readFile(join(uploadsDir, f), "utf-8")
            return JSON.parse(content)
          } catch {
            return null
          }
        }),
    )

    // Filter out nulls
    let filteredPhotos = photos.filter((p) => p !== null)

    // Apply filters
    if (houseId) {
      filteredPhotos = filteredPhotos.filter((p) => String(p.houseId) === houseId)
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
