import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET ?? "deutsch-praxis-secret-2025";

export interface AuthPayload {
  userId: number;
  role: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  (req as any).user = user;
  next();
}

export function requireTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as any).user;
  if (!user || user.role !== "teacher") {
    res.status(403).json({ error: "Teacher access required" });
    return;
  }
  next();
}
