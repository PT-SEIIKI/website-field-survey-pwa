import { surveys, surveyEntries, photos, type Survey, type InsertSurvey, type Entry, type InsertEntry, type Photo, type InsertPhoto } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSurveys(): Promise<Survey[]>;
  getEntries(surveyId: number): Promise<Entry[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getEntryByOfflineId(offlineId: string): Promise<Entry | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys);
  }

  async getEntries(surveyId: number): Promise<Entry[]> {
    return await db.select().from(surveyEntries).where(eq(surveyEntries.surveyId, surveyId));
  }

  async createEntry(insertEntry: InsertEntry): Promise<Entry> {
    const [entry] = await db.insert(surveyEntries).values(insertEntry).returning();
    return entry;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(insertPhoto).returning();
    return photo;
  }

  async getEntryByOfflineId(offlineId: string): Promise<Entry | undefined> {
    const [entry] = await db.select().from(surveyEntries).where(eq(surveyEntries.offlineId, offlineId));
    return entry || undefined;
  }
}

export const storage = new DatabaseStorage();
