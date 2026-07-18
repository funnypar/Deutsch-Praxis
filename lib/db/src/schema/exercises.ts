import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exerciseTypeEnum = pgEnum("exercise_type", [
  "vocab",
  "grammar",
  "listening",
  "writing",
]);

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  type: exerciseTypeEnum("type").notNull(),
  cefr_level: text("cefr_level").notNull(),
  grammar_tag: text("grammar_tag"),
  prompt: text("prompt").notNull(),
  options: jsonb("options"),
  correct_answer: text("correct_answer").notNull(),
  audio_url: text("audio_url"),
  explanation: text("explanation"),
  created_by: integer("created_by"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const studentProgressTable = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  student_id: integer("student_id").notNull(),
  exercise_id: integer("exercise_id").notNull(),
  correct: boolean("correct").notNull(),
  attempts: integer("attempts").notNull().default(1),
  last_attempted_at: timestamp("last_attempted_at").defaultNow().notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({
  id: true,
  created_at: true,
});

export const insertProgressSchema = createInsertSchema(studentProgressTable).omit({
  id: true,
  last_attempted_at: true,
});

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercisesTable.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type StudentProgress = typeof studentProgressTable.$inferSelect;
