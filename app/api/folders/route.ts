import { NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { insertFolderSchema } from "@/shared/schema";
import { z } from "zod";

export async function GET() {
  try {
    const folders = await storage.getFolders();
    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch folders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Preprocess: Convert integer fields from string to number if needed
    if (body.villageId !== undefined && body.villageId !== null) {
      const parsedId = parseInt(body.villageId.toString(), 10)
      if (isNaN(parsedId)) {
        return NextResponse.json({ 
          message: "Invalid villageId: must be a valid number", 
          received: body.villageId 
        }, { status: 400 })
      }
      body.villageId = parsedId
    }
    
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
    
    if (body.houseId !== undefined && body.houseId !== null) {
      const parsedId = parseInt(body.houseId.toString(), 10)
      if (isNaN(parsedId)) {
        return NextResponse.json({ 
          message: "Invalid houseId: must be a valid number", 
          received: body.houseId 
        }, { status: 400 })
      }
      body.houseId = parsedId
    }
    
    console.log("[API] Creating folder with body:", JSON.stringify(body))
    
    const data = insertFolderSchema.parse(body);
    
    const existing = await storage.getFolderByOfflineId(data.offlineId || "");
    if (existing) {
      return NextResponse.json(existing);
    }

    const folder = await storage.createFolder(data);
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[API] Folder validation error:", error.errors);
      return NextResponse.json({ message: "Invalid folder data", errors: error.errors }, { status: 400 });
    }
    console.error("[API] Error creating folder:", error);
    return NextResponse.json({ 
      message: "Failed to create folder", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
