import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { CompactButton } from "../../../ui/compact-button";
import { AlignTooltip } from "../../../ui/tooltip";

export function CopyCourseButton({ courseId }: { courseId: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const label =
    status === "copied"
      ? "ID mata kuliah disalin"
      : status === "error"
        ? "Gagal menyalin. Coba lagi."
        : "Salin ID mata kuliah";
  const Icon = status === "copied" ? RiCheckLine : RiFileCopyLine;
  const hidden = {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.25,
    filter: reducedMotion ? "blur(0px)" : "blur(4px)",
  };
  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <CompactButton
            aria-label={label}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(courseId);
                setStatus("copied");
              } catch {
                setStatus("error");
              }
            }}
          >
            <span className="grid size-4" aria-hidden="true">
              <AnimatePresence initial={false}>
                <m.span
                  key={status === "copied" ? "copied" : "copy"}
                  className="col-start-1 row-start-1 flex items-center justify-center"
                  initial={hidden}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={hidden}
                  transition={
                    reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }
                  }
                >
                  <Icon className="size-4" />
                </m.span>
              </AnimatePresence>
            </span>
          </CompactButton>
        </AlignTooltip.Trigger>
        <AlignTooltip.Content size="xsmall" side="bottom">
          {label}
        </AlignTooltip.Content>
      </AlignTooltip.Root>
      <span role="status" className="sr-only">
        {status === "idle" ? "" : label}
      </span>
    </AlignTooltip.Provider>
  );
}
