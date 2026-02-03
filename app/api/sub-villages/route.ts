import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"
import { insertSubVillageSchema } from "@/shared/schema"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const villageId = searchParams.get("villageId")
    
    if (villageId) {
      const filtered = await storage.getSubVillages(parseInt(villageId))
      return NextResponse.json(filtered)
    }
    
    const all = await storage.getSubVillages()
    return NextResponse.json(all)
  } catch (error) {
    console.error("Error fetching sub-villages:", error)
    return NextResponse.json({ error: "Failed to fetch sub-villages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = insertSubVillageSchema.parse(body)
    
    console.log("[API] Creating sub-village with body:", JSON.stringify(body))
    
    const subVillage = await storage.createSubVillage(data)
    return NextResponse.json(subVillage, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid sub-village data", errors: error.errors }, { status: 400 })
    }
    console.error("[API] Error creating sub-village:", error)
    return NextResponse.json({ error: "Failed to create sub-village", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
