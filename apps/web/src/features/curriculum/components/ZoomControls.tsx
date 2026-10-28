import { Panel, useReactFlow, useViewport } from "@xyflow/react";
import { RiAddLine, RiSubtractLine, RiFocus3Line } from "@remixicon/react";
import { useReducedMotion } from "motion/react";
import { AlignButton } from "../../../ui/button";
import { AlignKbd } from "../../../ui/kbd";
import { Typography } from "../../../ui/typography";

export function ZoomControls({
  onReset,
  selected,
  lastSemester,
}: {
  onReset: () => void;
  selected: boolean;
  lastSemester: number;
}) {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  const reducedMotion = useReducedMotion();
  const options = { duration: reducedMotion ? 0 : 150 };
  return (
    <Panel
      position="bottom-right"
      className={`m-3! sm:m-4! ${selected ? "max-[650px]:bottom-[var(--course-sheet-height)]!" : ""}`}
    >
      <div className="flex flex-col gap-2">
        <aside
          aria-labelledby="map-keyboard-shortcuts-heading"
          className="w-52 rounded-10 bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200"
        >
          <Typography
            as="h2"
            variant="label"
            id="map-keyboard-shortcuts-heading"
            className="m-0 mb-2 text-text-strong-950"
          >
            Pintasan keyboard
          </Typography>
          <dl className="m-0 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
            {[
              { key: `1–${lastSemester}`, description: "Ke semester" },
              { key: "f", description: "Buka/tutup filter" },
              { key: "v", description: "Ganti tampilan" },
              { key: "/", description: "Cari mata kuliah" },
              { key: "d", description: "Ganti tema" },
            ].map(({ key, description }) => (
              <div key={key} className="col-span-2 grid grid-cols-[auto_1fr] items-center gap-x-3">
                <dt>
                  <AlignKbd.Root>{key}</AlignKbd.Root>
                </dt>
                <dd className="m-0">
                  <Typography as="span" variant="caption" className="text-text-sub-600">
                    {description}
                  </Typography>
                </dd>
              </div>
            ))}
          </dl>
        </aside>
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
      </div>
    </Panel>
  );
}
