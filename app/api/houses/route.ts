import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { houses, folders, villages, subVillages } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subVillageId = searchParams.get("subVillageId")
    
    if (subVillageId) {
      const filtered = await db.select().from(houses)
        .where(eq(houses.subVillageId, parseInt(subVillageId)))
        .orderBy(houses.name)
      return NextResponse.json(filtered)
    }

    const houseId = searchParams.get("id")
    if (houseId) {
      const [house] = await db.select().from(houses)
        .where(eq(houses.id, parseInt(houseId)))
      return NextResponse.json(house || { error: "Not found" })
    }
    
    const all = await db.select().from(houses).orderBy(houses.name)
    return NextResponse.json(all)
  } catch (error) {
    console.error("Error fetching houses:", error)
    return NextResponse.json({ error: "Failed to fetch houses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subVillageId, offlineId, ownerName, nik, address } = body
    
    if (!name || !subVillageId) {
      return NextResponse.json({ error: "Name and subVillageId are required" }, { status: 400 })
    }
    
    // Create house
    const [newHouse] = await db.insert(houses).values({ 
      name, 
      subVillageId: parseInt(subVillageId),
      ownerName,
      nik,
      address
    }).returning()
    
    // Get village and sub-village names for folder
    const [subVillage] = await db.select().from(subVillages).where(eq(subVillages.id, parseInt(subVillageId)))
    const [village] = await db.select().from(villages).where(eq(villages.id, subVillage.villageId))
    
    // Auto-create folder for the house
    try {
      const [newFolder] = await db.insert(folders).values({
        name: name, // Use house name as folder name
        houseName: name,
        nik: nik || null,
        villageId: subVillage.villageId,
        subVillageId: parseInt(subVillageId),
        houseId: newHouse.id,
        offlineId: offlineId || `folder_${Date.now()}`,
        isSynced: true
      }).returning()
      
      console.log(`Auto-created folder ${newFolder.name} for house ${newHouse.name}`)
    } catch (folderError) {
      console.error("Error auto-creating folder:", folderError)
      // Continue even if folder creation fails
    }
    
    return NextResponse.json(newHouse, { status: 201 })
  } catch (error) {
    console.error("Error creating house:", error)
    return NextResponse.json({ error: "Failed to create house" }, { status: 500 })
  }
}
