import { useEffect, useRef } from "react";

const heights = [30, 75];

export function CourseSheetHandle({
  height,
  onChange,
}: {
  height: number;
  onChange: (height: number) => void;
}) {
  const drag = useRef<{
    y: number;
    height: number;
    current: number;
    viewport: number;
    handle: HTMLButtonElement;
  } | null>(null);
  const frame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  const preview = (handle: HTMLButtonElement, next: number) => {
    handle
      .closest<HTMLElement>('[role="dialog"]')
      ?.style.setProperty("--course-sheet-height", `${next}dvh`);
    handle.setAttribute("aria-valuenow", String(Math.round(next)));
    handle.setAttribute("aria-valuetext", `${Math.round(next)}% layar`);
  };
  const snap = () => {
    const active = drag.current;
    if (!active) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const next = heights.reduce((best, next) =>
      Math.abs(next - active.current) < Math.abs(best - active.current) ? next : best,
    );
    preview(active.handle, next);
    drag.current = null;
    onChange(next);
  };

  return (
    <div className="flex shrink-0 justify-center min-[650px]:hidden">
      <button
        type="button"
        role="slider"
        aria-label="Tinggi detail mata kuliah"
        aria-orientation="vertical"
        aria-valuemin={30}
        aria-valuemax={75}
        aria-valuenow={Math.round(height)}
        aria-valuetext={`${Math.round(height)}% layar`}
        className="flex h-5 w-24 touch-none items-center justify-center rounded-lg cursor-ns-resize focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-base"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          drag.current = {
            y: event.clientY,
            height,
            current: height,
            viewport: window.innerHeight,
            handle: event.currentTarget,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          drag.current.current = Math.max(
            30,
            Math.min(
              75,
              drag.current.height +
                ((drag.current.y - event.clientY) / drag.current.viewport) * 100,
            ),
          );
          // Keep pointer movement off the React tree; commit the snapped height on release.
          if (frame.current === null)
            frame.current = requestAnimationFrame(() => {
              frame.current = null;
              const active = drag.current;
              if (active) preview(active.handle, active.current);
            });
        }}
        onPointerUp={snap}
        onPointerCancel={snap}
        onLostPointerCapture={() => {
          if (drag.current) snap();
        }}
        onKeyDown={(event) => {
          const next =
            event.key === "ArrowUp"
              ? (heights.find((value) => value > height) ?? 75)
              : event.key === "ArrowDown"
                ? ([...heights].reverse().find((value) => value < height) ?? 30)
                : event.key === "Home"
                  ? 30
                  : event.key === "End"
                    ? 75
                    : undefined;
          if (next === undefined) return;
          event.preventDefault();
          onChange(next);
        }}
      >
        <span className="h-1 w-10 rounded-full bg-stroke-soft-200" aria-hidden="true" />
      </button>
    </div>
  );
}
