import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.delete(villages).where(eq(villages.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting village:", error)
    return NextResponse.json({ error: "Failed to delete village" }, { status: 500 })
  }
}
