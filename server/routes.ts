import express, { type Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertEntrySchema, insertFolderSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: express.Express) {
  // User Management Routes
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, data);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all surveys
  app.get("/api/surveys", async (_req, res) => {
    try {
      const surveys = await storage.getSurveys();
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  // Folder Routes
  app.get("/api/folders", async (_req, res) => {
    try {
      const folders = await storage.getFolders();
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.get("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const folders = await storage.getFolders();
      const folder = folders.find(f => f.id === id);
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folder" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const data = insertFolderSchema.parse(req.body);
      
      const existing = await storage.getFolderByOfflineId(data.offlineId || "");
      if (existing) {
        return res.json(existing);
      }

      const folder = await storage.createFolder(data);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create folder" });
      }
    }
  });

  app.patch("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(id, data);
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update folder" });
      }
    }
  });

  app.delete("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFolder(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
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
    try {
      const { entryId, url, offlineId } = req.body;
      const photo = await storage.createPhoto({ entryId, url, offlineId });
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error creating photo:", error);
      res.status(500).json({ message: "Failed to save photo metadata" });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
