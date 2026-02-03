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

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePhoto(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Village Routes
  app.get("/api/villages", async (_req, res) => {
    try {
      const data = await storage.getVillages();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch villages" });
    }
  });

  app.post("/api/villages", async (req, res) => {
    try {
      const { name, offlineId } = req.body;
      const data = await storage.createVillage({ name, offlineId });
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create village" });
    }
  });

  app.get("/api/sub-villages", async (req, res) => {
    try {
      const villageId = req.query.villageId ? parseInt(req.query.villageId as string) : undefined;
      const data = await storage.getSubVillages(villageId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sub-villages" });
    }
  });

  app.post("/api/sub-villages", async (req, res) => {
    try {
      const { name, villageId, offlineId } = req.body;
      const data = await storage.createSubVillage({ name, villageId: parseInt(villageId), offlineId });
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sub-village" });
    }
  });

  app.get("/api/houses", async (req, res) => {
    try {
      const subVillageId = req.query.subVillageId ? parseInt(req.query.subVillageId as string) : undefined;
      const data = await storage.getHouses(subVillageId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch houses" });
    }
  });

  app.post("/api/houses", async (req, res) => {
    try {
      const { name, subVillageId, offlineId, ownerName, nik, address } = req.body;
      const data = await storage.createHouse({ 
        name, 
        subVillageId: parseInt(subVillageId), 
        offlineId,
        ownerName,
        nik,
        address
      });
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create house" });
    }
  });

  // Admin Village CRUD
  app.post("/api/admin/villages", async (req, res) => {
    try {
      const { name } = req.body;
      const data = await storage.createVillage({ name });
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create village" });
    }
  });

  app.patch("/api/admin/villages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await storage.updateVillage(id, req.body);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to update village" });
    }
  });

  app.delete("/api/admin/villages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVillage(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete village" });
    }
  });

  // Admin Sub-Village CRUD
  app.post("/api/admin/sub-villages", async (req, res) => {
    try {
      const data = await storage.createSubVillage(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sub-village" });
    }
  });

  app.patch("/api/admin/sub-villages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await storage.updateSubVillage(id, req.body);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sub-village" });
    }
  });

  app.delete("/api/admin/sub-villages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubVillage(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sub-village" });
    }
  });

  // Admin House CRUD
  app.post("/api/admin/houses", async (req, res) => {
    try {
      const data = await storage.createHouse(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create house" });
    }
  });

  app.patch("/api/admin/houses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await storage.updateHouse(id, req.body);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to update house" });
    }
  });

  app.delete("/api/admin/houses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHouse(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete house" });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
