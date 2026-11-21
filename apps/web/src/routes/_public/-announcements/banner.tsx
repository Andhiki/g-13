import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Language } from "@g13/i18n";
import { RiArrowRightUpLine, RiCloseLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { useLocale } from "@/useLocale";
import { activeAnnouncementsQuery } from "./queries";
import {
  DISMISSED_ANNOUNCEMENTS_KEY,
  dismissAnnouncement,
  filterAnnouncementsNotDismissed,
  parseDismissedAnnouncements,
  type DismissedAnnouncements,
} from "./dismissals";
import type { ActiveAnnouncement } from "./repository";

function announcementCopy(row: ActiveAnnouncement, language: Language, defaultCtaLabel: string) {
  return {
    title: language === "en" ? row.titleEn : row.titleId,
    body: language === "en" ? row.bodyEn : row.bodyId,
    ctaLabel: row.ctaHref
      ? (language === "en" && row.ctaLabelEn) ||
        (language === "id" && row.ctaLabelId) ||
        defaultCtaLabel
      : null,
  };
}

export function AnnouncementBanner() {
  const { text, language } = useLocale();
  const { data } = useQuery({ ...activeAnnouncementsQuery(), retry: false });
  const [dismissed, setDismissed] = useState<DismissedAnnouncements>({});

  useEffect(() => {
    setDismissed(
      parseDismissedAnnouncements(window.localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY)),
    );
  }, []);

  const rows = data ? filterAnnouncementsNotDismissed(data, dismissed) : [];
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
        `${Math.round(bars.getBoundingClientRect().height)}px`,
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

  function dismiss(slug: string) {
    setDismissed((current) => {
      const next = dismissAnnouncement(current, slug);
      try {
        window.localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  if (!visible) return null;

  return (
    <section aria-label={text("Pengumuman")} className="bg-primary-base text-static-white">
      <div ref={barListRef}>
        {rows.map((row) => {
          const copy = announcementCopy(row, language, text("Selengkapnya"));
          const external = row.ctaHref !== null && !row.ctaHref.startsWith("/");
          return (
            <div
              key={row.id}
              className="flex min-h-11 items-center gap-3 border-t border-static-white/20 py-1.5 pl-4 pr-2 first:border-t-0 md:pl-6 md:pr-3"
            >
              <p className="min-w-0 flex-1 text-label-sm">
                <span className="font-semibold">{copy.title}</span>{" "}
                <span className="text-static-white/75">{copy.body}</span>
              </p>
              {row.ctaHref && copy.ctaLabel && (
                <AlignButton.Root
                  asChild
                  variant="neutral-inverse"
                  mode="filled"
                  size="xxsmall"
                  className="shrink-0"
                >
                  <a
                    href={row.ctaHref}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {copy.ctaLabel}
                    <RiArrowRightUpLine aria-hidden="true" className="size-3.5" />
                  </a>
                </AlignButton.Root>
              )}
              <AlignButton.Root
                variant="neutral"
                mode="ghost"
                size="xsmall"
                iconOnly
                className={
                  // oxlint-disable-next-line shadcn/no-restyle -- banner close button sits on the announcement's colored surface: static-white icon with a translucent white hover
                  "size-7 shrink-0 text-static-white hover:bg-static-white/10"
                }
                aria-label={text("Tutup pengumuman")}
                onClick={() => dismiss(row.slug)}
              >
                <RiCloseLine aria-hidden="true" className="size-4" />
              </AlignButton.Root>
            </div>
          );
        })}
      </div>
    </section>
  );
}
