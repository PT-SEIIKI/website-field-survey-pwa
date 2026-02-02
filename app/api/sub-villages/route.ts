import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { subVillages } from "@/shared/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const villageId = searchParams.get("villageId")
    
    if (villageId) {
      const filtered = await db.select().from(subVillages)
        .where(eq(subVillages.villageId, parseInt(villageId)))
        .orderBy(subVillages.name)
      return NextResponse.json(filtered)
    }
    
    const all = await db.select().from(subVillages).orderBy(subVillages.name)
    return NextResponse.json(all)
  } catch (error) {
    console.error("Error fetching sub-villages:", error)
    return NextResponse.json({ error: "Failed to fetch sub-villages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, villageId } = body
    
    if (!name || !villageId) {
      return NextResponse.json({ error: "Name and villageId are required" }, { status: 400 })
    }
    
    const [newSubVillage] = await db.insert(subVillages).values({ 
      name, 
      villageId: parseInt(villageId) 
    }).returning()
    return NextResponse.json(newSubVillage, { status: 201 })
  } catch (error) {
    console.error("Error creating sub-village:", error)
    return NextResponse.json({ error: "Failed to create sub-village" }, { status: 500 })
  }
}
