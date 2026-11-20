import type { ReactNode } from "react";
import { AppHeader } from "@/ui/app-header";
import { AnnouncementBanner } from "./-announcements/banner";

export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh pt-[var(--app-header-height)]">
      <AppHeader announcement={<AnnouncementBanner />} />
      {children}
    </div>
  );
}
