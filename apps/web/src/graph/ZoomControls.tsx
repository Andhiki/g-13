import { useState } from "react";
import { MapControlPanel } from "./Overlay";
import { useLocale } from "../useLocale";
import { Panel, useReactFlow, useStore } from "@xyflow/react";
import { RiAddLine, RiSubtractLine, RiFocus3Line, RiKeyboardLine } from "@remixicon/react";
import { useReducedMotion } from "motion/react";
import { AlignButton } from "../ui/button";
import { AlignKbd } from "../ui/kbd";
import { Typography } from "../ui/typography";

export function ZoomControls({
  active = true,
  onReset,
  selected,
  lastSemester,
  shortcuts,
  className = "",
}: {
  active?: boolean;
  className?: string;
  onReset: () => void;
  selected: boolean;
  lastSemester: number;
  shortcuts: { key: string; description: string }[];
}) {
  const { text } = useLocale();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  return (
    <Panel position="bottom-right" className={`m-4! max-[650px]:hidden ${className}`}>
      <div className="flex items-end gap-2">
        <div className="relative size-10">
          <MapControlPanel
            label="Pintasan keyboard"
            title="Pintasan keyboard"
            icon={RiKeyboardLine}
            controlsId="map-keyboard-shortcuts"
            width={240}
            className="bottom-0"
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
          >
            <dl className="m-0 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
              <div className="col-span-2 grid grid-cols-subgrid items-center gap-x-3">
                <dt>
                  <Typography as="span" variant="caption" className="text-text-sub-600">
                    {text("Ke semester")}
                  </Typography>
                </dt>
                <dd className="m-0 flex items-center justify-end gap-1">
                  <AlignKbd.Root>1</AlignKbd.Root>
                  <Typography as="span" variant="caption" className="text-text-sub-600">
                    -
                  </Typography>
                  <AlignKbd.Root>{lastSemester}</AlignKbd.Root>
                </dd>
              </div>
              {shortcuts.map(({ key, description }) => (
                <div key={key} className="col-span-2 grid grid-cols-subgrid items-center gap-x-3">
                  <dt>
                    <Typography as="span" variant="caption" className="text-text-sub-600">
                      {text(description)}
                    </Typography>
                  </dt>
                  <dd className="m-0 justify-self-end">
                    <AlignKbd.Root>{key}</AlignKbd.Root>
                  </dd>
                </div>
              ))}
            </dl>
          </MapControlPanel>
        </div>
        {active && !selected && <ZoomButtons onReset={onReset} />}
      </div>
    </Panel>
  );
}

function ZoomButtons({ onReset }: { onReset: () => void }) {
  const { text } = useLocale();
  const { zoomIn, zoomOut } = useReactFlow();
  const percent = useStore((state) => Math.round(state.transform[2] * 100));
  const atMinimum = useStore((state) => state.transform[2] <= 0.05);
  const atMaximum = useStore((state) => state.transform[2] >= 1.35);
  const reducedMotion = useReducedMotion();
  const options = { duration: reducedMotion ? 0 : 150 };
  return (
    <div
      role="group"
      aria-label={text("Kontrol zoom")}
      className="flex items-center gap-0 rounded-10 bg-bg-white-0 p-1 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200"
    >
      <AlignButton.Root
        variant="neutral"
        mode="ghost"
        size="xsmall"
        className="size-8 p-0"
        aria-label={text("Perkecil")}
        title={text("Perkecil")}
        disabled={atMinimum}
        onClick={() => zoomOut(options)}
      >
        <RiSubtractLine className="size-4" aria-hidden="true" />
      </AlignButton.Root>
      <AlignButton.Root
        variant="neutral"
        mode="ghost"
        size="xsmall"
        className="size-8 p-0"
        aria-label={text("Perbesar")}
        title={text("Perbesar")}
        disabled={atMaximum}
        onClick={() => zoomIn(options)}
      >
        <RiAddLine className="size-4" aria-hidden="true" />
      </AlignButton.Root>
      <Typography
        as="span"
        variant="label"
        className="min-w-10 text-center tabular-nums text-text-sub-600"
        aria-label={text("Zoom {{v0}}%", { v0: percent })}
      >
        {percent}%
      </Typography>
      <AlignButton.Root
        variant="neutral"
        mode="ghost"
        size="xsmall"
        className="size-8 p-0"
        aria-label={text("Kembali ke tampilan awal")}
        title={text("Kembali ke tampilan awal")}
        onClick={onReset}
      >
        <RiFocus3Line className="size-4" aria-hidden="true" />
      </AlignButton.Root>
    </div>
  );
}
