import { readFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET() {
  try {
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const fs = await import("fs/promises")

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

    const validPhotos = photos.filter((p) => p !== null)

    // Calculate statistics
    const totalSize = validPhotos.reduce((sum, p) => sum + (p.size || 0), 0)
    const locations = [...new Set(validPhotos.map((p) => p.location).filter(Boolean))]
    const dates = validPhotos.map((p) => new Date(p.timestamp).toLocaleDateString("id-ID"))

    const stats = {
      totalPhotos: validPhotos.length,
      totalSize: totalSize,
      totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      locations: locations,
      uniqueDates: [...new Set(dates)].length,
      oldestPhoto: validPhotos.length > 0 ? Math.min(...validPhotos.map((p) => p.timestamp)) : null,
      newestPhoto: validPhotos.length > 0 ? Math.max(...validPhotos.map((p) => p.timestamp)) : null,
    }

    return NextResponse.json({ success: true, stats }, { status: 200 })
  } catch (error) {
    console.error("[API] Stats error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Get stats failed",
      },
      { status: 500 },
    )
  }
}
