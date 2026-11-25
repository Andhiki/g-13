import type { AnnouncementVariant } from "@g13/db/schema/announcements";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { AnnouncementBannerRow, resolveAnnouncementCopy } from "@/ui/announcement-banner";
import { useAnnouncementClock } from "@/ui/announcement-countdown";
import { useLocale } from "@/useLocale";
import { activeAnnouncementsQuery } from "./queries";
import {
  DISMISSED_ANNOUNCEMENTS_KEY,
  dismissAnnouncement,
  filterAnnouncementsNotDismissed,
  parseDismissedAnnouncements,
  type DismissedAnnouncements,
} from "./dismissals";

export function AnnouncementBanner() {
  const { text, language } = useLocale();
  const { data } = useQuery({ ...activeAnnouncementsQuery(), retry: false });
  const [startedWithoutCache] = useState(() => data === undefined);
  const reducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState<DismissedAnnouncements>({});

  useEffect(() => {
    setDismissed(
      parseDismissedAnnouncements(window.localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY)),
    );
  }, []);

  const rows = data ? filterAnnouncementsNotDismissed(data, dismissed) : [];
  const latestCountdown = rows.reduce(
    (latest, row) => Math.max(latest, row.countdownAt?.getTime() ?? 0),
    0,
  );
  const countdownNow = useAnnouncementClock(latestCountdown || null);
  const barListRef = useRef<HTMLDivElement | null>(null);
  const visible = rows.length > 0;

  // Publish the bar height so pages reserving `--app-header-height` below the
  // fixed navbar stack make room for the banner as well.
  useLayoutEffect(() => {
    const bars = barListRef.current;
    if (!bars || !visible) {
      document.documentElement.style.removeProperty("--app-banner-height");
      return;
    }
    const apply = () => {
      document.documentElement.style.setProperty(
        "--app-banner-height",
        `${bars.getBoundingClientRect().height}px`,
      );
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bars);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--app-banner-height");
    };
  }, [visible, rows.length]);

  function dismiss(announcementId: string) {
    setDismissed((current) => {
      const next = dismissAnnouncement(current, announcementId);
      try {
        window.localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  if (data === undefined) return null;

  return (
    <m.section
      ref={barListRef}
      aria-label={visible ? text("Pengumuman") : undefined}
      initial={
        startedWithoutCache && visible && !reducedMotion ? { height: 0, overflow: "hidden" } : false
      }
      animate={{ height: "auto", transitionEnd: { overflow: "visible" } }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
    >
      {visible && (
        <AnimatePresence initial={false}>
          {rows.map((row) => {
            const copy = resolveAnnouncementCopy(row, language, text("Selengkapnya"));
            return (
              <AnnouncementRow
                key={row.id}
                variant={row.variant}
                title={copy.title}
                body={copy.body}
                ctaLabel={copy.ctaLabel}
                ctaHref={copy.ctaHref}
                ctaOpenInNewTab={copy.ctaOpenInNewTab}
                closeLabel={text("Tutup pengumuman")}
                countdownAt={row.countdownAt?.getTime() ?? null}
                countdownNow={countdownNow}
                countdownText={text}
                onDismiss={() => dismiss(row.id)}
              />
            );
          })}
        </AnimatePresence>
      )}
    </m.section>
  );
}

function AnnouncementRow({
  variant,
  title,
  body,
  ctaLabel,
  ctaHref,
  ctaOpenInNewTab,
  closeLabel,
  countdownAt,
  countdownNow,
  countdownText,
  onDismiss,
}: {
  variant: AnnouncementVariant;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaOpenInNewTab: boolean;
  closeLabel: string;
  countdownAt: number | null;
  countdownNow: number | null;
  countdownText: (key: string) => string;
  onDismiss: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [-72, 0], [0.15, 1]);

  return (
    <m.div
      style={reducedMotion ? undefined : { y: dragY, opacity }}
      drag={reducedMotion ? false : "y"}
      dragDirectionLock
      dragConstraints={{ top: -96, bottom: 0 }}
      dragElastic={{ top: 0.35, bottom: 0.08 }}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        if (info.offset.y <= -32 || info.velocity.y <= -350) onDismiss();
      }}
      exit={{
        height: 0,
        opacity: 0,
        transition: { duration: reducedMotion ? 0 : 0.18, ease: [0.32, 0.72, 0, 1] },
      }}
      className="group touch-pan-x overflow-hidden"
    >
      <AnnouncementBannerRow
        className="border-t border-static-white/20 group-first:border-t-0"
        variant={variant}
        title={title}
        body={body}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        ctaOpenInNewTab={ctaOpenInNewTab}
        closeLabel={closeLabel}
        countdownAt={countdownAt}
        countdownNow={countdownNow}
        countdownText={countdownText}
        onDismiss={onDismiss}
      />
    </m.div>
  );
}
