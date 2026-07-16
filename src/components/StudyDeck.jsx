import { useEffect, useMemo, useRef, useState } from "react";

const MASTERY_TARGET = 2; // consecutive "Got it" ratings needed to graduate

function initMastery(items) {
  const map = {};
  items.forEach((item, i) => {
    map[i] = { streak: 0, mastered: false };
  });
  return map;
}

const FEEDBACK_COPY = {
  mastered: { tone: "pine", text: "Mastered — this card is done." },
  progress: (streak) => ({ tone: "pine", text: `${streak}/${MASTERY_TARGET} — one more correct answer to master it.` }),
  shaky: { tone: "gold", text: "A bit shaky — it'll come back around soon." },
  missed: { tone: "error", text: "Missed — back to square one, try again soon." },
};

const FEEDBACK_TONE_CLASS = {
  pine: "text-pine-dark",
  gold: "text-gold",
  error: "text-error",
};

export default function StudyDeck({ topic, items, onRestart }) {
  const [mastery, setMastery] = useState(() => initMastery(items));
  const [queue, setQueue] = useState(() => items.map((_, i) => i));
  const [pointer, setPointer] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // { tone, text } | null
  const [pending, setPending] = useState(false); // true while a feedback message is showing, blocks input
  const [justMasteredFlash, setJustMasteredFlash] = useState(false);

  // Session stats — purely additive, don't affect the mastery logic above.
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const reviewedSetRef = useRef(new Set());
  const startTimeRef = useRef(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const masteredCount = useMemo(
    () => Object.values(mastery).filter((m) => m.mastered).length,
    [mastery]
  );

  // Granular progress: each card contributes up to MASTERY_TARGET "points"
  // to the bar, so a single correct answer moves it — not just full mastery.
  const progressRatio = useMemo(() => {
    const points = Object.values(mastery).reduce((sum, m) => sum + Math.min(m.streak, MASTERY_TARGET), 0);
    return points / (items.length * MASTERY_TARGET);
  }, [mastery, items.length]);

  const total = items.length;
  const allDone = masteredCount === total;

  const currentIndex = queue[pointer % queue.length];
  const current = items[currentIndex];

  function rate(outcome) {
    if (pending) return;
    const entry = mastery[currentIndex];
    const newStreak = outcome === "got_it" ? entry.streak + 1 : 0;
    const justMastered = outcome === "got_it" && newStreak >= MASTERY_TARGET;

    setAttempts((a) => a + 1);
    if (outcome === "got_it") setCorrectCount((c) => c + 1);
    if (!reviewedSetRef.current.has(currentIndex)) {
      reviewedSetRef.current.add(currentIndex);
      setReviewedCount(reviewedSetRef.current.size);
    }

    setMastery((prev) => ({
      ...prev,
      [currentIndex]: { streak: newStreak, mastered: justMastered || prev[currentIndex].mastered },
    }));

    if (justMastered) {
      setFeedback(FEEDBACK_COPY.mastered);
      setJustMasteredFlash(true);
      setTimeout(() => setJustMasteredFlash(false), 700);
    } else if (outcome === "got_it") setFeedback(FEEDBACK_COPY.progress(newStreak));
    else if (outcome === "shaky") setFeedback(FEEDBACK_COPY.shaky);
    else setFeedback(FEEDBACK_COPY.missed);

    setPending(true);
    setTimeout(() => {
      const nextQueue = justMastered
        ? (() => {
            const q = queue.filter((i) => i !== currentIndex);
            return q.length ? q : queue;
          })()
        : [...queue.filter((i) => i !== currentIndex), currentIndex];

      setQueue(nextQueue);
      setFlipped(false);
      setSelectedOption(null);
      setFeedback(null);
      setPending(false);
      if (nextQueue.length > 0) setPointer((p) => (p + 1) % nextQueue.length);
    }, 1000);
  }

  function pickQuizOption(idx) {
    if (pending || selectedOption !== null) return;
    setSelectedOption(idx);
    const correct = idx === current.correctIndex;
    setTimeout(() => rate(correct ? "got_it" : "missed"), 700);
  }

  return (
    <div className="mx-auto max-w-xl px-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">{topic}</p>
          <p className="font-mono text-sm text-pine-dark tracking-wide">
            {masteredCount}/{total} mastered
          </p>
        </div>
        <button onClick={onRestart} className="text-xs font-medium tracking-wide text-ink-soft hover:text-ink underline underline-offset-2">
          New set
        </button>
      </div>

      <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mb-3 border border-white/60">
        <div className="h-full bg-pine transition-all duration-500" style={{ width: `${progressRatio * 100}%` }} />
      </div>

      <div className="h-5 mb-3 text-center">
        {feedback && (
          <p className={`text-xs font-medium tracking-wide ${FEEDBACK_TONE_CLASS[feedback.tone]}`}>{feedback.text}</p>
        )}
      </div>

      {allDone ? (
        <div className="bg-white/55 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgba(22,36,31,0.10)] p-8 text-center">
          <p className="font-display text-3xl text-ink mb-2 tracking-wide">Deck cleared</p>
          <p className="text-ink-soft text-sm mb-5 tracking-wide">All {total} items mastered on "{topic}".</p>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 rounded-full bg-cream text-ink text-sm font-medium tracking-wide shadow-[0_2px_10px_rgba(22,36,31,0.15)] hover:bg-white transition-colors"
          >
            Study something else
          </button>
        </div>
      ) : current.type === "quiz" ? (
        <QuizCard item={current} selectedOption={selectedOption} onPick={pickQuizOption} pending={pending} />
      ) : (
        <FlashcardCard item={current} flipped={flipped} onFlip={() => !pending && setFlipped((f) => !f)} onRate={rate} pending={pending} />
      )}

      {justMasteredFlash && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="animate-stamp border-4 border-gold text-gold font-display text-3xl px-6 py-2 rounded-2xl -rotate-6 bg-white/90 backdrop-blur tracking-wide">
            MASTERED
          </div>
        </div>
      )}

      <StatsFooter attempts={attempts} correctCount={correctCount} reviewedCount={reviewedCount} elapsedSec={elapsedSec} />
    </div>
  );
}

function StatsFooter({ attempts, correctCount, reviewedCount, elapsedSec }) {
  const accuracy = attempts === 0 ? null : Math.round((correctCount / attempts) * 100);
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  return (
    <div className="mt-6 flex justify-center gap-2 flex-wrap">
      <StatPill label="Accuracy" value={accuracy === null ? "—" : `${accuracy}%`} />
      <StatPill label="Reviewed" value={String(reviewedCount)} />
      <StatPill label="Time" value={`${mm}:${ss}`} />
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-full px-4 py-1.5 flex items-baseline gap-1.5">
      <span className="font-mono text-sm text-ink tracking-wide">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">{label}</span>
    </div>
  );
}

function FlashcardCard({ item, flipped, onFlip, onRate, pending }) {
  const sceneRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e) {
    const el = sceneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 8 }); // subtle: max ~8deg
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div>
      <div
        ref={sceneRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flip-scene h-56 mb-5"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform 150ms ease-out" }}
      >
        <div className={`flip-card relative h-full w-full ${flipped ? "is-flipped" : ""}`}>
          <FaceCard label="Question" text={item.question} onClick={onFlip} className="flip-face" />
          <FaceCard label="Answer" text={item.answer} onClick={onFlip} className="flip-face flip-face-back absolute inset-0" accent />
        </div>
      </div>

      {!flipped ? (
        <button
          onClick={onFlip}
          disabled={pending}
          className="w-full py-2.5 rounded-full border border-white/70 bg-white/50 text-sm font-medium tracking-wide text-ink-soft hover:bg-white/70 transition-colors disabled:opacity-50"
        >
          Reveal answer
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <RateButton label="Missed" onClick={() => onRate("missed")} tone="error" disabled={pending} />
          <RateButton label="Shaky" onClick={() => onRate("shaky")} tone="gold" disabled={pending} />
          <RateButton label="Got it" onClick={() => onRate("got_it")} tone="pine" disabled={pending} />
        </div>
      )}
    </div>
  );
}

function FaceCard({ label, text, onClick, className, accent }) {
  return (
    <button
      onClick={onClick}
      className={`${className} h-full w-full rounded-3xl border p-6 flex flex-col justify-center text-left shadow-[0_8px_30px_rgba(22,36,31,0.10)] backdrop-blur-xl ${
        accent ? "bg-pine text-white border-pine-dark/40" : "bg-white/55 border-white/60 text-ink"
      }`}
    >
      <span className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-3 ${accent ? "text-white/70" : "text-ink-soft"}`}>
        {label}
      </span>
      <span className="font-display text-2xl leading-snug tracking-wide">{text}</span>
    </button>
  );
}

function RateButton({ label, onClick, tone, disabled }) {
  const toneClasses = {
    error: "border-error/30 text-error hover:bg-error/10 bg-white/40",
    gold: "border-gold/40 text-gold hover:bg-gold/10 bg-white/40",
    pine: "border-pine/40 text-pine hover:bg-pine/10 bg-white/40",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 rounded-full border text-sm font-medium tracking-wide transition-colors disabled:opacity-50 ${toneClasses[tone]}`}
    >
      {label}
    </button>
  );
}

function QuizCard({ item, selectedOption, onPick, pending }) {
  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgba(22,36,31,0.10)] p-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft mb-3 block">Question</span>
      <p className="font-display text-2xl mb-5 tracking-wide">{item.question}</p>

      <div className="grid gap-2">
        {item.options.map((opt, idx) => {
          const isCorrect = idx === item.correctIndex;
          const isPicked = idx === selectedOption;
          let stateClasses = "border-white/70 bg-white/40 hover:bg-white/60";
          if (selectedOption !== null) {
            if (isCorrect) stateClasses = "border-pine bg-pine/10 text-pine-dark";
            else if (isPicked) stateClasses = "border-error bg-error/10 text-error";
            else stateClasses = "border-white/50 bg-white/20 opacity-50";
          }
          return (
            <button
              key={idx}
              disabled={selectedOption !== null || pending}
              onClick={() => onPick(idx)}
              className={`text-left px-4 py-2.5 rounded-2xl border text-sm tracking-wide transition-colors ${stateClasses}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selectedOption !== null && item.explanation && (
        <p className="mt-4 text-sm text-ink-soft tracking-wide border-t border-white/50 pt-3">{item.explanation}</p>
      )}
    </div>
  );
}