import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const photo = await storage.createPhoto(body);
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("[API] Create photo error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
