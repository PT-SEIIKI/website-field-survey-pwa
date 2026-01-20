import { NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { insertUserSchema } from "@shared/schema";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const data = insertUserSchema.partial().parse(body);
    const user = await storage.updateUser(id, data);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await storage.deleteUser(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}
