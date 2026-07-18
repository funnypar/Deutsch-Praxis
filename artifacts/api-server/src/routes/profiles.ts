import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpdateMyProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profiles/me", requireAuth, async (req, res): Promise<void> => {
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

router.patch("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.display_name) updates.display_name = parsed.data.display_name;
  if (parsed.data.current_level) updates.current_level = parsed.data.current_level;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    display_name: updated.display_name,
    current_level: updated.current_level ?? null,
    created_at: updated.created_at.toISOString(),
  });
});

export default router;
