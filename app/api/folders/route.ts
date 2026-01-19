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
    const data = insertFolderSchema.parse(body);
    
    const existing = await storage.getFolderByOfflineId(data.offlineId || "");
    if (existing) {
      return NextResponse.json(existing);
    }

    const folder = await storage.createFolder(data);
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid folder data", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create folder" }, { status: 500 });
  }
}
