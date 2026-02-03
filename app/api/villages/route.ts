import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { villages } from "@/shared/schema"

export async function GET() {
  try {
    const allVillages = await db.select().from(villages).orderBy(villages.name)
    return NextResponse.json(allVillages)
  } catch (error) {
    console.error("Error fetching villages:", error)
    return NextResponse.json({ error: "Failed to fetch villages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, offlineId } = body
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    
    const [newVillage] = await db.insert(villages).values({ name }).returning()
    return NextResponse.json(newVillage, { status: 201 })
  } catch (error) {
    console.error("Error creating village:", error)
    return NextResponse.json({ error: "Failed to create village" }, { status: 500 })
  }
}
