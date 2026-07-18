import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { exercisesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// ── Level-based guidance ─────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<
  string,
  { minWords: number; targetWords: number; tips: string[] }
> = {
  A1: {
    minWords: 20,
    targetWords: 50,
    tips: [
      "Benutze einfache Sätze mit Subjekt + Verb + Objekt.",
      "Verwende häufige Wörter wie: sein, haben, gehen, kommen.",
      "Achte auf die richtige Verbkonjugation für ich / du / er.",
    ],
  },
  A2: {
    minWords: 50,
    targetWords: 100,
    tips: [
      "Versuche Konnektoren zu verwenden: und, aber, weil, dann.",
      "Beschreibe Personen oder Orte mit Adjektiven.",
      "Verwende Zeitangaben: gestern, morgen, jeden Tag.",
    ],
  },
  B1: {
    minWords: 100,
    targetWords: 180,
    tips: [
      "Gliedere deinen Text in Einleitung, Hauptteil und Schluss.",
      "Benutze das Perfekt für vergangene Ereignisse.",
      "Drücke deine Meinung aus: Ich finde / Meiner Meinung nach…",
    ],
  },
  B2: {
    minWords: 150,
    targetWords: 250,
    tips: [
      "Verwende Konjunktiv II für Hypothesen: würde, könnte, sollte.",
      "Nutze Relativsätze und Infinitivkonstruktionen.",
      "Argumentiere pro und contra mit Beispielen.",
    ],
  },
  C1: {
    minWords: 200,
    targetWords: 350,
    tips: [
      "Verwende stilistisch variierte Satzkonstruktionen.",
      "Setze Passiv und Partizipialkonstruktionen gezielt ein.",
      "Untermauere Argumente mit konkreten Belegen und Beispielen.",
    ],
  },
};

// ── Scoring heuristic (placeholder — replace body with AI call later) ────────

interface EvaluationResult {
  score: number;
  word_count: number;
  sentence_count: number;
  avg_words_per_sentence: number;
  min_words: number;
  target_words: number;
  level_tips: string[];
  recommendations: string[];
  // AI field — null until AI is wired in
  ai_feedback: null;
}

function evaluate(text: string, level: string): EvaluationResult {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG["A1"];

  // Basic tokenisation
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence =
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // ── Scoring rubric (each component 0–100, then weighted) ─────────────────
  // 1. Length score — scaled linearly from 0 → minWords → targetWords
  let lengthScore: number;
  if (wordCount === 0) {
    lengthScore = 0;
  } else if (wordCount >= config.targetWords) {
    lengthScore = 100;
  } else if (wordCount >= config.minWords) {
    const range = config.targetWords - config.minWords;
    lengthScore = 60 + Math.round(((wordCount - config.minWords) / range) * 40);
  } else {
    lengthScore = Math.round((wordCount / config.minWords) * 60);
  }

  // 2. Sentence variety score — penalise very short or very long avg
  const idealAvg = { A1: 6, A2: 8, B1: 10, B2: 12, C1: 14 }[level] ?? 10;
  const varietyDiff = Math.abs(avgWordsPerSentence - idealAvg);
  const varietyScore = Math.max(0, 100 - varietyDiff * 8);

  // 3. Connector bonus — check for common German connectors
  const connectors = [
    "und", "aber", "oder", "weil", "da", "obwohl", "wenn", "damit",
    "jedoch", "dennoch", "trotzdem", "deshalb", "außerdem", "zunächst",
    "schließlich", "einerseits", "andererseits", "zwar", "allerdings",
  ];
  const textLower = text.toLowerCase();
  const connectorHits = connectors.filter((c) =>
    new RegExp(`\\b${c}\\b`).test(textLower)
  ).length;
  const connectorScore = Math.min(100, connectorHits * 15);

  // Weighted total
  const score = Math.round(
    lengthScore * 0.5 + varietyScore * 0.3 + connectorScore * 0.2
  );

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations: string[] = [];

  if (wordCount < config.minWords) {
    const missing = config.minWords - wordCount;
    recommendations.push(
      `Dein Text ist zu kurz. Schreibe mindestens ${missing} Wörter mehr, um das Niveau ${level} zu erreichen.`
    );
  }

  if (avgWordsPerSentence < idealAvg - 3 && sentenceCount > 1) {
    recommendations.push(
      "Deine Sätze sind sehr kurz. Versuche, Sätze durch Konnektoren zu verbinden."
    );
  }

  if (avgWordsPerSentence > idealAvg + 6) {
    recommendations.push(
      "Manche Sätze sind sehr lang. Teile komplexe Sätze in kürzere, klar strukturierte Einheiten auf."
    );
  }

  if (connectorHits === 0) {
    recommendations.push(
      "Keine Konnektoren gefunden. Verbinde deine Ideen mit Wörtern wie: weil, obwohl, deshalb, außerdem."
    );
  } else if (connectorHits === 1) {
    recommendations.push(
      "Gut – du hast einen Konnektor verwendet. Versuche, noch mehr Verbindungswörter einzusetzen."
    );
  }

  // Level-specific structural advice
  if (level === "B1" || level === "B2" || level === "C1") {
    const hasOpinion = /ich finde|meiner meinung|ich glaube|ich denke|meines erachtens/i.test(text);
    if (!hasOpinion) {
      recommendations.push(
        'Bringe deine eigene Meinung ein: \u201EIch finde, dass\u2026\u201C oder \u201EMeiner Meinung nach\u2026\u201C'
      );
    }
  }

  if ((level === "B2" || level === "C1") && !/würde|könnte|sollte|hätte|wäre/i.test(text)) {
    recommendations.push(
      "Für Niveau " + level + " empfiehlt sich der Konjunktiv II (würde, könnte, sollte) für Hypothesen und höfliche Formulierungen."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Ausgezeichnete Arbeit! Dein Text erfüllt alle formalen Kriterien für Niveau " + level + "."
    );
  }

  return {
    score,
    word_count: wordCount,
    sentence_count: sentenceCount,
    avg_words_per_sentence: avgWordsPerSentence,
    min_words: config.minWords,
    target_words: config.targetWords,
    level_tips: config.tips,
    recommendations,
    ai_feedback: null, // TODO: replace with AI response
  };
}

// POST /writing/evaluate
router.post("/writing/evaluate", requireAuth, async (req, res): Promise<void> => {
  const { exercise_id, text } = req.body as {
    exercise_id?: number;
    text?: string;
  };

  if (!exercise_id || typeof exercise_id !== "number") {
    res.status(400).json({ error: "exercise_id required" });
    return;
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }

  const [exercise] = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.id, exercise_id));

  if (!exercise || exercise.type !== "writing") {
    res.status(404).json({ error: "Writing exercise not found" });
    return;
  }

  const result = evaluate(text.trim(), exercise.cefr_level);
  res.json(result);
});

export default router;
