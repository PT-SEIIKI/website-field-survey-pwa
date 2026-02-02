import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { houses } from "@/shared/schema"
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

    const [house] = await db.select().from(houses).where(eq(houses.id, houseId))
    
    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

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
    await db.delete(houses).where(eq(houses.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting house:", error)
    return NextResponse.json({ error: "Failed to delete house" }, { status: 500 })
  }
}
