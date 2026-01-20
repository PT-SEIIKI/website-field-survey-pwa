import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("[DB] Seeding database...");

  try {
    // Seed Admin User
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        username: "admin",
        password: "admin123",
        role: "admin",
      });
      console.log("[DB] Admin user created.");
    } else {
      // Update password to match documentation if it's different
      await db.update(users)
        .set({ password: "admin123", role: "admin" })
        .where(eq(users.username, "admin"));
      console.log("[DB] Admin user updated.");
    }

    // Seed Surveyor User
    const existingSurveyor = await db.select().from(users).where(eq(users.username, "surveyor1")).limit(1);
    if (existingSurveyor.length === 0) {
      await db.insert(users).values({
        username: "surveyor1",
        password: "password123",
        role: "user", // "user" mapping to "surveyor" role in schema or using default
      });
      console.log("[DB] Surveyor user created.");
    } else {
      await db.update(users)
        .set({ password: "password123" })
        .where(eq(users.username, "surveyor1"));
      console.log("[DB] Surveyor user updated.");
    }

    console.log("[DB] Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[DB] Seeding failed:", error);
    process.exit(1);
  }
}

seed();
