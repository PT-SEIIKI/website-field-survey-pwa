import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages, folders } from "@/shared/schema"

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
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    
    // Create village
    const [newVillage] = await db.insert(villages).values({ name }).returning()
    
    // Auto-create folder for the village
    try {
      const [newFolder] = await db.insert(folders).values({
        name: name, // Use village name as folder name
        villageId: newVillage.id,
        offlineId: offlineId || `folder_${Date.now()}`,
        isSynced: true
      }).returning()
      
      console.log(`Auto-created folder ${newFolder.name} for village ${newVillage.name}`)
    } catch (folderError) {
      console.error("Error auto-creating folder:", folderError)
      // Continue even if folder creation fails
    }
    
    return NextResponse.json(newVillage, { status: 201 })
  } catch (error) {
    console.error("Error creating village:", error)
    return NextResponse.json({ error: "Failed to create village" }, { status: 500 })
  }
}
