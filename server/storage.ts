
import { db } from "./db";
import {
  appSettings,
  pouchLogs,
  type AppSettings,
  type PouchLog,
  type InsertAppSettings,
  type InsertPouchLog,
  type UpdateAppSettingsRequest
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Settings
  getSettings(): Promise<AppSettings | undefined>;
  createSettings(settings: InsertAppSettings): Promise<AppSettings>;
  updateSettings(updates: UpdateAppSettingsRequest): Promise<AppSettings>;
  resetData(): Promise<void>;

  // Logs
  getLogs(): Promise<PouchLog[]>;
  createLog(log: InsertPouchLog): Promise<PouchLog>;
  deleteLog(id: number): Promise<void>;
  deleteLastLog(): Promise<PouchLog | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings;
  }

  async createSettings(insertSettings: InsertAppSettings): Promise<AppSettings> {
    const [settings] = await db.insert(appSettings).values(insertSettings).returning();
    return settings;
  }

  async updateSettings(updates: UpdateAppSettingsRequest): Promise<AppSettings> {
    const existing = await this.getSettings();
    if (!existing) {
      // Create default if not exists
      const defaultSettings: InsertAppSettings = {
        baselinePouchesPerDay: 8,
        costPerCan: "6.00",
        pouchesPerCan: 15,
        wakeHourStart: 8,
        wakeHourEnd: 22,
        ...updates
      };
      return this.createSettings(defaultSettings);
    }
    
    const [settings] = await db.update(appSettings)
      .set(updates)
      .where(eq(appSettings.id, existing.id))
      .returning();
    return settings;
  }

  async resetData(): Promise<void> {
    await db.delete(pouchLogs);
    // Optionally reset settings to defaults, but usually user wants to keep settings
    // Let's just clear logs as requested by "Reset data" usually implies tracking data
    // If we want to reset settings too, we can. Let's just clear logs for now.
    // The prompt says "Reset data button", typically means progress.
  }

  async getLogs(): Promise<PouchLog[]> {
    return await db.select().from(pouchLogs).orderBy(desc(pouchLogs.timestamp));
  }

  async createLog(log: InsertPouchLog): Promise<PouchLog> {
    const [newLog] = await db.insert(pouchLogs).values(log).returning();
    return newLog;
  }

  async deleteLog(id: number): Promise<void> {
    await db.delete(pouchLogs).where(eq(pouchLogs.id, id));
  }

  async deleteLastLog(): Promise<PouchLog | undefined> {
    const [lastLog] = await db.select()
      .from(pouchLogs)
      .orderBy(desc(pouchLogs.timestamp))
      .limit(1);
    
    if (lastLog) {
      await db.delete(pouchLogs).where(eq(pouchLogs.id, lastLog.id));
    }
    return lastLog;
  }
}

export const storage = new DatabaseStorage();
