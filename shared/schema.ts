
import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  baselinePouchesPerDay: integer("baseline_pouches_per_day").default(8).notNull(),
  costPerCan: decimal("cost_per_can", { precision: 10, scale: 2 }).default("6.00").notNull(),
  pouchesPerCan: integer("pouches_per_can").default(15).notNull(),
  wakeHourStart: integer("wake_hour_start").default(8).notNull(),
  wakeHourEnd: integer("wake_hour_end").default(22).notNull(),
});

export const pouchLogs = pgTable("pouch_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(appSettings).omit({ id: true });
export const insertLogSchema = createInsertSchema(pouchLogs, {
  timestamp: z.coerce.date(),
}).omit({ id: true });

export type AppSettings = typeof appSettings.$inferSelect;
export type PouchLog = typeof pouchLogs.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertSettingsSchema>;
export type InsertPouchLog = z.infer<typeof insertLogSchema>;

// Update request can be partial
export type UpdateAppSettingsRequest = Partial<InsertAppSettings>;
