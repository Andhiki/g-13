import type { AnnouncementVariant } from "@g13/db/schema/announcements";
import type { Language } from "@g13/i18n";
import { RiArrowRightUpLine, RiCloseLine } from "@remixicon/react";
import { clsx } from "clsx";
import { AlignButton } from "@/ui/button";
import { AnnouncementCountdown } from "@/ui/announcement-countdown";

export type AnnouncementCopySource = {
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
  ctaHref: string | null;
  ctaOpenInNewTab: boolean;
  ctaLabelId: string | null;
  ctaLabelEn: string | null;
};

export type ResolvedAnnouncementCopy = {
  title: string;
  body: string;
  ctaHref: string | null;
  ctaLabel: string | null;
  ctaOpenInNewTab: boolean;
};

export function resolveAnnouncementCopy(
  row: AnnouncementCopySource,
  language: Language,
  defaultCtaLabel: string,
): ResolvedAnnouncementCopy {
  const ctaHref = row.ctaHref?.trim() || null;
  const localizedCta = (language === "en" ? row.ctaLabelEn : row.ctaLabelId)?.trim() || null;
  return {
    title: language === "en" ? row.titleEn : row.titleId,
    body: language === "en" ? row.bodyEn : row.bodyId,
    ctaHref,
    ctaLabel: ctaHref ? (localizedCta ?? defaultCtaLabel) : null,
    ctaOpenInNewTab: ctaHref !== null && row.ctaOpenInNewTab,
  };
}

const announcementSurfaces = {
  primary: "bg-primary-base",
  error: "bg-red-800",
  neutral: "bg-neutral-700",
} satisfies Record<AnnouncementVariant, string>;

export function AnnouncementBannerRow({
  variant,
  title,
  body,
  titlePlaceholder,
  bodyPlaceholder,
  ctaLabel,
  ctaHref,
  ctaOpenInNewTab,
  closeLabel,
  onDismiss,
  interactiveCta = true,
  countdownAt = null,
  countdownNow = null,
  countdownText,
  className,
}: {
  title: string;
  body: string;
  variant: AnnouncementVariant;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaOpenInNewTab: boolean;
  closeLabel: string;
  onDismiss: () => void;
  interactiveCta?: boolean;
  countdownAt?: number | null;
  countdownNow?: number | null;
  countdownText?: (key: string) => string;
  className?: string;
}) {
  const hasTitle = title.trim().length > 0;
  const hasBody = body.trim().length > 0;
  const displayedTitle = hasTitle ? title : (titlePlaceholder ?? "");
  const displayedBody = hasBody ? body : (bodyPlaceholder ?? "");

  return (
    <div
      className={clsx(
        "flex min-h-11 items-center gap-3 py-1.5 pl-4 pr-2 md:pl-6 md:pr-3 text-static-white",
        announcementSurfaces[variant],
        className,
      )}
    >
      <p className="min-w-0 flex-1 text-label-sm">
        <span className={hasTitle ? "font-semibold" : "font-semibold opacity-55"}>
          {displayedTitle}
        </span>{" "}
        <span className={hasBody ? "text-static-white/75" : "text-static-white/45"}>
          {displayedBody}
        </span>
        {countdownAt !== null && countdownText && (
          <AnnouncementCountdown
            countdownAt={countdownAt}
            now={countdownNow}
            text={countdownText}
          />
        )}
      </p>
      {ctaHref &&
        ctaLabel &&
        (interactiveCta ? (
          <AlignButton.Root
            asChild
            variant="neutral-inverse"
            mode="filled"
            size="xxsmall"
            className="shrink-0"
          >
            <a
              href={ctaHref}
              {...(ctaOpenInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {ctaLabel}
              {ctaOpenInNewTab && <RiArrowRightUpLine aria-hidden="true" className="size-3.5" />}
            </a>
          </AlignButton.Root>
        ) : (
          <AlignButton.Root
            variant="neutral-inverse"
            mode="filled"
            size="xxsmall"
            className="shrink-0"
            onClick={(event) => event.preventDefault()}
          >
            {ctaLabel}
            {ctaOpenInNewTab && <RiArrowRightUpLine aria-hidden="true" className="size-3.5" />}
          </AlignButton.Root>
        ))}
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
    </div>
  );
}
