import { readFile } from "fs/promises"
import { join } from "path"
import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uploadsDir = "/var/www/survei.seyiki.com/uploads"

    // Get metadata
    const metadataPath = join(uploadsDir, `${id}.json`)
    const metadataContent = await readFile(metadataPath, "utf-8")
    const metadata = JSON.parse(metadataContent)

    return NextResponse.json(metadata, { status: 200 })
  } catch (error) {
    console.error("[API] Get photo error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Photo not found",
      },
      { status: 404 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uploadsDir = "/var/www/survei.seyiki.com/uploads"
    const fs = await import("fs/promises")

    console.log(`[API] Deleting photo with ID: ${id}`);

    // If ID is numeric, it's a database ID for the photos table
    if (!isNaN(Number(id))) {
      await storage.deletePhoto(Number(id));
    } else {
      // If it's a string, it might be a fileName/photoId (legacy or offline)
      // We try to find and delete the entry if it matches an offlineId
      const entry = await storage.getEntryByOfflineId(id);
      if (entry) {
        await storage.deleteEntry(entry.id);
      }
    }

    // Delete photo file from filesystem
    const photoPath = join(uploadsDir, `${id}.jpg`)
    const photoPathOriginal = join(uploadsDir, id) // maybe it's the full filename
    
    await fs.unlink(photoPath).catch(() => null)
    await fs.unlink(photoPathOriginal).catch(() => null)

    // Delete metadata
    const metadataPath = join(uploadsDir, `${id}.json`)
    await fs.unlink(metadataPath).catch(() => null)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API] Delete photo error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 500 },
    )
  }
}
