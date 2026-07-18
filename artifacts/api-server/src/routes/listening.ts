import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { exercisesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// German stop words to ignore when scoring
const GERMAN_STOP_WORDS = new Set([
  "der", "die", "das", "den", "dem", "des",
  "ein", "eine", "einen", "einem", "einer", "eines",
  "und", "oder", "aber", "denn", "weil", "dass", "wenn",
  "ist", "war", "sind", "waren", "wird", "wurde", "werden",
  "hat", "hatte", "haben", "hatten",
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mein", "dein", "sein", "ihr", "unser", "euer",
  "mir", "dir", "ihm", "uns", "euch",
  "in", "an", "auf", "mit", "von", "zu", "bei", "nach",
  "über", "unter", "vor", "hinter", "neben", "zwischen",
  "nicht", "kein", "keine", "keinen", "keinem", "keiner",
  "auch", "noch", "schon", "nur", "sehr", "ganz", "immer",
  "so", "wie", "was", "wer", "wo", "wann", "warum",
  "dann", "da", "hier", "dort", "jetzt", "heute",
  "a", "the", "is", "are", "was", "were", "have", "has",
  "i", "you", "he", "she", "it", "we", "they",
  "in", "on", "at", "to", "for", "of", "with", "by",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-–—]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !GERMAN_STOP_WORDS.has(w));
}

function computeSimilarityScore(original: string, userText: string): number {
  const origTokens = tokenize(original);
  const userTokens = tokenize(userText);

  if (origTokens.length === 0) return 0;
  if (userTokens.length === 0) return 0;

  const origSet = new Set(origTokens);
  const userSet = new Set(userTokens);

  // Count how many of the original's key words appear in the user's answer
  let matches = 0;
  for (const token of origSet) {
    if (userSet.has(token)) matches++;
  }

  // Jaccard similarity on top of recall
  const union = new Set([...origSet, ...userSet]);
  const jaccard = matches / union.size;

  // Recall: what fraction of the original's key words the user captured
  const recall = matches / origSet.size;

  // Final score: weighted blend (60% recall, 40% jaccard), scaled to 0–100
  const raw = recall * 0.6 + jaccard * 0.4;
  return Math.round(raw * 100);
}

function buildFeedback(score: number): string {
  if (score >= 90) return "Ausgezeichnet! Du hast den Text sehr gut verstanden.";
  if (score >= 70) return "Gut gemacht! Du hast den wesentlichen Inhalt verstanden.";
  if (score >= 50) return "Fast da! Du hast einige wichtige Punkte erfasst, aber noch nicht den vollen Inhalt.";
  if (score >= 30) return "Du hast ein paar Schlüsselwörter erkannt. Höre nochmal zu und versuche es erneut.";
  return "Versuche es noch einmal. Höre dir den Text mehrmals an.";
}

// POST /listening/score
router.post("/listening/score", requireAuth, async (req, res): Promise<void> => {
  const { exercise_id, user_text } = req.body as {
    exercise_id?: number;
    user_text?: string;
  };

  if (!exercise_id || typeof exercise_id !== "number") {
    res.status(400).json({ error: "exercise_id required" });
    return;
  }
  if (!user_text || typeof user_text !== "string" || !user_text.trim()) {
    res.status(400).json({ error: "user_text required" });
    return;
  }

  const [exercise] = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.id, exercise_id));

  if (!exercise || exercise.type !== "listening") {
    res.status(404).json({ error: "Listening exercise not found" });
    return;
  }

  // The source text is stored in audio_url when it's a TTS text passage
  const sourceText = exercise.audio_url ?? exercise.correct_answer ?? exercise.prompt;
  const score = computeSimilarityScore(sourceText, user_text.trim());
  const passed = score >= 70;

  res.json({
    score,
    passed,
    feedback: buildFeedback(score),
    // Only reveal the full source text if passed
    source_text: passed ? sourceText : null,
  });
});

export default router;
