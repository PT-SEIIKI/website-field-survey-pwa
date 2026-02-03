import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"
import { insertHouseSchema } from "@/shared/schema"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subVillageId = searchParams.get("subVillageId")
    
    if (subVillageId) {
      const filtered = await storage.getHouses(parseInt(subVillageId))
      return NextResponse.json(filtered)
    }

    const houseId = searchParams.get("id")
    if (houseId) {
      const houses = await storage.getHouses()
      const house = houses.find(h => h.id === parseInt(houseId))
      return NextResponse.json(house || { error: "Not found" })
    }
    
    const all = await storage.getHouses()
    return NextResponse.json(all)
  } catch (error) {
    console.error("Error fetching houses:", error)
    return NextResponse.json({ error: "Failed to fetch houses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Preprocess: Convert subVillageId to number if it's a string
    if (body.subVillageId !== undefined && body.subVillageId !== null) {
      const parsedId = parseInt(body.subVillageId.toString(), 10)
      if (isNaN(parsedId)) {
        return NextResponse.json({ 
          message: "Invalid subVillageId: must be a valid number", 
          received: body.subVillageId 
        }, { status: 400 })
      }
      body.subVillageId = parsedId
    }
    
    const data = insertHouseSchema.parse(body)
    
    console.log("[API] Creating house with body:", JSON.stringify(body))
    
    const house = await storage.createHouse(data)
    return NextResponse.json(house, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid house data", errors: error.errors }, { status: 400 })
    }
    console.error("[API] Error creating house:", error)
    return NextResponse.json({ error: "Failed to create house", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
