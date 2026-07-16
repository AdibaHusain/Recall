
export async function requestStudySet({ topic, mode, signal }) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, mode }),
    signal,
  });

  const body = await res.json().catch(() => ({ ok: false, reason: "invalid_response_body" }));

  if (!res.ok && !body.reason) {
    return { ok: false, reason: `http_${res.status}` };
  }
  return body;
}