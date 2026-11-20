import { AlignBadge } from "@/ui/badge";

export function RecordStatusBadge({ deleted }: { deleted: boolean }) {
  return (
    <AlignBadge.Root
      size="medium"
      variant="light"
      className={`shrink-0 ${deleted ? "bg-error-lighter text-error-dark" : "bg-success-lighter text-success-dark"}`}
    >
      {deleted ? "Deleted" : "Active"}
    </AlignBadge.Root>
  );
}
