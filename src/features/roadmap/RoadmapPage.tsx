import { useEffect, useRef } from "react";
import { AlignButton } from "../../ui/button";
import { ThemeSwitch } from "../../ui/theme-switch";
import { Route } from "../../routes/roadmap";
import { firstUnanswered } from "./quiz";
import { RoadmapQuiz } from "./RoadmapQuiz";
import { RoadmapResult } from "./RoadmapResult";
import { validateRoadmapSearch, type RoadmapSearch } from "./search";

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
  const update = (next: RoadmapSearch) => {
    void navigate({ search: next, replace: !next.hasil && !answers.hasil, resetScroll: false });
  };
  const restart = () => update(validateRoadmapSearch({}));
  if (result) return <RoadmapResult answers={answers} update={update} restart={restart} />;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-white-0 text-text-strong-950">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <AlignButton.Root variant="neutral" mode="ghost" onClick={restart}>
          Mulai lagi
        </AlignButton.Root>
        <ThemeSwitch />
      </header>
      <RoadmapQuiz answers={answers} update={update} />
    </div>
  );
}
