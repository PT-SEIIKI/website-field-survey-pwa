import { 
  users, surveys, surveyEntries, photos, folders,
  villages, subVillages, houses,
  type User, type InsertUser,
  type Survey, type InsertSurvey,
  type Entry, type InsertEntry,
  type Photo, type InsertPhoto,
  type Folder, type InsertFolder,
  type Village, type InsertVillage,
  type SubVillage, type InsertSubVillage,
  type House, type InsertHouse
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
  getPhotosByHouseId(houseId: number): Promise<Photo[]>;
  getPhotosByEntryId(entryId: number): Promise<Photo[]>;

  // Village methods
  getVillages(): Promise<Village[]>;
  getSubVillages(villageId?: number): Promise<SubVillage[]>;
  getHouses(subVillageId?: number): Promise<House[]>;

  // Village Admin methods
  createVillage(village: InsertVillage): Promise<Village>;
  updateVillage(id: number, village: Partial<InsertVillage>): Promise<Village>;
  deleteVillage(id: number): Promise<void>;

  // Sub-Village Admin methods
  createSubVillage(subVillage: InsertSubVillage): Promise<SubVillage>;
  updateSubVillage(id: number, subVillage: Partial<InsertSubVillage>): Promise<SubVillage>;
  deleteSubVillage(id: number): Promise<void>;

  // House Admin methods
  createHouse(house: InsertHouse): Promise<House>;
  updateHouse(id: number, house: Partial<InsertHouse>): Promise<House>;
  deleteHouse(id: number): Promise<void>;
  deletePhoto(id: number): Promise<void>;
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

  async getEntries(surveyId: number): Promise<any[]> {
    return await db.select({
      id: photos.id,
      url: photos.url,
      createdAt: photos.createdAt,
      houseName: houses.name,
      ownerName: houses.ownerName,
      nik: houses.nik,
      address: houses.address,
      villageName: villages.name,
      subVillageName: subVillages.name,
    })
    .from(photos)
    .innerJoin(houses, eq(photos.houseId, houses.id))
    .innerJoin(subVillages, eq(houses.subVillageId, subVillages.id))
    .innerJoin(villages, eq(subVillages.villageId, villages.id))
    .orderBy(desc(photos.createdAt));
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

  async getPhotosByHouseId(houseId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.houseId, houseId));
  }

  async getVillages(): Promise<Village[]> {
    return await db.select().from(villages);
  }

  async getSubVillages(villageId?: number): Promise<SubVillage[]> {
    if (villageId) {
      return await db.select().from(subVillages).where(eq(subVillages.villageId, villageId));
    }
    return await db.select().from(subVillages);
  }

  async getHouses(subVillageId?: number): Promise<House[]> {
    if (subVillageId) {
      return await db.select().from(houses).where(eq(houses.subVillageId, subVillageId));
    }
    return await db.select().from(houses);
  }

  // Village Admin
  async createVillage(village: InsertVillage): Promise<Village> {
    const [data] = await db.insert(villages).values(village).returning();
    return data;
  }
  async updateVillage(id: number, updateData: Partial<InsertVillage>): Promise<Village> {
    const [data] = await db.update(villages).set(updateData).where(eq(villages.id, id)).returning();
    return data;
  }
  async deleteVillage(id: number): Promise<void> {
    const subVills = await this.getSubVillages(id);
    for (const sv of subVills) {
      await this.deleteSubVillage(sv.id);
    }
    await db.delete(villages).where(eq(villages.id, id));
  }

  // Sub-Village Admin
  async createSubVillage(subVillage: InsertSubVillage): Promise<SubVillage> {
    const [data] = await db.insert(subVillages).values(subVillage).returning();
    return data;
  }
  async updateSubVillage(id: number, updateData: Partial<InsertSubVillage>): Promise<SubVillage> {
    const [data] = await db.update(subVillages).set(updateData).where(eq(subVillages.id, id)).returning();
    return data;
  }
  async deleteSubVillage(id: number): Promise<void> {
    const hses = await this.getHouses(id);
    for (const h of hses) {
      await this.deleteHouse(h.id);
    }
    await db.delete(subVillages).where(eq(subVillages.id, id));
  }

  // House Admin
  async createHouse(house: InsertHouse): Promise<House> {
    const [data] = await db.insert(houses).values(house).returning();
    return data;
  }
  async updateHouse(id: number, updateData: Partial<InsertHouse>): Promise<House> {
    const [data] = await db.update(houses).set(updateData).where(eq(houses.id, id)).returning();
    return data;
  }
  async deleteHouse(id: number): Promise<void> {
    const phs = await this.getPhotosByHouseId(id);
    for (const p of phs) {
      await this.deletePhoto(p.id);
    }
    await db.delete(houses).where(eq(houses.id, id));
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }
}

export const storage = new DatabaseStorage();
