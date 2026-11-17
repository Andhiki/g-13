import { Typography } from "@/ui/typography";
import { AlignPopover } from "@/ui/popover";
import { RiInformationLine, RiStarFill } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { useLocale } from "@/useLocale";

const ratingDescriptions: [string, string][] = [
  ["Clarity", "Clarity of explanations and examples."],
  ["Support", "Help and guidance when students need it."],
  ["Organization", "Structure of course materials and class activities."],
];

export function RatingGuidePopover() {
  const { text } = useLocale("lecturers");

  return (
    <AlignPopover.Root>
      <AlignPopover.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="small"
          className="w-9 p-0"
          aria-label={text("About ratings and reviews")}
          title={text("About ratings and reviews")}
        >
          <RiInformationLine aria-hidden="true" className="size-5" />
        </AlignButton.Root>
      </AlignPopover.Trigger>
      <AlignPopover.Content
        align="start"
        side="bottom"
        sideOffset={8}
        showArrow={false}
        aria-labelledby="rating-guide-title"
        className="w-[min(24rem,calc(100vw-2.5rem))] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-10 p-4 text-left focus:outline-none"
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
          <Typography as="p" variant="caption" className="mb-0 mt-1.5 text-text-sub-600">
            {text(
              "Your display name is public. Anonymous hides it, but infrastructure operators may still identify you.",
            )}
          </Typography>
          <Typography as="p" variant="caption" className="mb-0 mt-1.5 text-text-sub-600">
            {text(
              "IP addresses are used to limit review submissions and likes. Raw IP addresses are not stored in review or like records.",
            )}
          </Typography>
        </section>
      </AlignPopover.Content>
    </AlignPopover.Root>
  );
}
