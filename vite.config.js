import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { generateStudySet } from "./lib/groq.js";


function devApiPlugin(env) {
  return {
    name: "dev-api-plugin",
    configureServer(server) {
      server.middlewares.use("/api/generate", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, reason: "method_not_allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            const { topic, mode } = JSON.parse(body || "{}");
            const result = await generateStudySet({
              apiKey: env.GROQ_API_KEY,
              userInput: topic,
              mode: mode === "quiz" ? "quiz" : "flashcards",
            });
            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.ok ? 200 : 422;
            res.end(JSON.stringify(result));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, reason: "server_error", detail: String(err) }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), devApiPlugin(env)],
  };
});