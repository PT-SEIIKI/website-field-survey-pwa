import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { houses } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.delete(houses).where(eq(houses.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting house:", error)
    return NextResponse.json({ error: "Failed to delete house" }, { status: 500 })
  }
}
