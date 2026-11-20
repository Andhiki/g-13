import { Loading } from "@/ui/loading";

export function DashboardPending({ className = "h-full min-h-64" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <Loading tone="neutral" />
    </div>
  );
}

export function DashboardRoutePending() {
  return <DashboardPending className="flex-1" />;
}
