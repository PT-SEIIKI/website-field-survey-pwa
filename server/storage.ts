import { 
  users, surveys, surveyEntries, photos, folders, 
  type User, type InsertUser, 
  type Survey, type InsertSurvey, 
  type Entry, type InsertEntry, 
  type Photo, type InsertPhoto, 
  type Folder, type InsertFolder 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getSurveys(): Promise<Survey[]>;
  getEntries(surveyId: number): Promise<Entry[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getEntryByOfflineId(offlineId: string): Promise<Entry | undefined>;
  // Folder methods
  getFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolderByOfflineId(offlineId: string): Promise<Folder | undefined>;
  updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder>;
  deleteFolder(id: number): Promise<void>;
  getPhotosByEntryId(entryId: number): Promise<Photo[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys);
  }

  async getEntries(surveyId: number): Promise<Entry[]> {
    return await db.select().from(surveyEntries).where(eq(surveyEntries.surveyId, surveyId));
  }

  async deleteEntry(id: number): Promise<void> {
    // Delete associated photos first to avoid foreign key constraints
    await db.delete(photos).where(eq(photos.entryId, id));
    await db.delete(surveyEntries).where(eq(surveyEntries.id, id));
  }

  async createEntry(insertEntry: InsertEntry): Promise<Entry> {
    try {
      console.log("[Storage] Inserting entry:", JSON.stringify(insertEntry));
      const [entry] = await db.insert(surveyEntries).values(insertEntry).returning();
      return entry;
    } catch (error) {
      console.error("[Storage] createEntry error:", error);
      throw error;
    }
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    try {
      console.log("[Storage] Inserting photo:", JSON.stringify(insertPhoto));
      const [photo] = await db.insert(photos).values(insertPhoto).returning();
      return photo;
    } catch (error) {
      console.error("[Storage] createPhoto error:", error);
      throw error;
    }
  }

  async getEntryByOfflineId(offlineId: string): Promise<Entry | undefined> {
    const [entry] = await db.select().from(surveyEntries).where(eq(surveyEntries.offlineId, offlineId));
    return entry || undefined;
  }

  // Folder implementation
  async getFolders(): Promise<Folder[]> {
    return await db.select().from(folders);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    try {
      console.log("[Storage] Inserting folder:", JSON.stringify(insertFolder));
      const [folder] = await db.insert(folders).values(insertFolder).returning();
      return folder;
    } catch (error) {
      console.error("[Storage] createFolder error:", error);
      throw error;
    }
  }

  async getFolderByOfflineId(offlineId: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.offlineId, offlineId));
    return folder || undefined;
  }

  async updateFolder(id: number, updateData: Partial<InsertFolder>): Promise<Folder> {
    const [updated] = await db.update(folders)
      .set(updateData)
      .where(eq(folders.id, id))
      .returning();
    return updated;
  }

  async deleteFolder(id: number): Promise<void> {
    // Optional: Update entries associated with this folder to null or delete them
    await db.update(surveyEntries)
      .set({ folderId: null })
      .where(eq(surveyEntries.folderId, id));
    
    await db.delete(folders).where(eq(folders.id, id));
  }

  async getPhotosByEntryId(entryId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.entryId, entryId));
  }
}

export const storage = new DatabaseStorage();
