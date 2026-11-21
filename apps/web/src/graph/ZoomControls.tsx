import { useState } from "react";
import { MapControlPanel } from "./Overlay";
import { useLocale } from "../useLocale";
import { Panel, useReactFlow, useStore } from "@xyflow/react";
import { RiAddLine, RiSubtractLine, RiFocus3Line, RiKeyboardLine } from "@remixicon/react";
import { useReducedMotion } from "motion/react";
import { AlignButton } from "../ui/button";
import { AlignKbd } from "../ui/kbd";
import { shortcuts } from "../ui/shortcuts";
import { Typography } from "../ui/typography";

type ListedShortcut = ReturnType<typeof shortcuts.list>[number] & { description: string };

export function ZoomControls({
  active = true,
  onReset,
  selected,
  className = "",
}: {
  active?: boolean;
  className?: string;
  onReset: () => void;
  selected: boolean;
  /** Still accepted (and ignored) while CurriculumMap and RoadmapGraph stop passing them. */
}) {
  const { text } = useLocale();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // Snapshot before opening: the panel is a popup, and a help screen must list the page's
  // shortcuts even though the registry pauses them behind the panel it is rendered in.
  const [listed, setListed] = useState<ListedShortcut[]>([]);
  const changeOpen = (open: boolean) => {
    if (open) {
      setListed(
        shortcuts
          .list()
          .filter((item): item is ListedShortcut => !!item.description)
          .sort((a, b) => Number(/^\d/.test(b.keys)) - Number(/^\d/.test(a.keys))),
      );
    }
    setShortcutsOpen(open);
  };
  return (
    <Panel
      position="bottom-right"
      className={`m-4! mb-[max(1rem,env(safe-area-inset-bottom))]! max-[1100px]:mb-[max(0.75rem,env(safe-area-inset-bottom))]! max-[1100px]:hidden ${className}`}
    >
      <div className="flex items-end gap-2">
        <div className="relative size-10">
          <MapControlPanel
            label="Pintasan keyboard"
            title="Pintasan keyboard"
            icon={RiKeyboardLine}
            controlsId="map-keyboard-shortcuts"
            width={240}
            anchor="bottom"
            className="bottom-0"
            open={shortcutsOpen}
            onOpenChange={changeOpen}
          >
            <dl className="m-0 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
              {listed.map((item) => (
                <div
                  key={item.keys}
                  className="col-span-2 grid grid-cols-subgrid items-center gap-x-3"
                >
                  <dt>
                    <Typography as="span" variant="caption" color="muted">
                      {text(item.description, { v0: item.keys })}
                    </Typography>
                  </dt>
                  <dd className="m-0 justify-self-end">
                    <AlignKbd.Root>{item.hint}</AlignKbd.Root>
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
        color="muted"
        className="min-w-10 text-center tabular-nums"
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
