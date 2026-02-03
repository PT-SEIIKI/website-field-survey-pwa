import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages, folders } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const allVillages = await db.select().from(villages).orderBy(villages.name)
    return NextResponse.json(allVillages)
  } catch (error) {
    console.error("Error fetching villages:", error)
    return NextResponse.json({ error: "Failed to fetch villages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, offlineId } = body
    
    console.log("[API] Creating village with body:", JSON.stringify(body))
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    
    // Check if village with this offlineId already exists
    if (offlineId) {
      const existing = await db.select().from(villages).where(eq(villages.offlineId, offlineId)).limit(1)
      if (existing.length > 0) {
        console.log("[API] Village with offlineId already exists:", offlineId)
        return NextResponse.json(existing[0], { status: 200 })
      }
    }
    
    // Create village
    const [newVillage] = await db.insert(villages).values({ 
      name,
      offlineId: offlineId || `v_${Date.now()}`
    }).returning()
    
    console.log("[API] Village created:", newVillage)
    
    // Auto-create folder for the village
    try {
      const [newFolder] = await db.insert(folders).values({
        name: name, // Use village name as folder name
        villageId: newVillage.id,
        offlineId: offlineId ? `folder_${offlineId}` : `folder_${Date.now()}`,
        isSynced: true
      }).returning()
      
      console.log(`[API] Auto-created folder ${newFolder.name} for village ${newVillage.name}`)
    } catch (folderError) {
      console.error("[API] Error auto-creating folder:", folderError)
      // Continue even if folder creation fails
    }
    
    return NextResponse.json(newVillage, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating village:", error)
    return NextResponse.json({ error: "Failed to create village", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
