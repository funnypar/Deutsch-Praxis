import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vocabItemsTable = pgTable("vocab_items", {
  id: serial("id").primaryKey(),
  german_word: text("german_word").notNull(),
  translation: text("translation").notNull(),
  example_sentence: text("example_sentence"),
  cefr_level: text("cefr_level").notNull(),
  tags: text("tags").array().notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const srsCardsTable = pgTable("srs_cards", {
  id: serial("id").primaryKey(),
  student_id: integer("student_id").notNull(),
  vocab_item_id: integer("vocab_item_id").notNull(),
  ease_factor: real("ease_factor").notNull().default(2.5),
  interval_days: integer("interval_days").notNull().default(1),
  repetitions: integer("repetitions").notNull().default(0),
  next_review_date: date("next_review_date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertVocabItemSchema = createInsertSchema(vocabItemsTable).omit({
  id: true,
  created_at: true,
});

export const insertSrsCardSchema = createInsertSchema(srsCardsTable).omit({
  id: true,
  created_at: true,
});

export type InsertVocabItem = z.infer<typeof insertVocabItemSchema>;
export type VocabItem = typeof vocabItemsTable.$inferSelect;
export type InsertSrsCard = z.infer<typeof insertSrsCardSchema>;
export type SrsCard = typeof srsCardsTable.$inferSelect;
