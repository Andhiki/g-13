import { AlignBadge } from "../../../ui/badge";

export function ReviewStatusBadge({
  status,
  deleted,
}: {
  status: "published" | "hidden";
  deleted: boolean;
}) {
  return (
    <AlignBadge.Root
      size="medium"
      variant={status === "hidden" && !deleted ? "warning" : "light"}
      className={`shrink-0 text-label-xs ${deleted ? "bg-error-lighter text-error-dark" : status === "hidden" ? "" : "bg-success-lighter text-success-dark"}`}
    >
      {deleted ? "Deleted" : status === "hidden" ? "Hidden" : "Published"}
    </AlignBadge.Root>
  );
}
