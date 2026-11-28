import type { AnnouncementVariant } from "@g13/db/schema/announcements";
import { useId, useState } from "react";
import type { Language } from "@g13/i18n";
import { loadMessages } from "@g13/i18n/messages";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { AnnouncementBannerRow, resolveAnnouncementCopy } from "@/ui/announcement-banner";
import { useAnnouncementClock } from "@/ui/announcement-countdown";
import { dateTimePartsToTimestamp, type DateTimeParts } from "@/ui/date-time-value";
import { Typography } from "@/ui/typography";
import { toast } from "@/ui/toast";
import { useTranslation } from "react-i18next";
import { resolveAnnouncementStatus } from "@/routes/-announcements/schedule";
import { announcementStatusLabel } from "../-shared/status";

export function AnnouncementPreview({
  variant,
  titleId,
  titleEn,
  bodyId,
  bodyEn,
  ctaHref,
  ctaOpenInNewTab,
  ctaLabelId,
  ctaLabelEn,
  countdownAt,
  startsAt,
  endsAt,
  enabled,
}: {
  variant: AnnouncementVariant;
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string;
  ctaOpenInNewTab: boolean;
  ctaLabelId: string;
  ctaLabelEn: string;
  countdownAt: DateTimeParts;
  startsAt: DateTimeParts;
  endsAt: DateTimeParts;
  enabled: boolean;
}) {
  const { i18n } = useTranslation("common");
  const [previewLanguage, setPreviewLanguage] = useState<Language>(
    i18n.resolvedLanguage === "en" ? "en" : "id",
  );
  const previewText = i18n.getFixedT(previewLanguage, "common");
  const headingId = useId();

  async function changePreviewLanguage(language: Language) {
    try {
      if (!i18n.hasResourceBundle(language, "common")) {
        i18n.addResourceBundle(language, "common", await loadMessages(language, "common"));
      }
      setPreviewLanguage(language);
    } catch {
      toast.error(i18n.t("language.loadFailed"));
    }
  }

  const countdownAtMs = dateTimePartsToTimestamp(countdownAt);
  const startsAtMs = dateTimePartsToTimestamp(startsAt);
  const endsAtMs = dateTimePartsToTimestamp(endsAt);
  const latestTarget = Math.max(countdownAtMs ?? 0, startsAtMs ?? 0, endsAtMs ?? 0);
  const now = Math.max(useAnnouncementClock(latestTarget) ?? 0, Date.now());
  const scheduleStatus = resolveAnnouncementStatus(
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
      ctaOpenInNewTab,
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
        <div>
          <Typography as="h3" id={headingId} variant="labelSmall" color="strong">
            Banner preview
          </Typography>
          <Typography as="p" variant="caption" color="muted">
            {scheduleStatus === "live"
              ? "Live on the site now"
              : announcementStatusLabel(scheduleStatus)}
          </Typography>
        </div>
        <PreviewLanguagePicker value={previewLanguage} onChange={changePreviewLanguage} />
      </div>
      <AnnouncementBannerRow
        variant={variant}
        title={copy.title}
        body={copy.body}
        titlePlaceholder={titlePlaceholder}
        bodyPlaceholder={bodyPlaceholder}
        ctaLabel={copy.ctaLabel}
        ctaHref={copy.ctaHref}
        ctaOpenInNewTab={copy.ctaOpenInNewTab}
        closeLabel={closeLabel}
        interactiveCta={false}
        countdownAt={countdownAtMs}
        countdownNow={now}
        countdownText={(key) => previewText(key, { keySeparator: false, defaultValue: key })}
        onDismiss={() => {}}
      />
    </section>
  );
}

function PreviewLanguagePicker({
  value,
  onChange,
}: {
  value: Language;
  onChange: (value: Language) => Promise<void>;
}) {
  return (
    <SegmentedControl
      aria-label="Preview language"
      value={value}
      onValueChange={(next) => {
        if (next === "id" || next === "en") void onChange(next);
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
  );
}
