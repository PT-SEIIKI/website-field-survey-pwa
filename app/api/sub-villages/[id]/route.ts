import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { subVillages, houses, photos } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subVillageId = parseInt(id)
    const { name } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const [updated] = await db
      .update(subVillages)
      .set({ name: name.trim() })
      .where(eq(subVillages.id, subVillageId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Sub-village not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating sub-village:", error)
    return NextResponse.json({ error: "Failed to update sub-village" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subVillageId = parseInt(id)

    // Cascade delete: photos -> houses -> sub_villages
    const hses = await db.select().from(houses).where(eq(houses.subVillageId, subVillageId))
    for (const h of hses) {
      await db.delete(photos).where(eq(photos.houseId, h.id))
    }
    await db.delete(houses).where(eq(houses.subVillageId, subVillageId))
    await db.delete(subVillages).where(eq(subVillages.id, subVillageId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sub-village:", error)
    return NextResponse.json({ error: "Failed to delete sub-village" }, { status: 500 })
  }
}
