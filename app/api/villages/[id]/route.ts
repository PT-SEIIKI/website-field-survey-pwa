import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages, subVillages, houses, photos } from "@/shared/schema"
import { eq, inArray } from "drizzle-orm"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const villageId = parseInt(id)
    const { name } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const [updated] = await db
      .update(villages)
      .set({ name: name.trim() })
      .where(eq(villages.id, villageId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Village not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating village:", error)
    return NextResponse.json({ error: "Failed to update village" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const villageId = parseInt(id)

    // Cascade delete: photos -> houses -> sub_villages -> villages
    const subVills = await db.select().from(subVillages).where(eq(subVillages.villageId, villageId))
    for (const sv of subVills) {
      const hses = await db.select().from(houses).where(eq(houses.subVillageId, sv.id))
      for (const h of hses) {
        await db.delete(photos).where(eq(photos.houseId, h.id))
      }
      await db.delete(houses).where(eq(houses.subVillageId, sv.id))
    }
    await db.delete(subVillages).where(eq(subVillages.villageId, villageId))
    await db.delete(villages).where(eq(villages.id, villageId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting village:", error)
    return NextResponse.json({ error: "Failed to delete village" }, { status: 500 })
  }
}
