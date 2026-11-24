import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Language } from "@g13/i18n";
import { AnimatePresence, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
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
  const [startedWithoutCache] = useState(() => data === undefined);
  const reducedMotion = useReducedMotion();
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

  function dismiss(slug: string) {
    setDismissed((current) => {
      const next = dismissAnnouncement(current, slug);
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
      className="bg-primary-base text-static-white"
      initial={
        startedWithoutCache && visible && !reducedMotion ? { height: 0, overflow: "hidden" } : false
      }
      animate={{ height: "auto", transitionEnd: { overflow: "visible" } }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
    >
      {visible && (
        <AnimatePresence initial={false}>
          {rows.map((row) => {
            const copy = announcementCopy(row, language, text("Selengkapnya"));
            const external = row.ctaHref !== null && !row.ctaHref.startsWith("/");
            return (
              <AnnouncementRow
                key={row.id}
                title={copy.title}
                body={copy.body}
                ctaLabel={copy.ctaLabel}
                ctaHref={row.ctaHref}
                external={external}
                closeLabel={text("Tutup pengumuman")}
                onDismiss={() => dismiss(row.slug)}
              />
            );
          })}
        </AnimatePresence>
      )}
    </m.section>
  );
}

function AnnouncementRow({
  title,
  body,
  ctaLabel,
  ctaHref,
  external,
  closeLabel,
  onDismiss,
}: {
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  external: boolean;
  closeLabel: string;
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
      className="flex min-h-11 touch-pan-x items-center gap-3 overflow-hidden border-t border-static-white/20 py-1.5 pl-4 pr-2 first:border-t-0 md:pl-6 md:pr-3"
    >
      <p className="min-w-0 flex-1 text-label-sm">
        <span className="font-semibold">{title}</span>{" "}
        <span className="text-static-white/75">{body}</span>
      </p>
      {ctaHref && ctaLabel && (
        <AlignButton.Root
          asChild
          variant="neutral-inverse"
          mode="filled"
          size="xxsmall"
          className="shrink-0"
        >
          <a href={ctaHref} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {ctaLabel}
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
        aria-label={closeLabel}
        onClick={onDismiss}
      >
        <RiCloseLine aria-hidden="true" className="size-4" />
      </AlignButton.Root>
    </m.div>
  );
}
