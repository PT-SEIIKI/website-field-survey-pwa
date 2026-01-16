import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveyEntries = pgTable("survey_entries", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id),
  data: text("data").notNull(), // JSON string of survey data
  offlineId: text("offline_id").unique(), // For tracking sync from IndexedDB
  createdAt: timestamp("created_at").defaultNow(),
  isSynced: boolean("is_synced").default(false),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => surveyEntries.id),
  url: text("url").notNull(),
  offlineId: text("offline_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSurveySchema = createInsertSchema(surveys);
export const selectSurveySchema = createSelectSchema(surveys);
export const insertEntrySchema = createInsertSchema(surveyEntries);
export const selectEntrySchema = createSelectSchema(surveyEntries);
export const insertPhotoSchema = createInsertSchema(photos);
export const selectPhotoSchema = createSelectSchema(photos);

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;
export type Entry = typeof surveyEntries.$inferSelect;
export type InsertEntry = typeof surveyEntries.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;
