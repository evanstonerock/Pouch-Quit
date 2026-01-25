
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Settings Routes
  app.get(api.settings.get.path, async (req, res) => {
    let settings = await storage.getSettings();
    if (!settings) {
      // Create defaults if not exists
      settings = await storage.createSettings({
        baselinePouchesPerDay: 8,
        costPerCan: "6.00",
        pouchesPerCan: 15,
        wakeHourStart: 8,
        wakeHourEnd: 22,
      });
    }
    res.json(settings);
  });

  app.patch(api.settings.update.path, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.updateSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.settings.reset.path, async (req, res) => {
    await storage.resetData();
    res.json({ success: true });
  });

  // Logs Routes
  app.get(api.logs.list.path, async (req, res) => {
    const logs = await storage.getLogs();
    res.json(logs);
  });

  app.post(api.logs.create.path, async (req, res) => {
    try {
      const input = api.logs.create.input.parse(req.body) || { timestamp: new Date() };
      // If timestamp missing, default is handled by DB but Zod might strip it if strict?
      // Our schema omit id, so timestamp is optional in insert schema if defaulted? 
      // Actually schema says defaultNow() but notNull().
      // Let's ensure timestamp is present if not provided.
      const logData = { timestamp: input.timestamp || new Date() };
      
      const log = await storage.createLog(logData);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.logs.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteLog(id);
    res.status(204).send();
  });

  app.delete(api.logs.deleteLast.path, async (req, res) => {
    const deleted = await storage.deleteLastLog();
    res.status(200).json(deleted || {});
  });

  return httpServer;
}
