import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentProgressTable, exercisesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { RecordProgressBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/progress", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = RecordProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { exercise_id, correct } = parsed.data;

  // Upsert: increment attempts, update correct status
  const [existing] = await db
    .select()
    .from(studentProgressTable)
    .where(
      and(
        eq(studentProgressTable.student_id, user.id),
        eq(studentProgressTable.exercise_id, exercise_id)
      )
    );

  let record;
  if (existing) {
    const [updated] = await db
      .update(studentProgressTable)
      .set({
        correct,
        attempts: existing.attempts + 1,
        last_attempted_at: new Date(),
      })
      .where(eq(studentProgressTable.id, existing.id))
      .returning();
    record = updated;
  } else {
    const [inserted] = await db
      .insert(studentProgressTable)
      .values({
        student_id: user.id,
        exercise_id,
        correct,
        attempts: 1,
      })
      .returning();
    record = inserted;
  }

  res.json({
    id: record.id,
    student_id: record.student_id,
    exercise_id: record.exercise_id,
    correct: record.correct,
    attempts: record.attempts,
    last_attempted_at: record.last_attempted_at instanceof Date
      ? record.last_attempted_at.toISOString()
      : String(record.last_attempted_at),
  });
});

router.get("/progress/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${studentProgressTable.correct} = true)::int`,
    })
    .from(studentProgressTable)
    .where(eq(studentProgressTable.student_id, user.id));

  // Weak spots: grammar tags with lowest accuracy
  const weakSpots = await db
    .select({
      grammar_tag: exercisesTable.grammar_tag,
      total: sql<number>`count(*)::int`,
      correct_count: sql<number>`count(*) filter (where ${studentProgressTable.correct} = true)::int`,
    })
    .from(studentProgressTable)
    .innerJoin(exercisesTable, eq(studentProgressTable.exercise_id, exercisesTable.id))
    .where(
      and(
        eq(studentProgressTable.student_id, user.id),
        sql`${exercisesTable.grammar_tag} is not null`
      )
    )
    .groupBy(exercisesTable.grammar_tag)
    .orderBy(sql`(count(*) filter (where ${studentProgressTable.correct} = true)::float / count(*))`);

  // By type breakdown
  const byType = await db
    .select({
      type: exercisesTable.type,
      total: sql<number>`count(*)::int`,
      correct_count: sql<number>`count(*) filter (where ${studentProgressTable.correct} = true)::int`,
    })
    .from(studentProgressTable)
    .innerJoin(exercisesTable, eq(studentProgressTable.exercise_id, exercisesTable.id))
    .where(eq(studentProgressTable.student_id, user.id))
    .groupBy(exercisesTable.type);

  const accuracy = totals.total > 0 ? totals.correct / totals.total : 0;

  res.json({
    total_exercises: totals.total,
    correct_answers: totals.correct,
    accuracy,
    weak_spots: weakSpots
      .filter((w) => w.grammar_tag)
      .map((w) => ({
        grammar_tag: w.grammar_tag!,
        accuracy: w.total > 0 ? w.correct_count / w.total : 0,
        total_attempts: w.total,
      }))
      .slice(0, 5),
    by_type: Object.fromEntries(
      byType.map((t) => [
        t.type,
        { total: t.total, accuracy: t.total > 0 ? t.correct_count / t.total : 0 },
      ])
    ),
  });
});

router.get("/progress/streak", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${studentProgressTable.correct} = true)::int`,
    })
    .from(studentProgressTable)
    .where(eq(studentProgressTable.student_id, user.id));

  const xp = totals.correct * 10 + totals.total * 2;
  const level = Math.floor(xp / 500) + 1;
  const xp_to_next_level = level * 500 - xp;

  res.json({
    current_streak: 1,
    longest_streak: 1,
    xp,
    level,
    xp_to_next_level,
  });
});

export default router;
