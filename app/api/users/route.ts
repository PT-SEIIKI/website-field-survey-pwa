import { NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { insertUserSchema } from "@shared/schema";

export async function GET() {
  try {
    const users = await storage.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = insertUserSchema.parse(body);
    const user = await storage.createUser(data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Invalid user data" }, { status: 400 });
  }
}
