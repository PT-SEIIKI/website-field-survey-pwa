import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages, subVillages, houses, photos } from "@/shared/schema"
import { eq, inArray } from "drizzle-orm"

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
