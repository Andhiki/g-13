import { HalftoneIllustration } from "@/ui/halftone";
import { Typography } from "@/ui/typography";

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function waitingSummary(pendingReviews: number, accessRequests: number) {
  const parts = [
    pendingReviews > 0 && countLabel(pendingReviews, "review", "reviews"),
    accessRequests > 0 && countLabel(accessRequests, "access request", "access requests"),
  ].filter((part) => part !== false);
  if (parts.length === 0) return "Nothing is waiting for you.";
  const verb = parts.length === 1 && (pendingReviews || accessRequests) === 1 ? "is" : "are";
  return `${parts.join(" and ")} ${verb} waiting for you.`;
}

export function WelcomeBanner({
  name,
  pendingReviews,
  accessRequests,
}: {
  name: string;
  pendingReviews: number;
  accessRequests: number;
}) {
  const firstName = name.trim().split(/\s+/)[0] || name;
  return (
    <section className="flex items-center gap-4">
      <HalftoneIllustration
        items={[{ glyph: "hand", transform: "rotate(-12 48 50)" }]}
        className="h-14 w-auto shrink-0 overflow-visible sm:h-16"
      />
      <div className="min-w-0 space-y-1">
        <Typography as="h2" variant="title" color="strong">
          Welcome back, {firstName}
        </Typography>
        <Typography color="muted" wrap="pretty">
          {waitingSummary(pendingReviews, accessRequests)}
        </Typography>
      </div>
    </section>
  );
}
