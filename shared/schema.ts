import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  houseName: text("house_name"),
  nik: text("nik"),
  offlineId: text("offline_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  isSynced: boolean("is_synced").default(false),
});

export const surveyEntries = pgTable("survey_entries", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id),
  folderId: integer("folder_id").references(() => folders.id),
  data: text("data").notNull(), // JSON string of survey data
  offlineId: text("offline_id").unique(), // For tracking sync from IndexedDB
  createdAt: timestamp("created_at").defaultNow(),
  isSynced: boolean("is_synced").default(false),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => surveyEntries.id),
  houseId: integer("house_id").references(() => houses.id),
  url: text("url").notNull(),
  offlineId: text("offline_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const villages = pgTable("villages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subVillages = pgTable("sub_villages", {
  id: serial("id").primaryKey(),
  villageId: integer("village_id").references(() => villages.id).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const houses = pgTable("houses", {
  id: serial("id").primaryKey(),
  subVillageId: integer("sub_village_id").references(() => subVillages.id).notNull(),
  name: text("name").notNull(),
  ownerName: text("owner_name"),
  nik: text("nik"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVillageSchema = createInsertSchema(villages);
export const selectVillageSchema = createSelectSchema(villages);
export const insertSubVillageSchema = createInsertSchema(subVillages);
export const selectSubVillageSchema = createSelectSchema(subVillages);
export const insertHouseSchema = createInsertSchema(houses);
export const selectHouseSchema = createSelectSchema(houses);

export type Village = typeof villages.$inferSelect;
export type InsertVillage = typeof villages.$inferInsert;
export type SubVillage = typeof subVillages.$inferSelect;
export type InsertSubVillage = typeof subVillages.$inferInsert;
export type House = typeof houses.$inferSelect;
export type InsertHouse = typeof houses.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertSurveySchema = createInsertSchema(surveys);
export const selectSurveySchema = createSelectSchema(surveys);
export const insertFolderSchema = createInsertSchema(folders);
export const selectFolderSchema = createSelectSchema(folders);
export const insertEntrySchema = createInsertSchema(surveyEntries);
export const selectEntrySchema = createSelectSchema(surveyEntries);
export const insertPhotoSchema = createInsertSchema(photos);
export const selectPhotoSchema = createSelectSchema(photos);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;
export type Entry = typeof surveyEntries.$inferSelect;
export type InsertEntry = typeof surveyEntries.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;
