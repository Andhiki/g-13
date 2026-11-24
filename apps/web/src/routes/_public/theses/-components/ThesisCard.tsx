import { Link } from "@tanstack/react-router";
import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import { thesisTypeLabelKey, type ThesisCard as ThesisCardData } from "../-shared/thesis";

export function ThesisCard({ thesis }: { thesis: ThesisCardData }) {
  const { text } = useLocale("theses");
  const typeLabel = text(thesisTypeLabelKey(thesis.type));
  const supervisorNames = thesis.supervisors.map((supervisor) => supervisor.name).join(", ");
  return (
    <article className="isolate relative h-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-4 transition-colors hover:border-stroke-strong-950 focus-within:border-stroke-strong-950">
      <Link
        to="/theses/$slug"
        params={{ slug: thesis.slug }}
        aria-labelledby={`thesis-card-title-${thesis.slug}`}
        className="absolute inset-0 z-0 rounded-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
      />
      <div className="pointer-events-none relative z-10">
        <Typography
          as="h2"
          variant="subtitle2"
          id={`thesis-card-title-${thesis.slug}`}
          className="m-0 break-words"
        >
          {thesis.title}
        </Typography>
        <Typography as="p" variant="label" className="mb-0 mt-2 break-words">
          {thesis.authorName}
          {thesis.authorBatch !== null && (
            <Typography as="span" variant="caption" color="muted">
              {" · "}
              {text("Batch {{year}}", { year: String(thesis.authorBatch) })}
            </Typography>
          )}
        </Typography>
        {supervisorNames && (
          <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-2 break-words">
            {text("Supervisors: {{names}}", { names: supervisorNames })}
          </Typography>
        )}
        <Typography as="p" variant="caption" color="muted" className="mb-0 mt-3 break-words">
          {thesis.year} · {typeLabel}
          {thesis.field ? ` · ${thesis.field}` : ""}
        </Typography>
      </div>
    </article>
  );
}
