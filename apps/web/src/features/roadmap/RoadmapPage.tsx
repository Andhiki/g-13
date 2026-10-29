import { lazy, useEffect, useRef } from "react";
import { DeferredContent } from "../../ui/deferred-content";
import { Route } from "../../routes/roadmap";
import { planningInput } from "./planning-input";
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
  const input = answers.hasil ? planningInput(answers) : null;
  const update = (next: RoadmapSearch) => {
    void navigate({ search: next, replace: !next.hasil && !answers.hasil, resetScroll: false });
  };
  const restart = () => update(validateRoadmapSearch({}));
  if (input)
    return (
      <DeferredContent fallback={<RoadmapLoading />}>
        <RoadmapResult input={input} answers={answers} update={update} restart={restart} />
      </DeferredContent>
    );
  return (
    <div className="flex min-h-[calc(100dvh-var(--app-header-height))] flex-col bg-bg-white-0 text-text-strong-950">
      <RoadmapQuiz answers={answers} update={update} />
    </div>
  );
}
