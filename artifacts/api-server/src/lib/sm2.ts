/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5
 *   0-1 = Again (complete blackout or incorrect)
 *   2-3 = Hard (incorrect, but remembered on hint)
 *   4   = Good (correct with some difficulty)
 *   5   = Easy (perfect response)
 */
export interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string; // ISO date string YYYY-MM-DD
}

export function calculateNextReview(
  quality: number,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): SM2Result {
  let easeFactor = currentEaseFactor;
  let intervalDays = currentInterval;
  let repetitions = currentRepetitions;

  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(currentInterval * currentEaseFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  const nextReviewDate = nextDate.toISOString().split("T")[0];

  return { easeFactor, intervalDays, repetitions, nextReviewDate };
}
