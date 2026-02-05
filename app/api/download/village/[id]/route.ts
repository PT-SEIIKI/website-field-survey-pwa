import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages, subVillages, houses, photos } from "@/shared/schema"
import { eq } from "drizzle-orm"
import { createWriteStream } from "fs"
import archiver from "archiver"
import path from "path"
import fs from "fs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const villageId = parseInt(id)
    if (isNaN(villageId)) {
      return NextResponse.json({ error: "Invalid village ID" }, { status: 400 })
    }

    console.log(`📁 [Download API] Starting download for village ID: ${villageId}`)

    // Get village with all related data
    const [village] = await db.select().from(villages).where(eq(villages.id, villageId))
    if (!village) {
      console.error(`❌ [Download API] Village not found: ${villageId}`)
      return NextResponse.json({ error: "Village not found" }, { status: 404 })
    }

    // Get all sub-villages in this village
    const subVillagesList = await db
      .select()
      .from(subVillages)
      .where(eq(subVillages.villageId, villageId))

    console.log(`📁 [Download API] Processing village: ${village.name} (${subVillagesList.length} sub-villages)`)

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp', `village_${villageId}_${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    let totalPhotos = 0

    // Process each sub-village
    for (const subVillage of subVillagesList) {
      const subVillageDir = path.join(tempDir, subVillage.name)
      fs.mkdirSync(subVillageDir, { recursive: true })

      // Get all houses in this sub-village
      const housesList = await db
        .select()
        .from(houses)
        .where(eq(houses.subVillageId, subVillage.id))

      console.log(`  📍 ${subVillage.name}: ${housesList.length} houses`)

      // Process each house
      for (const house of housesList) {
        const houseDir = path.join(subVillageDir, `${house.name}_${house.nik || 'no-nik'}`)
        fs.mkdirSync(houseDir, { recursive: true })

        // Get all photos for this house
        const photosList = await db
          .select()
          .from(photos)
          .where(eq(photos.houseId, house.id))

        console.log(`    🏠 ${house.name}: ${photosList.length} photos`)
        
        // Debug: Log photo URLs
        if (photosList.length > 0) {
          console.log(`    📸 Photo URLs:`, photosList.map(p => p.url))
        }

        // Copy photos to house directory
        for (const photo of photosList) {
          if (photo.url) {
            try {
              // Extract filename from URL - handle different URL formats
              let filename = photo.url.split('/').pop() || `photo_${photo.id}.jpg`
              
              // Remove query parameters if any
              filename = filename.split('?')[0]
              
              // Try different possible paths
              const possiblePaths = [
                path.join(process.cwd(), 'public', 'uploads', filename),
                path.join(process.cwd(), 'uploads', filename),
                path.join(process.cwd(), 'public', filename)
              ]
              
              let sourcePath = ''
              let fileExists = false
              
              for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                  sourcePath = possiblePath
                  fileExists = true
                  break
                }
              }
              
              const destPath = path.join(houseDir, filename)

              if (fileExists) {
                fs.copyFileSync(sourcePath, destPath)
                totalPhotos++
                console.log(`      ✅ Copied: ${filename}`)
              } else {
                console.warn(`      ⚠️  Photo file not found for URL: ${photo.url}`)
                console.warn(`      🔍 Tried paths:`, possiblePaths)
              }
            } catch (error) {
              console.error(`      ❌ Error copying photo ${photo.id}:`, error)
            }
          }
        }

        // Create house info file
        const houseInfo = {
          name: house.name,
          ownerName: house.ownerName,
          nik: house.nik,
          address: house.address,
          photoCount: photosList.length
        }
        fs.writeFileSync(
          path.join(houseDir, 'info.json'),
          JSON.stringify(houseInfo, null, 2)
        )
      }
    }

    // Create village info file
    const villageInfo = {
      name: village.name,
      subVillageCount: subVillagesList.length,
      totalPhotos,
      downloadedAt: new Date().toISOString()
    }
    fs.writeFileSync(
      path.join(tempDir, 'village_info.json'),
      JSON.stringify(villageInfo, null, 2)
    )

    console.log(`📦 [Download API] Creating archive with ${totalPhotos} photos`)

    // Create RAR file using archiver
    const rarPath = path.join(process.cwd(), 'temp', `${village.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.rar`)
    const output = createWriteStream(rarPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve) => {
      output.on('close', () => {
        console.log(`✅ [Download API] RAR created: ${archive.pointer()} bytes`)
        
        try {
          // Read the file and send as response
          const fileBuffer = fs.readFileSync(rarPath)
          
          // Clean up temporary files
          fs.rmSync(tempDir, { recursive: true, force: true })
          fs.rmSync(rarPath, { force: true })

          if (fileBuffer.length === 0) {
            console.error('❌ [Download API] Empty file created')
            resolve(NextResponse.json({ error: 'Failed to create archive - empty file' }, { status: 500 }))
            return
          }

          const response = new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${village.name.replace(/[^a-zA-Z0-9]/g, '_')}.rar"`,
              'Content-Length': fileBuffer.length.toString()
            }
          })

          resolve(response)
        } catch (fileError) {
          console.error('❌ [Download API] File read error:', fileError)
          fs.rmSync(tempDir, { recursive: true, force: true })
          fs.rmSync(rarPath, { force: true })
          resolve(NextResponse.json({ error: 'Failed to read archive file' }, { status: 500 }))
        }
      })

      archive.on('error', (err: Error) => {
        console.error('❌ [Download API] Archive error:', err)
        fs.rmSync(tempDir, { recursive: true, force: true })
        fs.rmSync(rarPath, { force: true })
        resolve(NextResponse.json({ error: 'Failed to create archive' }, { status: 500 }))
      })

      archive.pipe(output)
      archive.directory(tempDir, false)
      archive.finalize()
    })

  } catch (error) {
    console.error('❌ [Download API] Error:', error)
    return NextResponse.json({ error: 'Failed to download village' }, { status: 500 })
  }
}
