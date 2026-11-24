import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import { ThesesBrowser } from "./ThesesBrowser";
import { ThesesUnavailable } from "./ThesesUnavailable";
import { ThesisSubmissionCta } from "./ThesisSubmissionCta";
import type { ThesesIndexState } from "../-shared/thesis";

export function ThesesIndexPage({ state }: { state: ThesesIndexState }) {
  const { text } = useLocale("theses");
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8">
        <header>
          <Typography as="h1" variant="title" className="m-0">
            {text("Theses")}
          </Typography>
          <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-3 max-w-2xl">
            {text(
              "Explore Ilmu Komputer UGM theses by title, author, supervisor, year, and keyword.",
            )}
          </Typography>
        </header>
        <ThesisSubmissionCta />
        {state.status === "unavailable" ? (
          <ThesesUnavailable />
        ) : (
          <ThesesBrowser data={state.data} />
        )}
      </div>
    </main>
  );
}
