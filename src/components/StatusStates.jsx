export function LoadingState() {
  return (
    <div className="mx-auto max-w-xl px-5 mt-6 text-center" role="status" aria-live="polite">
      <div className="inline-flex items-center gap-3 bg-white/55 backdrop-blur-xl border border-white/60 rounded-full shadow-[0_8px_30px_rgba(22,36,31,0.10)] px-5 py-3">
        <span className="h-4 w-4 rounded-full border-2 border-pine border-t-transparent animate-spin" aria-hidden="true" />
        <span className="text-sm text-ink-soft">Drafting your study set…</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto max-w-xl px-5 mt-6" role="alert">
      <div className="bg-white/55 backdrop-blur-xl border border-error/30 rounded-3xl shadow-[0_8px_30px_rgba(22,36,31,0.10)] p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-error mb-2">Couldn't generate that</p>
        <p className="text-ink text-sm mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-full bg-ink text-white text-sm font-medium hover:bg-pine-dark transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}