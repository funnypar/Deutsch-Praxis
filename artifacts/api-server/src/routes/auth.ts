import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, display_name, role, current_level } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      password_hash,
      role: role as "student" | "teacher",
      display_name,
      current_level: current_level as any,
    })
    .returning();

  const token = signToken({ userId: user.id, role: user.role });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      current_level: user.current_level ?? null,
      created_at: user.created_at.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      current_level: user.current_level ?? null,
      created_at: user.created_at.toISOString(),
    },
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
    current_level: user.current_level ?? null,
    created_at: user.created_at.toISOString(),
  });
});

export default router;
