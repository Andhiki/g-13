import { lazy, useEffect, useRef, useState } from "react";
import { DeferredContent } from "../../ui/deferred-content";
import { ThemeSwitch } from "../../ui/theme-switch";
import { Route } from "../../routes/roadmap";
import { firstUnanswered } from "./quiz";
import { RoadmapQuiz } from "./RoadmapQuiz";
import { RoadmapLoading } from "./RoadmapLoading";
import { validateRoadmapSearch, type RoadmapSearch } from "./search";

const RoadmapResult = lazy(() =>
  import("./RoadmapResult").then((module) => ({ default: module.RoadmapResult })),
);

export function RoadmapPage() {
  const answers = Route.useSearch();
  const navigate = Route.useNavigate();
  const restored = useRef(false);
  useEffect(() => {
    try {
      if (!restored.current) {
        restored.current = true;
        if (!answers.kurikulum) {
          const stored = JSON.parse(localStorage.getItem("cs-courses:roadmap") ?? "null");
          if (stored && typeof stored === "object" && !Array.isArray(stored)) {
            const saved = validateRoadmapSearch(stored);
            if (saved.kurikulum) {
              void navigate({ search: saved, replace: true });
              return;
            }
          }
        }
      }
      if (answers.kurikulum) localStorage.setItem("cs-courses:roadmap", JSON.stringify(answers));
      else localStorage.removeItem("cs-courses:roadmap");
    } catch {
      // Browsing still works when storage is unavailable or its contents are invalid.
    }
  }, [answers, navigate]);
  const result = answers.hasil && !firstUnanswered(answers);
  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    if (!result) {
      setShowResult(false);
      return;
    }
    const timer = window.setTimeout(() => setShowResult(true), 500);
    return () => window.clearTimeout(timer);
  }, [result]);
  const update = (next: RoadmapSearch) => {
    void navigate({ search: next, replace: !next.hasil && !answers.hasil, resetScroll: false });
  };
  const restart = () => update(validateRoadmapSearch({}));
  if (result && !showResult) return <RoadmapLoading />;
  if (result)
    return (
      <DeferredContent fallback={<RoadmapLoading />}>
        <RoadmapResult answers={answers} update={update} restart={restart} />
      </DeferredContent>
    );
  return (
    <div className="flex min-h-dvh flex-col bg-bg-white-0 text-text-strong-950">
      <header className="flex items-center justify-end px-5 py-4 sm:px-6">
        <ThemeSwitch />
      </header>
      <RoadmapQuiz answers={answers} update={update} />
    </div>
  );
}
