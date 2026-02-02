import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { subVillages } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.delete(subVillages).where(eq(subVillages.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sub-village:", error)
    return NextResponse.json({ error: "Failed to delete sub-village" }, { status: 500 })
  }
}
