import { useId, useState } from "react";
import type { Language } from "@g13/i18n";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { AnnouncementBannerRow, resolveAnnouncementCopy } from "@/ui/announcement-banner";
import { useAnnouncementClock } from "@/ui/announcement-countdown";
import { dateTimePartsToTimestamp, type DateTimeParts } from "@/ui/date-time-value";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import type { AnnouncementStatus } from "../-shared/schemas";
import { resolveAnnouncementStatus } from "../-shared/status";

function previewStatusCaption(status: AnnouncementStatus): string {
  switch (status) {
    case "live":
      return "Live on the site now";
    case "scheduled":
      return "Scheduled";
    case "expired":
      return "Expired";
    case "disabled":
      return "Disabled";
  }
}

export function AnnouncementPreview({
  titleId,
  titleEn,
  bodyId,
  bodyEn,
  ctaHref,
  ctaLabelId,
  ctaLabelEn,
  startsAt,
  endsAt,
  countdownAt,
  enabled,
}: {
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string;
  ctaLabelId: string;
  ctaLabelEn: string;
  startsAt: DateTimeParts;
  endsAt: DateTimeParts;
  countdownAt: DateTimeParts;
  enabled: boolean;
}) {
  const { text, language } = useLocale();
  const [previewLanguage, setPreviewLanguage] = useState<Language>(language);
  const headingId = useId();

  const now = Date.now();
  const startsAtMs = dateTimePartsToTimestamp(startsAt);
  const endsAtMs = dateTimePartsToTimestamp(endsAt);
  const countdownAtMs = dateTimePartsToTimestamp(countdownAt);
  const countdownNow = useAnnouncementClock([countdownAtMs]);
  const status = resolveAnnouncementStatus(
    {
      enabled,
      startsAt: new Date(startsAtMs ?? now),
      endsAt: endsAtMs === null ? null : new Date(endsAtMs),
    },
    now,
  );

  const defaultCtaLabel = previewLanguage === "en" ? "Learn more" : "Selengkapnya";
  const closeLabel = previewLanguage === "en" ? "Dismiss announcement" : "Tutup pengumuman";
  const titlePlaceholder = previewLanguage === "en" ? "Midterm schedule" : "Jadwal UTS";
  const bodyPlaceholder =
    previewLanguage === "en"
      ? "Midterm schedule is out, check the exam archive."
      : "Jadwal UTS sudah terbit, cek arsip ujian.";

  const copy = resolveAnnouncementCopy(
    {
      titleId,
      titleEn,
      bodyId,
      bodyEn,
      ctaHref,
      ctaLabelId,
      ctaLabelEn,
    },
    previewLanguage,
    defaultCtaLabel,
  );

  return (
    <section
      aria-labelledby={headingId}
      className="border-b border-stroke-soft-200 bg-bg-weak-50/50 pt-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between gap-3 px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Typography as="h3" id={headingId} variant="labelSmall" color="strong">
            Preview
          </Typography>
          <span aria-hidden="true" className="text-text-sub-600">
            ·
          </span>
          <Typography variant="caption" color="muted" className="truncate">
            {previewStatusCaption(status)}
          </Typography>
        </div>
        <SegmentedControl
          aria-label="Preview language"
          value={previewLanguage}
          onValueChange={(next) => {
            if (next === "id" || next === "en") setPreviewLanguage(next);
          }}
          className="relative isolate inline-flex shrink-0 items-center rounded-lg border border-stroke-soft-200 bg-bg-weak-50 p-0.5"
        >
          <SegmentedControlIndicator className="pointer-events-none absolute top-[var(--segmented-control-indicator-top)] left-[var(--segmented-control-indicator-left)] -z-10 h-[var(--segmented-control-indicator-height)] w-[var(--segmented-control-indicator-width)] rounded-md bg-bg-white-0 shadow-regular-xs transition-[top,left,width,height] duration-150 ease-out data-[activation-direction=none]:transition-none" />
          <SegmentedControlItem
            value="id"
            className="relative cursor-[var(--interactive-cursor)] rounded-md px-2 py-0.5 text-label-xs text-text-sub-600 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-stroke-strong-950/35 data-checked:text-text-strong-950"
          >
            ID
          </SegmentedControlItem>
          <SegmentedControlItem
            value="en"
            className="relative cursor-[var(--interactive-cursor)] rounded-md px-2 py-0.5 text-label-xs text-text-sub-600 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-stroke-strong-950/35 data-checked:text-text-strong-950"
          >
            EN
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
      <div className="bg-primary-base text-static-white">
        <AnnouncementBannerRow
          title={copy.title}
          body={copy.body}
          titlePlaceholder={titlePlaceholder}
          bodyPlaceholder={bodyPlaceholder}
          ctaLabel={copy.ctaLabel}
          ctaHref={copy.ctaHref}
          external={copy.external}
          closeLabel={closeLabel}
          interactiveCta={false}
          countdownAt={countdownAtMs}
          countdownNow={countdownNow}
          countdownText={text}
          onDismiss={() => {}}
        />
      </div>
    </section>
  );
}
