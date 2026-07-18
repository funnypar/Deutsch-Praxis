import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabItemsTable } from "@workspace/db";
import { eq, and, sql, like, ilike } from "drizzle-orm";
import { requireAuth, requireTeacher } from "../lib/auth";
import {
  CreateVocabItemBody,
  UpdateVocabItemBody,
  ListVocabQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatVocab(v: any) {
  return {
    id: v.id,
    german_word: v.german_word,
    translation: v.translation,
    example_sentence: v.example_sentence ?? null,
    cefr_level: v.cefr_level,
    tags: v.tags ?? [],
    created_at: v.created_at instanceof Date
      ? v.created_at.toISOString()
      : String(v.created_at),
  };
}

router.get("/vocab", requireAuth, async (req, res): Promise<void> => {
  const params = ListVocabQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { cefr_level, tag, search, limit = 50, offset = 0 } = params.data;

  const conditions = [];
  if (cefr_level) conditions.push(eq(vocabItemsTable.cefr_level, cefr_level));
  if (search) conditions.push(ilike(vocabItemsTable.german_word, `%${search}%`));
  if (tag) conditions.push(sql`${vocabItemsTable.tags} @> ARRAY[${tag}]::text[]`);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vocabItemsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const items = await db
    .select()
    .from(vocabItemsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  res.json({ items: items.map(formatVocab), total: count });
});

router.post(
  "/vocab",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const parsed = CreateVocabItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [item] = await db
      .insert(vocabItemsTable)
      .values({
        ...parsed.data,
        tags: parsed.data.tags ?? [],
      })
      .returning();

    res.status(201).json(formatVocab(item));
  }
);

router.get("/vocab/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [item] = await db
    .select()
    .from(vocabItemsTable)
    .where(eq(vocabItemsTable.id, id));

  if (!item) {
    res.status(404).json({ error: "Vocab item not found" });
    return;
  }

  res.json(formatVocab(item));
});

router.patch(
  "/vocab/:id",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const parsed = UpdateVocabItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [item] = await db
      .update(vocabItemsTable)
      .set(parsed.data)
      .where(eq(vocabItemsTable.id, id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Vocab item not found" });
      return;
    }

    res.json(formatVocab(item));
  }
);

router.delete(
  "/vocab/:id",
  requireAuth,
  requireTeacher,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    await db.delete(vocabItemsTable).where(eq(vocabItemsTable.id, id));
    res.json({ message: "Vocab item deleted" });
  }
);

export default router;
