import { z } from "zod";

/**
 * This is the contract we force the model to honor.
 * Anything that doesn't match this shape never reaches the UI —
 * it gets caught here and turned into a typed error instead.
 */

const FlashcardItem = z.object({
  type: z.literal("flashcard"),
  question: z.string().min(3, "Question too short"),
  answer: z.string().min(1, "Answer missing"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
});

const QuizItem = z.object({
  type: z.literal("quiz"),
  question: z.string().min(3, "Question too short"),
  options: z.array(z.string().min(1)).length(4, "Quiz needs exactly 4 options"),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional().default(""),
});

export const StudySetSchema = z.object({
  topic: z.string().min(1),
  mode: z.enum(["flashcards", "quiz"]),
  items: z.array(z.union([FlashcardItem, QuizItem])).min(1, "No items generated"),
});

/**
 * Validates raw model output. Returns { ok: true, data } or
 * { ok: false, reason } — never throws, so callers don't need try/catch
 * scattered around.
 */
export function validateStudySet(raw) {
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, reason: "malformed_json" };
  }

  const result = StudySetSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: "schema_mismatch", issues: result.error.issues };
  }
  if (result.data.items.length === 0) {
    return { ok: false, reason: "empty" };
  }
  return { ok: true, data: result.data };
}