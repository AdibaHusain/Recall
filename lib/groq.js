import { validateStudySet } from "./schema.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(mode) {
  const shape =
    mode === "quiz"
      ? `{"type":"quiz","question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}`
      : `{"type":"flashcard","question":"...","answer":"...","difficulty":"easy|medium|hard"}`;

  return `You are a study-material generator. Given notes or a topic from the user, output ONLY valid JSON (no markdown fences, no prose before or after) matching exactly this shape:

{
  "topic": "<short topic name>",
  "mode": "${mode}",
  "items": [ ${shape}, ... ]
}

Rules:
- Generate between 6 and 10 items.
- ${mode === "quiz" ? "Every item needs exactly 4 options and a correctIndex (0-3)." : "Keep answers concise (1-2 sentences)."}
- Base everything strictly on the user's input. Do not invent unrelated facts.
- Output raw JSON only. No commentary, no code fences.`;
}

async function callGroqOnce(apiKey, userInput, mode) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(mode) },
        { role: "user", content: userInput },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`groq_http_${res.status}:${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export async function generateStudySet({ apiKey, userInput, mode }) {
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }
  if (!userInput || userInput.trim().length < 3) {
    return { ok: false, reason: "empty_input" };
  }

  let raw;
  try {
    raw = await callGroqOnce(apiKey, userInput, mode);
  } catch (err) {
    return { ok: false, reason: "network_or_api_error", detail: String(err.message || err) };
  }

  let result = validateStudySet(raw);
  if (result.ok) return result;

  // One repair attempt: tell the model exactly what went wrong.
  try {
    const repairInput = `${userInput}\n\nYour previous response was invalid (${result.reason}). Return ONLY corrected JSON matching the required shape exactly.`;
    raw = await callGroqOnce(apiKey, repairInput, mode);
    result = validateStudySet(raw);
  } catch (err) {
    return { ok: false, reason: "network_or_api_error", detail: String(err.message || err) };
  }

  return result;
}