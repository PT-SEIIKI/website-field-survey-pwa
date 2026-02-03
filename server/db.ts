import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("[DB] Connecting to database...");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // Increased from 5000 to 10000ms
  idleTimeoutMillis: 30000,
  max: 20, // Maximum number of clients in the pool
});

pool.on('error', (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
});

export const db = drizzle(pool, { schema });
