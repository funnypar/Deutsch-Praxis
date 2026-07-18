import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
