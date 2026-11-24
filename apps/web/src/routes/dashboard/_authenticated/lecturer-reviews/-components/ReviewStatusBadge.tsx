import { AlignBadge } from "@/ui/badge";

export function ReviewStatusBadge({
  status,
  deleted,
}: {
  status: "pending" | "published" | "hidden";
  deleted: boolean;
}) {
  return (
    <AlignBadge.Root
      size="medium"
      variant={
        deleted
          ? "light"
          : status === "pending"
            ? "information"
            : status === "hidden"
              ? "warning"
              : "light"
      }
      className={`shrink-0 ${deleted ? "bg-error-lighter text-error-dark" : status === "published" ? "bg-success-lighter text-success-dark" : ""}`}
    >
      {deleted
        ? "Deleted"
        : status === "pending"
          ? "Pending"
          : status === "hidden"
            ? "Hidden"
            : "Published"}
    </AlignBadge.Root>
  );
}
