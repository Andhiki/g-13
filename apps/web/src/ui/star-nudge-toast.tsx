import { RiGithubFill, RiStarFill } from "@remixicon/react";
import { toast } from "./toast";
import { AlignButton } from "./button";
import { GITHUB_REPOSITORY_URL, markStarGiven } from "./star-nudge";

function StarNudgeToast({
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
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-bg-white-0 p-3 text-text-strong-950 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
      <RiGithubFill className="size-7 shrink-0" aria-hidden="true" />
      <p className="m-0 min-w-0 flex-1 text-label-sm">{message}</p>
      <div className="ml-auto flex basis-full items-center justify-end gap-2 sm:basis-auto">
        <AlignButton.Root variant="neutral" mode="ghost" size="xsmall" onClick={onLater}>
          <span className="text-label-sm">{laterLabel}</span>
        </AlignButton.Root>
        <AlignButton.Root asChild variant="neutral" mode="filled" size="xsmall">
          <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noreferrer" onClick={onStar}>
            <RiStarFill className="size-4" aria-hidden="true" />
            <span className="text-label-sm">{starLabel}</span>
          </a>
        </AlignButton.Root>
      </div>
    </div>
  );
}

export function showStarNudgeToast(text: (key: string) => string): void {
  toast.custom(
    (id) => (
      <StarNudgeToast
        message={text("Suka aplikasi ini? Beri bintang di GitHub.")}
        starLabel={text("Beri bintang")}
        laterLabel={text("Nanti saja")}
        onStar={() => {
          markStarGiven();
          toast.dismiss(id);
        }}
        onLater={() => toast.dismiss(id)}
      />
    ),
    {
      id: "g13-star-nudge",
      duration: 12000,
      className: "sm:left-1/2 sm:-ml-[300px] sm:!w-[600px]",
    },
  );
}
