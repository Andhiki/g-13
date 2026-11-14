import { Typography } from "../../ui/typography";
import { useEffect, useRef, useState } from "react";
import { RiInformationLine, RiStarFill } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { useLocale } from "../../useLocale";

const ratingDescriptions = [
  ["Clarity", "Clarity of explanations and examples."],
  ["Support", "Help and guidance when students need it."],
  ["Organization", "Structure of course materials and class activities."],
] as const;

export function RatingGuidePopover() {
  const { text } = useLocale("lecturers");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <AlignButton.Root
        variant="neutral"
        mode="stroke"
        className="size-10 p-0"
        aria-expanded={open}
        aria-controls="rating-guide"
        aria-label={text("About ratings and reviews")}
        title={text("About ratings and reviews")}
        onClick={() => setOpen(!open)}
      >
        <RiInformationLine aria-hidden="true" className="size-5" />
      </AlignButton.Root>
      {open && (
        <div
          id="rating-guide"
          className="absolute left-0 top-full z-30 mt-2 w-[min(24rem,calc(100vw-2.5rem))] rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-4 text-left shadow-regular-md"
        >
          <section aria-labelledby="rating-guide-title">
            <div className="flex items-center gap-2">
              <RiStarFill aria-hidden="true" className="size-4 shrink-0 text-primary-base" />
              <Typography as="h2" variant="label" id="rating-guide-title" className="m-0">
                {text("Understanding the ratings")}
              </Typography>
            </div>
            <dl className="mb-0 mt-3 space-y-3">
              {ratingDescriptions.map(([label, description]) => (
                <div key={label}>
                  <Typography as="dt" variant="label">
                    {text(label)}
                  </Typography>
                  <Typography as="dd" variant="caption" className="m-0 mt-0.5 text-text-sub-600">
                    {text(description)}
                  </Typography>
                </div>
              ))}
            </dl>
            <Typography as="p" variant="caption" className="mb-0 mt-3 text-text-sub-600">
              {text(
                "Overall ratings give equal weight to these three aspects. Scores range from 1 to 5.",
              )}
            </Typography>
          </section>
          <section
            aria-labelledby="review-policy-title"
            className="mt-4 border-t border-stroke-soft-200 pt-4"
          >
            <Typography as="h2" variant="label" id="review-policy-title" className="m-0">
              {text("Unverified reviews")}
            </Typography>
            <Typography as="p" variant="caption" className="mb-0 mt-1.5 text-text-sub-600">
              {text(
                "Reviews are shared by the community and do not prove course attendance. This is a community-run project, not an official university service.",
              )}
            </Typography>
            <Typography as="p" variant="caption" className="mb-0 mt-1.5 text-text-sub-600">
              {text("Ratings summarize experiences and are not a definitive ranking.")}
            </Typography>
          </section>
        </div>
      )}
    </div>
  );
}
