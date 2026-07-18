import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { exercisesTable, studentProgressTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireTeacher } from "../lib/auth";
import {
  CreateExerciseBody,
  UpdateExerciseBody,
  GetExerciseParams,
  UpdateExerciseParams,
  DeleteExerciseParams,
  ListExercisesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatExercise(ex: any) {
  return {
    id: ex.id,
    type: ex.type,
    cefr_level: ex.cefr_level,
    grammar_tag: ex.grammar_tag ?? null,
    prompt: ex.prompt,
    options: ex.options ?? null,
    correct_answer: ex.correct_answer,
    audio_url: ex.audio_url ?? null,
    explanation: ex.explanation ?? null,
    created_by: ex.created_by ?? null,
    created_at: ex.created_at instanceof Date
      ? ex.created_at.toISOString()
      : String(ex.created_at),
  };
}

router.get("/exercises", requireAuth, async (req, res): Promise<void> => {
  const params = ListExercisesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { type, cefr_level, grammar_tag, limit = 20, offset = 0 } = params.data;

  let query = db.select().from(exercisesTable);

  const conditions = [];
  if (type) conditions.push(eq(exercisesTable.type, type as any));
  if (cefr_level) conditions.push(eq(exercisesTable.cefr_level, cefr_level));
  if (grammar_tag) conditions.push(eq(exercisesTable.grammar_tag, grammar_tag));

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(exercisesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const exercises = await db
    .select()
    .from(exercisesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  res.json({
    exercises: exercises.map(formatExercise),
    total: count,
  });
});

router.post(
  "/exercises",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const parsed = CreateExerciseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const user = (req as any).user;
    const [exercise] = await db
      .insert(exercisesTable)
      .values({
        ...parsed.data,
        type: parsed.data.type as any,
        created_by: user.id,
      })
      .returning();

    res.status(201).json(formatExercise(exercise));
  }
);

router.get("/exercises/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [exercise] = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.id, id));

  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  res.json(formatExercise(exercise));
});

router.patch(
  "/exercises/:id",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const parsed = UpdateExerciseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [exercise] = await db
      .update(exercisesTable)
      .set(parsed.data as any)
      .where(eq(exercisesTable.id, id))
      .returning();

    if (!exercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    res.json(formatExercise(exercise));
  }
);

router.delete(
  "/exercises/:id",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    await db.delete(exercisesTable).where(eq(exercisesTable.id, id));
    res.json({ message: "Exercise deleted" });
  }
);

export default router;
