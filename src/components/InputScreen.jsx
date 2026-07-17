import { useState } from "react";

export default function InputScreen({ onSubmit, disabled }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("flashcards");

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit({ topic: text.trim(), mode });
  }

  return (
    <div className="mx-auto max-w-xl px-5">
      <div className="mb-10 text-center">
        <p className="font-mono text-[11px] tracking-[0.2em] text-pine-dark/70 uppercase mb-3">
          Groq-powered · structured JSON, not chat
        </p>
       <h1 className="font-display text-5xl sm:text-6xl text-ink mb-4 tracking-wide">
          Study{" "}
          <span className="italic text-pine decoration-2 underline-offset-4 decoration-pine/60">
            smarter
          </span>
          ,
          <br />
          not{" "}
          <span className="italic text-pine  decoration-2 underline-offset-4 decoration-pine/60">
            longer
          </span>
          .
        </h1>
        <p className="text-ink-soft text-sm sm:text-base max-w-sm mx-auto leading-relaxed tracking-wide">
          Paste your notes or name a topic. Recall turns it into cards you actually have to{" "}
          <span className="font-semibold text-pine-dark">earn your way through</span>.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/55 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgba(22,36,31,0.10)] border border-white/60 p-5 sm:p-7"
      >
        <label htmlFor="topic" className="block font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft mb-2">
          Notes or topic
        </label>
        <textarea
          id="topic"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Paste your programming notes on C++ or python, or just type 'React.js'"
          rows={6}
          className="w-full resize-none rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-ink tracking-wide placeholder:text-ink-soft/60 focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20"
        />

        <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex rounded-full border border-white/70 bg-white/50 p-1">
            {[
              { key: "flashcards", label: "Flashcards" },
              { key: "quiz", label: "Quiz" },
            ].map((m) => (
              <button
                type="button"
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition-colors ${
                  mode === m.key ? "bg-pine text-white shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="px-6 py-2.5 rounded-full bg-cream text-ink font-medium text-sm tracking-wide shadow-[0_2px_10px_rgba(22,36,31,0.15)] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {disabled ? "Generating…" : "Generate set"}
          </button>
        </div>
      </form>
    </div>
  );
}