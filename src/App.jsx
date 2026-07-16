import InputScreen from "./components/InputScreen.jsx";
import { LoadingState, ErrorState } from "./components/StatusStates.jsx";
import StudyDeck from "./components/StudyDeck.jsx";
import { useStudySet, friendlyError } from "./useStudySet.js";

export default function App() {
  const { status, data, errorReason, generate, reset } = useStudySet();

  return (
    <main className="min-h-screen py-10 sm:py-16">
      {status === "idle" && <InputScreen onSubmit={generate} disabled={false} />}

      {status === "loading" && (
        <>
          <InputScreen onSubmit={generate} disabled />
          <LoadingState />
        </>
      )}

      {status === "error" && (
        <>
          <InputScreen onSubmit={generate} disabled={false} />
          <ErrorState message={friendlyError(errorReason)} onRetry={reset} />
        </>
      )}

      {status === "success" && data && (
        <StudyDeck topic={data.topic} items={data.items} onRestart={reset} />
      )}
    </main>
  );
}