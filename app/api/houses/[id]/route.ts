import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { houses, photos, folders, villages, subVillages } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const houseId = parseInt(id)
    if (isNaN(houseId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    // Get house with village and sub-village names
    const [house] = await db
      .select({
        id: houses.id,
        name: houses.name,
        ownerName: houses.ownerName,
        nik: houses.nik,
        address: houses.address,
        subVillageId: houses.subVillageId,
        villageName: villages.name,
        subVillageName: subVillages.name,
        createdAt: houses.createdAt
      })
      .from(houses)
      .leftJoin(subVillages, eq(houses.subVillageId, subVillages.id))
      .leftJoin(villages, eq(subVillages.villageId, villages.id))
      .where(eq(houses.id, houseId))
    
    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    console.log(`🏠 [House API] Fetched house ${houseId}:`, {
      name: house.name,
      village: house.villageName,
      subVillage: house.subVillageName
    })

    return NextResponse.json(house)
  } catch (error) {
    console.error("Error fetching house:", error)
    return NextResponse.json({ error: "Failed to fetch house" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const houseId = parseInt(id)

    // Cascade delete: photos -> houses + folders
    await db.delete(photos).where(eq(photos.houseId, houseId))
    // Delete folders associated with this house
    await db.delete(folders).where(eq(folders.houseId, houseId))
    await db.delete(houses).where(eq(houses.id, houseId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting house:", error)
    return NextResponse.json({ error: "Failed to delete house" }, { status: 500 })
  }
}
