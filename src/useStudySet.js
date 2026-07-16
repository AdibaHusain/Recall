import { useCallback, useRef, useState } from "react";
import { requestStudySet } from "./api.js";

const TIMEOUT_MS = 25000;

const ERROR_COPY = {
  missing_api_key: "No Groq API key configured on the server. Add GROQ_API_KEY to .env and restart.",
  empty_input: "Add some notes or a topic before generating.",
  malformed_json: "The model returned something that wasn't valid JSON, even after a retry.",
  schema_mismatch: "The model's response didn't match the expected shape, even after a retry.",
  empty: "No study items could be generated from that input — try adding more detail.",
  network_or_api_error: "Couldn't reach the AI provider. Check your connection and try again.",
  timeout: "That took too long and was cancelled. Try again, maybe with shorter input.",
  invalid_response_body: "The server sent back something unreadable. Try again.",
};

export function friendlyError(reason) {
  return ERROR_COPY[reason] || "Something went wrong generating your study set. Try again.";
}

export function useStudySet() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [data, setData] = useState(null);
  const [errorReason, setErrorReason] = useState(null);

  
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  const generate = useCallback(async ({ topic, mode }) => {
    // Cancel whatever was in flight before starting a new one.
    controllerRef.current?.abort();

    const thisRequestId = ++requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setErrorReason(null);

    const timeoutId = setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);

    try {
      const result = await requestStudySet({ topic, mode, signal: controller.signal });

      if (thisRequestId !== requestIdRef.current) return;

      if (result.ok) {
        setData(result.data);
        setStatus("success");
      } else {
        setErrorReason(result.reason);
        setStatus("error");
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      const reason = err?.name === "AbortError" || controller.signal.reason === "timeout" ? "timeout" : "network_or_api_error";
      setErrorReason(reason);
      setStatus("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus("idle");
    setData(null);
    setErrorReason(null);
  }, []);

  return { status, data, errorReason, generate, reset };
}