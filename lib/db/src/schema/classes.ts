import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  teacher_id: integer("teacher_id").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const classMembersTable = pgTable(
  "class_members",
  {
    class_id: integer("class_id").notNull(),
    student_id: integer("student_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.class_id, t.student_id] })]
);

export const classAssignmentsTable = pgTable("class_assignments", {
  id: serial("id").primaryKey(),
  class_id: integer("class_id").notNull(),
  exercise_id: integer("exercise_id"),
  vocab_item_id: integer("vocab_item_id"),
  due_date: timestamp("due_date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({
  id: true,
  created_at: true,
});

export const insertAssignmentSchema = createInsertSchema(classAssignmentsTable).omit({
  id: true,
  created_at: true,
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof classAssignmentsTable.$inferSelect;
