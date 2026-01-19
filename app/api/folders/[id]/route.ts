import { NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { insertFolderSchema } from "@/shared/schema";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const folders = await storage.getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) return NextResponse.json({ message: "Folder not found" }, { status: 404 });
    
    // Fetch photos for this folder
    const entries = await storage.getEntries(1); // Default surveyId 1
    const folderEntries = entries.filter(e => e.folderId === id);
    
    const photos = [];
    for (const entry of folderEntries) {
      const entryPhotos = await storage.getPhotosByEntryId(entry.id);
      photos.push(...entryPhotos);
    }

    return NextResponse.json({ ...folder, photos });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch folder" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const data = insertFolderSchema.partial().parse(body);
    const folder = await storage.updateFolder(id, data);
    return NextResponse.json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid update data", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update folder" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await storage.deleteFolder(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete folder" }, { status: 500 });
  }
}
