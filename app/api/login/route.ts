import { NextResponse } from "next/server";
import { storage } from "@/server/storage";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const user = await storage.getUserByUsername(username);

    if (user && user.password === password) {
      // In production, use session/JWT and hashed password
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
