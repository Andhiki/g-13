import { useLocale } from "../useLocale";
import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { toast, SuccessToast } from "../ui/toast";
import { CompactButton } from "../ui/compact-button";
import { AlignTooltip } from "../ui/tooltip";

export function CopyCourseButton({ value, label }: { value: string; label: string }) {
  const { text } = useLocale();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const statusLabel =
    status === "copied"
      ? text("{{v0}} disalin", { v0: label })
      : status === "error"
        ? text("Gagal menyalin. Coba lagi.")
        : text("Salin {{v0}}", { v0: label });
  const Icon = status === "copied" ? RiCheckLine : RiFileCopyLine;
  const hidden = {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.25,
  };
  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <CompactButton
            aria-label={statusLabel}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                setStatus("copied");
                toast.custom(() => (
                  <SuccessToast message={text("{{v0}} disalin", { v0: label })} />
                ));
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
                  animate={{ opacity: 1, scale: 1 }}
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
          {statusLabel}
        </AlignTooltip.Content>
      </AlignTooltip.Root>
      <span role="status" className="sr-only">
        {status === "idle" ? "" : statusLabel}
      </span>
    </AlignTooltip.Provider>
  );
}
