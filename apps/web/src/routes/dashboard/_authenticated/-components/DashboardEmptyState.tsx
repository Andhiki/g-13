import type { ReactNode } from "react";
import { AlignEmptyState } from "@/ui/empty-state";

export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 flex-1 place-items-center px-5">
      <AlignEmptyState.Root>
        <AlignEmptyState.Icon>{icon}</AlignEmptyState.Icon>
        <AlignEmptyState.Title>{title}</AlignEmptyState.Title>
        {description && <AlignEmptyState.Description>{description}</AlignEmptyState.Description>}
        {action && <AlignEmptyState.Actions>{action}</AlignEmptyState.Actions>}
      </AlignEmptyState.Root>
    </div>
  );
}
