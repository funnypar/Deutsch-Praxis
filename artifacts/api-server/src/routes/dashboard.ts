import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentProgressTable, exercisesTable, srsCardsTable, usersTable } from "@workspace/db";
import { eq, and, sql, lte } from "drizzle-orm";
import { requireAuth, requireTeacher } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const today = new Date().toISOString().split("T")[0];

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${studentProgressTable.correct} = true)::int`,
    })
    .from(studentProgressTable)
    .where(eq(studentProgressTable.student_id, user.id));

  const [dueTodayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(srsCardsTable)
    .where(
      and(
        eq(srsCardsTable.student_id, user.id),
        lte(srsCardsTable.next_review_date, today)
      )
    );

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
    .orderBy(sql`(count(*) filter (where ${studentProgressTable.correct} = true)::float / count(*))`)
    .limit(5);

  const recentActivity = await db
    .select({
      exercise_type: exercisesTable.type,
      exercise_prompt: exercisesTable.prompt,
      correct: studentProgressTable.correct,
      last_attempted_at: studentProgressTable.last_attempted_at,
    })
    .from(studentProgressTable)
    .innerJoin(exercisesTable, eq(studentProgressTable.exercise_id, exercisesTable.id))
    .where(eq(studentProgressTable.student_id, user.id))
    .orderBy(sql`${studentProgressTable.last_attempted_at} desc`)
    .limit(10);

  const xp = (totals.correct ?? 0) * 10 + (totals.total ?? 0) * 2;
  const level = Math.floor(xp / 500) + 1;
  const xp_to_next_level = level * 500 - xp;

  res.json({
    streak: 1,
    xp,
    level,
    xp_to_next_level,
    due_today: dueTodayResult.count,
    weak_spots: weakSpots
      .filter((w) => w.grammar_tag)
      .map((w) => ({
        grammar_tag: w.grammar_tag!,
        accuracy: w.total > 0 ? w.correct_count / w.total : 0,
        total_attempts: w.total,
      })),
    recent_activity: recentActivity.map((r) => ({
      type: r.exercise_type,
      description: r.exercise_prompt.slice(0, 80),
      correct: r.correct,
      timestamp: r.last_attempted_at instanceof Date
        ? r.last_attempted_at.toISOString()
        : String(r.last_attempted_at),
    })),
    exercises_completed_today: 0,
  });
});

router.get(
  "/admin/stats",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const [studentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "student"));

    const [teacherCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "teacher"));

    const [exerciseCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(exercisesTable);

    const byLevel = await db
      .select({
        level: exercisesTable.cefr_level,
        count: sql<number>`count(*)::int`,
      })
      .from(exercisesTable)
      .groupBy(exercisesTable.cefr_level);

    const byType = await db
      .select({
        type: exercisesTable.type,
        count: sql<number>`count(*)::int`,
      })
      .from(exercisesTable)
      .groupBy(exercisesTable.type);

    res.json({
      total_students: studentCount.count,
      total_teachers: teacherCount.count,
      total_exercises: exerciseCount.count,
      total_vocab: 0,
      active_this_week: 0,
      exercises_by_level: Object.fromEntries(byLevel.map((r) => [r.level, r.count])),
      exercises_by_type: Object.fromEntries(byType.map((r) => [r.type, r.count])),
    });
  }
);

export default router;
