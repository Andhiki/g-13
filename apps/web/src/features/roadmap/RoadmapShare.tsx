import { useSharedLink } from "../../ui/use-shared-link";
import { useLocale } from "../../useLocale";
import { AlignTooltip } from "../../ui/tooltip";
import { toast, SuccessToast } from "../../ui/toast";
import { m, useReducedMotion } from "motion/react";
import { Typography } from "../../ui/typography";
import { RiShareLine, RiCheckLine } from "@remixicon/react";
import { AlignModal } from "../../ui/modal";
import { AlignButton } from "../../ui/button";

export function RoadmapShare({ selection }: { selection: string }) {
  const { text } = useLocale("roadmap");
  const { share, copyLink, dismiss } = useSharedLink({ selection, copiedDuration: 2000 });
  const reducedMotion = useReducedMotion();
  async function sharePlan() {
    if (await copyLink())
      toast.custom(() => <SuccessToast message={text("Tautan roadmap disalin.")} />);
  }
  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <AlignTooltip.Provider>
          <AlignTooltip.Root>
            <AlignTooltip.Trigger asChild>
              <AlignButton.Root
                variant="neutral"
                mode="stroke"
                onClick={() => void sharePlan()}
                className="nodrag nopan pointer-events-auto"
              >
                <span className="relative size-5" aria-hidden="true">
                  {[
                    { Icon: RiShareLine, active: share?.status !== "copied" },
                    { Icon: RiCheckLine, active: share?.status === "copied" },
                  ].map(({ Icon, active }, index) => (
                    <m.span
                      key={index}
                      initial={false}
                      className="absolute inset-0"
                      animate={{
                        opacity: active ? 1 : 0,
                        scale: active || reducedMotion ? 1 : 0.25,
                        filter: active || reducedMotion ? "blur(0px)" : "blur(4px)",
                      }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", duration: 0.3, bounce: 0 }
                      }
                    >
                      <Icon className="size-5" />
                    </m.span>
                  ))}
                </span>
                <span>{share?.status === "copied" ? text("Tautan disalin") : text("Bagikan")}</span>
              </AlignButton.Root>
            </AlignTooltip.Trigger>
            <AlignTooltip.Content size="xsmall" side="bottom">
              {share?.status === "copied" ? text("Tautan disalin") : text("Salin tautan roadmap")}
            </AlignTooltip.Content>
          </AlignTooltip.Root>
        </AlignTooltip.Provider>
      </div>
      <span className="sr-only" role="status">
        {share?.status === "copied" ? text("Tautan roadmap disalin.") : ""}
      </span>
      <AlignModal.Root
        open={share?.status === "manual"}
        onOpenChange={(open) => {
          if (!open) dismiss();
        }}
      >
        <AlignModal.Content>
          <div className="p-5">
            <AlignModal.Title asChild>
              <Typography as="h2" variant="subtitle1" className="pr-8">
                {text("Bagikan roadmap")}
              </Typography>
            </AlignModal.Title>
            <AlignModal.Description asChild>
              <Typography as="p" variant="paragraph" className="mt-2 text-text-sub-600">
                {text("Salin tautan ini untuk membuka rencana yang sama.")}
              </Typography>
            </AlignModal.Description>
            <input
              aria-label={text("Tautan roadmap")}
              readOnly
              value={share?.url ?? ""}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-4 block w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm"
            />
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
    </>
  );
}
