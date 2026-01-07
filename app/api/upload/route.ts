import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { type NextRequest, NextResponse } from "next/server"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
}

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), "public", "uploads")

async function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const photoId = formData.get("photoId") as string
    const location = (formData.get("location") as string) || ""
    const description = (formData.get("description") as string) || ""
    const timestamp = formData.get("timestamp") as string

    if (!file || !photoId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${photoId}.jpg`
    const filepath = join(uploadsDir, filename)

    // Save photo file
    await writeFile(filepath, buffer)

    // Save metadata
    const metadataPath = join(uploadsDir, `${photoId}.json`)
    const metadata = {
      photoId,
      filename,
      location,
      description,
      timestamp: Number.parseInt(timestamp) || Date.now(),
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
    }
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`[API] Photo uploaded: ${photoId}`)

    return NextResponse.json(
      {
        success: true,
        message: "Photo uploaded successfully",
        photoId,
        url: `/uploads/${filename}`,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[API] Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    await ensureUploadsDir()

    const fs = await import("fs/promises")
    const files = await fs.readdir(uploadsDir)

    // Filter JSON metadata files
    const photos = files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""))

    return NextResponse.json(
      {
        success: true,
        photos: photos,
        total: photos.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[API] Get photos error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Get photos failed",
      },
      { status: 500 },
    )
  }
}
