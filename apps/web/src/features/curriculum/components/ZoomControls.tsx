import { Panel, useReactFlow, useViewport } from "@xyflow/react";
import { RiAddLine, RiSubtractLine, RiFocus3Line } from "@remixicon/react";
import { useReducedMotion } from "motion/react";
import { AlignButton } from "../../../ui/button";
import { Typography } from "../../../ui/typography";

export function ZoomControls({ onReset, selected }: { onReset: () => void; selected: boolean }) {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  const reducedMotion = useReducedMotion();
  const options = { duration: reducedMotion ? 0 : 150 };
  return (
    <Panel
      position="bottom-right"
      className={`m-3! sm:m-4! ${selected ? "max-[650px]:bottom-[var(--course-sheet-height)]!" : ""}`}
    >
      <div
        role="group"
        aria-label="Kontrol zoom"
        className="flex items-center gap-1 rounded-10 bg-bg-white-0 p-1 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200"
      >
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          className="size-10 p-0"
          aria-label="Perkecil"
          title="Perkecil"
          disabled={zoom <= 0.05}
          onClick={() => zoomOut(options)}
        >
          <RiSubtractLine className="size-5" aria-hidden="true" />
        </AlignButton.Root>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          className="size-10 p-0"
          aria-label="Perbesar"
          title="Perbesar"
          disabled={zoom >= 1.35}
          onClick={() => zoomIn(options)}
        >
          <RiAddLine className="size-5" aria-hidden="true" />
        </AlignButton.Root>
        <Typography
          as="span"
          variant="label"
          className="min-w-14 text-center tabular-nums text-text-sub-600"
          aria-label={`Zoom ${Math.round(zoom * 100)}%`}
        >
          {Math.round(zoom * 100)}%
        </Typography>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          className="size-10 p-0"
          aria-label="Kembali ke tampilan awal"
          title="Kembali ke tampilan awal"
          onClick={onReset}
        >
          <RiFocus3Line className="size-5" aria-hidden="true" />
        </AlignButton.Root>
      </div>
    </Panel>
  );
}
