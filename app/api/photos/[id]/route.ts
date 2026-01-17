import { readFile } from "fs/promises"
import { join } from "path"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const uploadsDir = join(process.cwd(), "uploads")

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
    const uploadsDir = join(process.cwd(), "uploads")
    const fs = await import("fs/promises")

    // If ID is numeric, it might be a direct entry ID deletion
    if (!isNaN(Number(id))) {
      await storage.deleteEntry(Number(id));
    }

    // Delete photo file
    const photoPath = join(uploadsDir, `${id}.jpg`)
    await fs.unlink(photoPath).catch(() => null)

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
