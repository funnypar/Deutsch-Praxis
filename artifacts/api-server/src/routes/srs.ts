import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { srsCardsTable, vocabItemsTable } from "@workspace/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { SubmitSrsReviewBody, EnqueueSrsVocabBody } from "@workspace/api-zod";
import { calculateNextReview } from "../lib/sm2";

const router: IRouter = Router();

function formatCard(card: any, vocabItem?: any) {
  return {
    id: card.id,
    student_id: card.student_id,
    vocab_item_id: card.vocab_item_id,
    ease_factor: card.ease_factor,
    interval_days: card.interval_days,
    repetitions: card.repetitions,
    next_review_date: card.next_review_date,
    ...(vocabItem
      ? {
          vocab_item: {
            id: vocabItem.id,
            german_word: vocabItem.german_word,
            translation: vocabItem.translation,
            example_sentence: vocabItem.example_sentence ?? null,
            cefr_level: vocabItem.cefr_level,
            tags: vocabItem.tags ?? [],
            created_at: vocabItem.created_at instanceof Date
              ? vocabItem.created_at.toISOString()
              : String(vocabItem.created_at),
          },
        }
      : {}),
  };
}

router.get("/srs/due", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const today = new Date().toISOString().split("T")[0];

  const cards = await db
    .select({
      card: srsCardsTable,
      vocab: vocabItemsTable,
    })
    .from(srsCardsTable)
    .innerJoin(vocabItemsTable, eq(srsCardsTable.vocab_item_id, vocabItemsTable.id))
    .where(
      and(
        eq(srsCardsTable.student_id, user.id),
        lte(srsCardsTable.next_review_date, today)
      )
    )
    .limit(50);

  res.json({
    cards: cards.map((r) => formatCard(r.card, r.vocab)),
    total_due: cards.length,
  });
});

router.post("/srs/review", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = SubmitSrsReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { card_id, quality } = parsed.data;

  const [card] = await db
    .select()
    .from(srsCardsTable)
    .where(and(eq(srsCardsTable.id, card_id), eq(srsCardsTable.student_id, user.id)));

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const result = calculateNextReview(
    quality,
    card.ease_factor,
    card.interval_days,
    card.repetitions
  );

  const [updated] = await db
    .update(srsCardsTable)
    .set({
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      next_review_date: result.nextReviewDate,
    })
    .where(eq(srsCardsTable.id, card_id))
    .returning();

  res.json(formatCard(updated));
});

router.post("/srs/enqueue", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = EnqueueSrsVocabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { vocab_item_id } = parsed.data;

  // Check item exists
  const [vocabItem] = await db
    .select()
    .from(vocabItemsTable)
    .where(eq(vocabItemsTable.id, vocab_item_id));

  if (!vocabItem) {
    res.status(404).json({ error: "Vocab item not found" });
    return;
  }

  // Check if already queued
  const [existing] = await db
    .select()
    .from(srsCardsTable)
    .where(
      and(
        eq(srsCardsTable.student_id, user.id),
        eq(srsCardsTable.vocab_item_id, vocab_item_id)
      )
    );

  if (existing) {
    res.status(400).json({ error: "Already in your queue" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const [card] = await db
    .insert(srsCardsTable)
    .values({
      student_id: user.id,
      vocab_item_id,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      next_review_date: today,
    })
    .returning();

  res.status(201).json(formatCard(card));
});

router.get("/srs/stats", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const today = new Date().toISOString().split("T")[0];

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      due_today: sql<number>`count(*) filter (where ${srsCardsTable.next_review_date} <= ${today})::int`,
      mastered: sql<number>`count(*) filter (where ${srsCardsTable.interval_days} >= 21)::int`,
      learning: sql<number>`count(*) filter (where ${srsCardsTable.interval_days} < 21 and ${srsCardsTable.repetitions} > 0)::int`,
      new_cards: sql<number>`count(*) filter (where ${srsCardsTable.repetitions} = 0)::int`,
    })
    .from(srsCardsTable)
    .where(eq(srsCardsTable.student_id, user.id));

  res.json({
    total_cards: stats.total,
    due_today: stats.due_today,
    mastered: stats.mastered,
    learning: stats.learning,
    new_cards: stats.new_cards,
    reviews_this_week: 0,
  });
});

export default router;
