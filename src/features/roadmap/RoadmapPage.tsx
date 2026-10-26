import { Link } from "@tanstack/react-router";
import { ThemeSwitch } from "../../ui/theme-switch";
import { Route } from "../../routes/roadmap";
import { firstUnanswered } from "./quiz";
import { RoadmapQuiz } from "./RoadmapQuiz";
import { RoadmapResult } from "./RoadmapResult";
import type { RoadmapSearch } from "./search";

export function RoadmapPage() {
  const answers = Route.useSearch();
  const navigate = Route.useNavigate();
  const result = answers.hasil && !firstUnanswered(answers);
  const update = (next: RoadmapSearch) => {
    void navigate({ search: next, replace: !next.hasil && !answers.hasil, resetScroll: false });
  };
  if (result) return <RoadmapResult answers={answers} update={update} />;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-white-0 text-text-strong-950">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Link
          to="/"
          search={{ kurikulum: answers.kurikulum ?? "2026" }}
          className="text-label-sm text-text-sub-600 hover:text-text-strong-950"
        >
          Peta kurikulum
        </Link>
        <ThemeSwitch />
      </header>
      <RoadmapQuiz answers={answers} update={update} />
    </div>
  );
}
