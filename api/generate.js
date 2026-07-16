import { generateStudySet } from "../lib/groq.js";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }

  const { topic, mode } = req.body || {};
  const result = await generateStudySet({
    apiKey: process.env.GROQ_API_KEY,
    userInput: topic,
    mode: mode === "quiz" ? "quiz" : "flashcards",
  });

  res.status(result.ok ? 200 : 422).json(result);
}