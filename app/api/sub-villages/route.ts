import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { subVillages, folders, villages } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const villageId = searchParams.get("villageId")
    
    if (villageId) {
      const filtered = await db.select().from(subVillages)
        .where(eq(subVillages.villageId, parseInt(villageId)))
        .orderBy(subVillages.name)
      return NextResponse.json(filtered)
    }
    
    const all = await db.select().from(subVillages).orderBy(subVillages.name)
    return NextResponse.json(all)
  } catch (error) {
    console.error("Error fetching sub-villages:", error)
    return NextResponse.json({ error: "Failed to fetch sub-villages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, villageId, offlineId } = body
    
    if (!name || !villageId) {
      return NextResponse.json({ error: "Name and villageId are required" }, { status: 400 })
    }
    
    // Handle both numeric IDs and offline IDs
    let actualVillageId: number
    if (typeof villageId === 'string' && villageId.startsWith('v_')) {
      // This is an offline ID, find the actual village by offlineId
      const [village] = await db.select().from(villages).where(eq(villages.offlineId, villageId))
      if (!village) {
        return NextResponse.json({ error: "Village not found with offline ID" }, { status: 404 })
      }
      actualVillageId = village.id
    } else {
      // This is a numeric ID
      actualVillageId = parseInt(villageId)
    }
    
    // Create sub-village
    const [newSubVillage] = await db.insert(subVillages).values({ 
      name, 
      villageId: actualVillageId,
      offlineId: offlineId || `sv_${Date.now()}`
    }).returning()
    
    // Get village name for folder
    const [village] = await db.select().from(villages).where(eq(villages.id, actualVillageId))
    
    // Auto-create folder for the sub-village
    try {
      const [newFolder] = await db.insert(folders).values({
        name: `${village.name} - ${name}`, // Combine village and sub-village name
        villageId: actualVillageId,
        subVillageId: newSubVillage.id,
        offlineId: offlineId ? `folder_${offlineId}` : `folder_${Date.now()}`,
        isSynced: true
      }).returning()
      
      console.log(`Auto-created folder ${newFolder.name} for sub-village ${newSubVillage.name}`)
    } catch (folderError) {
      console.error("Error auto-creating folder:", folderError)
      // Continue even if folder creation fails
    }
    
    return NextResponse.json(newSubVillage, { status: 201 })
  } catch (error) {
    console.error("Error creating sub-village:", error)
    return NextResponse.json({ error: "Failed to create sub-village" }, { status: 500 })
  }
}
