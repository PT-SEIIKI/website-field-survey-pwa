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
    
    console.log("[API] Creating house with body:", JSON.stringify(body))
    
    if (!name || !subVillageId) {
      return NextResponse.json({ error: "Name and subVillageId are required" }, { status: 400 })
    }
    
    // Handle both numeric IDs and offline IDs
    let actualSubVillageId: number
    if (typeof subVillageId === 'string' && subVillageId.startsWith('sv_')) {
      // This is an offline ID, find the actual sub-village by offlineId
      const [subVillage] = await db.select().from(subVillages).where(eq(subVillages.offlineId, subVillageId))
      if (!subVillage) {
        return NextResponse.json({ error: "Sub-village not found with offline ID" }, { status: 404 })
      }
      actualSubVillageId = subVillage.id
    } else {
      // This is a numeric ID
      actualSubVillageId = parseInt(subVillageId)
    }
    
    // Check if house with this offlineId already exists
    if (offlineId) {
      const existing = await db.select().from(houses).where(eq(houses.offlineId, offlineId)).limit(1)
      if (existing.length > 0) {
        console.log("[API] House with offlineId already exists:", offlineId)
        return NextResponse.json(existing[0], { status: 200 })
      }
    }
    
    // Create house
    const [newHouse] = await db.insert(houses).values({ 
      name, 
      subVillageId: actualSubVillageId,
      ownerName,
      nik,
      address,
      offlineId: offlineId || `h_${Date.now()}`
    }).returning()
    
    console.log("[API] House created:", newHouse)
    
    // Get village and sub-village names for folder
    const [subVillage] = await db.select().from(subVillages).where(eq(subVillages.id, actualSubVillageId))
    const [village] = await db.select().from(villages).where(eq(villages.id, subVillage.villageId))
    
    // Auto-create folder for the house
    try {
      const [newFolder] = await db.insert(folders).values({
        name: name, // Use house name as folder name
        houseName: name,
        nik: nik || null,
        villageId: subVillage.villageId,
        subVillageId: actualSubVillageId,
        houseId: newHouse.id,
        offlineId: offlineId ? `folder_${offlineId}` : `folder_${Date.now()}`,
        isSynced: true
      }).returning()
      
      console.log(`[API] Auto-created folder ${newFolder.name} for house ${newHouse.name}`)
    } catch (folderError) {
      console.error("[API] Error auto-creating folder:", folderError)
      // Continue even if folder creation fails
    }
    
    return NextResponse.json(newHouse, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating house:", error)
    return NextResponse.json({ error: "Failed to create house", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
