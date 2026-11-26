import { tv } from "tailwind-variants";
import { AlignBadge } from "@/ui/badge";
import type { ThesisStatus } from "../-shared/schemas";

type ThesisBadgeStatus = ThesisStatus | "deleted";

const badgeVariants = tv({
  base: "shrink-0",
  variants: {
    status: {
      draft: "bg-warning-lighter text-warning-dark",
      published: "bg-success-lighter text-success-dark",
      hidden: "bg-bg-weak-50 text-text-sub-600",
      deleted: "bg-error-lighter text-error-dark",
    },
  },
  defaultVariants: { status: "draft" },
});

const statusLabels: Record<ThesisBadgeStatus, string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Hidden",
  deleted: "Deleted",
};

export function ThesisStatusBadge({ status }: { status: ThesisBadgeStatus }) {
  return (
    <AlignBadge.Root size="medium" variant="light" className={badgeVariants({ status })}>
      {statusLabels[status]}
    </AlignBadge.Root>
  );
}
