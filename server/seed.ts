import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Seed Admin User
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: "admin",
      password: "adminpassword", // In production, this should be hashed
      role: "admin",
    });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }

  console.log("Seeding completed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
