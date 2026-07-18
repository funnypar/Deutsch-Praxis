import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  classesTable,
  classMembersTable,
  classAssignmentsTable,
  usersTable,
  studentProgressTable,
  exercisesTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireTeacher } from "../lib/auth";
import {
  CreateClassBody,
  AddClassMemberBody,
  CreateAssignmentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/classes", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  if (user.role === "teacher") {
    const classes = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.teacher_id, user.id));

    const withCounts = await Promise.all(
      classes.map(async (c) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(classMembersTable)
          .where(eq(classMembersTable.class_id, c.id));
        return {
          id: c.id,
          teacher_id: c.teacher_id,
          name: c.name,
          member_count: count,
          created_at: c.created_at.toISOString(),
        };
      })
    );
    res.json({ classes: withCounts });
  } else {
    const memberships = await db
      .select({ class_id: classMembersTable.class_id })
      .from(classMembersTable)
      .where(eq(classMembersTable.student_id, user.id));

    if (memberships.length === 0) {
      res.json({ classes: [] });
      return;
    }

    const classIds = memberships.map((m) => m.class_id);
    const classes = await db
      .select()
      .from(classesTable)
      .where(sql`${classesTable.id} = ANY(${classIds})`);

    res.json({
      classes: classes.map((c) => ({
        id: c.id,
        teacher_id: c.teacher_id,
        name: c.name,
        member_count: 0,
        created_at: c.created_at.toISOString(),
      })),
    });
  }
});

router.post(
  "/classes",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const user = (req as any).user;
    const parsed = CreateClassBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [cls] = await db
      .insert(classesTable)
      .values({ teacher_id: user.id, name: parsed.data.name })
      .returning();

    res.status(201).json({
      id: cls.id,
      teacher_id: cls.teacher_id,
      name: cls.name,
      member_count: 0,
      created_at: cls.created_at.toISOString(),
    });
  }
);

router.get("/classes/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [cls] = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.id, id));

  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const members = await db
    .select({
      id: usersTable.id,
      display_name: usersTable.display_name,
      email: usersTable.email,
      current_level: usersTable.current_level,
    })
    .from(classMembersTable)
    .innerJoin(usersTable, eq(classMembersTable.student_id, usersTable.id))
    .where(eq(classMembersTable.class_id, id));

  res.json({
    id: cls.id,
    teacher_id: cls.teacher_id,
    name: cls.name,
    created_at: cls.created_at.toISOString(),
    members: members.map((m) => ({
      id: m.id,
      display_name: m.display_name,
      email: m.email,
      current_level: m.current_level ?? null,
    })),
  });
});

router.delete(
  "/classes/:id",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    await db.delete(classAssignmentsTable).where(eq(classAssignmentsTable.class_id, id));
    await db.delete(classMembersTable).where(eq(classMembersTable.class_id, id));
    await db.delete(classesTable).where(eq(classesTable.id, id));
    res.json({ message: "Class deleted" });
  }
);

router.post(
  "/classes/:id/members",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const classId = parseInt(raw, 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: "Invalid class ID" });
      return;
    }

    const parsed = AddClassMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [student] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.student_email));

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    if (student.role !== "student") {
      res.status(400).json({ error: "User is not a student" });
      return;
    }

    await db
      .insert(classMembersTable)
      .values({ class_id: classId, student_id: student.id })
      .onConflictDoNothing();

    res.status(201).json({ message: "Student added to class" });
  }
);

router.delete(
  "/classes/:id/members/:studentId",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rawSid = Array.isArray(req.params.studentId)
      ? req.params.studentId[0]
      : req.params.studentId;
    const classId = parseInt(rawId, 10);
    const studentId = parseInt(rawSid, 10);

    if (isNaN(classId) || isNaN(studentId)) {
      res.status(400).json({ error: "Invalid IDs" });
      return;
    }

    await db
      .delete(classMembersTable)
      .where(
        and(
          eq(classMembersTable.class_id, classId),
          eq(classMembersTable.student_id, studentId)
        )
      );

    res.json({ message: "Student removed from class" });
  }
);

router.get(
  "/classes/:id/assignments",
  requireAuth,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const classId = parseInt(raw, 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: "Invalid class ID" });
      return;
    }

    const assignments = await db
      .select()
      .from(classAssignmentsTable)
      .where(eq(classAssignmentsTable.class_id, classId));

    res.json({
      assignments: assignments.map((a) => ({
        id: a.id,
        class_id: a.class_id,
        exercise_id: a.exercise_id ?? null,
        vocab_item_id: a.vocab_item_id ?? null,
        due_date: a.due_date instanceof Date ? a.due_date.toISOString() : String(a.due_date),
        created_at: a.created_at instanceof Date ? a.created_at.toISOString() : String(a.created_at),
      })),
    });
  }
);

router.post(
  "/classes/:id/assignments",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const classId = parseInt(raw, 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: "Invalid class ID" });
      return;
    }

    const parsed = CreateAssignmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [assignment] = await db
      .insert(classAssignmentsTable)
      .values({
        class_id: classId,
        exercise_id: parsed.data.exercise_id ?? null,
        vocab_item_id: parsed.data.vocab_item_id ?? null,
        due_date: new Date(parsed.data.due_date),
      })
      .returning();

    res.status(201).json({
      id: assignment.id,
      class_id: assignment.class_id,
      exercise_id: assignment.exercise_id ?? null,
      vocab_item_id: assignment.vocab_item_id ?? null,
      due_date: assignment.due_date instanceof Date
        ? assignment.due_date.toISOString()
        : String(assignment.due_date),
      created_at: assignment.created_at instanceof Date
        ? assignment.created_at.toISOString()
        : String(assignment.created_at),
    });
  }
);

router.get(
  "/classes/:id/analytics",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const classId = parseInt(raw, 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: "Invalid class ID" });
      return;
    }

    const [cls] = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, classId));

    if (!cls) {
      res.status(404).json({ error: "Class not found" });
      return;
    }

    const members = await db
      .select({
        id: usersTable.id,
        display_name: usersTable.display_name,
        email: usersTable.email,
        current_level: usersTable.current_level,
      })
      .from(classMembersTable)
      .innerJoin(usersTable, eq(classMembersTable.student_id, usersTable.id))
      .where(eq(classMembersTable.class_id, classId));

    const studentAnalytics = await Promise.all(
      members.map(async (member) => {
        const [stats] = await db
          .select({
            total: sql<number>`count(*)::int`,
            correct: sql<number>`count(*) filter (where ${studentProgressTable.correct} = true)::int`,
          })
          .from(studentProgressTable)
          .where(eq(studentProgressTable.student_id, member.id));

        const [lastActive] = await db
          .select({ last: sql<string>`max(${studentProgressTable.last_attempted_at})` })
          .from(studentProgressTable)
          .where(eq(studentProgressTable.student_id, member.id));

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
              eq(studentProgressTable.student_id, member.id),
              sql`${exercisesTable.grammar_tag} is not null`
            )
          )
          .groupBy(exercisesTable.grammar_tag)
          .orderBy(sql`(count(*) filter (where ${studentProgressTable.correct} = true)::float / count(*))`)
          .limit(3);

        return {
          student_id: member.id,
          display_name: member.display_name,
          email: member.email,
          current_level: member.current_level ?? null,
          accuracy: (stats.total ?? 0) > 0 ? (stats.correct ?? 0) / stats.total : 0,
          total_attempts: stats.total ?? 0,
          last_active: lastActive.last ?? null,
          weak_spots: weakSpots
            .filter((w) => w.grammar_tag)
            .map((w) => ({
              grammar_tag: w.grammar_tag!,
              accuracy: w.total > 0 ? w.correct_count / w.total : 0,
              total_attempts: w.total,
            })),
        };
      })
    );

    res.json({
      class_id: cls.id,
      class_name: cls.name,
      students: studentAnalytics,
    });
  }
);

export default router;
