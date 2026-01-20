import { NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function GET() {
  try {
    const users = await storage.getUsers();
    const folders = await storage.getFolders();
    const surveys = await storage.getSurveys();
    
    // Simple count for demonstration
    // In production, use database counts
    return NextResponse.json({
      users: users.length,
      folders: folders.length,
      entries: 0, // Placeholder
      photos: 0   // Placeholder
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  }
}
