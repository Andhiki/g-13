import { RiGithubFill, RiStarFill } from "@remixicon/react";
import { AlignButton } from "./button";
import { GITHUB_REPOSITORY_URL } from "./star-nudge";

export function StarNudgeToast({
  message,
  starLabel,
  laterLabel,
  onStar,
  onLater,
}: {
  message: string;
  starLabel: string;
  laterLabel: string;
  onStar: () => void;
  onLater: () => void;
}) {
  return (
    <div className="w-full rounded-lg bg-bg-white-0 p-3 text-paragraph-sm text-text-strong-950 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
      <div className="flex items-start gap-3">
        <RiGithubFill className="mt-0.5 size-5 shrink-0 text-text-sub-600" aria-hidden="true" />
        <div className="grid gap-3">
          <p className="m-0">{message}</p>
          <div className="flex flex-wrap items-center gap-2">
            <AlignButton.Root asChild variant="neutral" mode="filled" size="xsmall">
              <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noreferrer" onClick={onStar}>
                <RiStarFill className="size-4" aria-hidden="true" />
                {starLabel}
              </a>
            </AlignButton.Root>
            <AlignButton.Root variant="neutral" mode="ghost" size="xsmall" onClick={onLater}>
              {laterLabel}
            </AlignButton.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
