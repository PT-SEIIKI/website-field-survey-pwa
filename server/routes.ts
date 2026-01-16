import express, { type Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertEntrySchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: express.Express) {
  // Get all surveys
  app.get("/api/surveys", async (_req, res) => {
    try {
      const surveys = await storage.getSurveys();
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  // Create a survey entry (sync from offline)
  app.post("/api/entries", async (req, res) => {
    try {
      const data = insertEntrySchema.parse(req.body);
      
      // Check if already synced
      const existing = await storage.getEntryByOfflineId(data.offlineId || "");
      if (existing) {
        return res.json(existing);
      }

      const entry = await storage.createEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid survey data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create entry" });
      }
    }
  });

  // Upload photo for an entry
  app.post("/api/photos", async (req, res) => {
    // Note: In a real app, we'd use multer for file uploads
    // For this migration, we'll assume the URL is sent or handled by a separate storage service
    try {
      const { entryId, url, offlineId } = req.body;
      const photo = await storage.createPhoto({ entryId, url, offlineId });
      res.status(201).json(photo);
    } catch (error) {
      res.status(500).json({ message: "Failed to save photo metadata" });
    }
  });

  return app;
}
