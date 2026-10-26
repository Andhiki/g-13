import { useRef } from "react";

const heights = [30, 45, 85];

export function CourseSheetHandle({
  height,
  onChange,
}: {
  height: number;
  onChange: (height: number) => void;
}) {
  const drag = useRef<{ y: number; height: number } | null>(null);
  const snap = () => {
    onChange(
      heights.reduce((best, next) =>
        Math.abs(next - height) < Math.abs(best - height) ? next : best,
      ),
    );
    drag.current = null;
  };

  return (
    <div className="flex shrink-0 justify-center min-[650px]:hidden">
      <button
        type="button"
        role="slider"
        aria-label="Tinggi detail mata kuliah"
        aria-orientation="vertical"
        aria-valuemin={30}
        aria-valuemax={85}
        aria-valuenow={Math.round(height)}
        aria-valuetext={`${Math.round(height)}% layar`}
        className="flex h-5 w-24 touch-none items-center justify-center rounded-lg cursor-ns-resize focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-base"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          drag.current = { y: event.clientY, height };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          onChange(
            Math.max(
              30,
              Math.min(
                85,
                drag.current.height + ((drag.current.y - event.clientY) / window.innerHeight) * 100,
              ),
            ),
          );
        }}
        onPointerUp={snap}
        onPointerCancel={snap}
        onLostPointerCapture={() => {
          if (drag.current) snap();
        }}
        onKeyDown={(event) => {
          const next =
            event.key === "ArrowUp"
              ? (heights.find((value) => value > height) ?? 85)
              : event.key === "ArrowDown"
                ? ([...heights].reverse().find((value) => value < height) ?? 30)
                : event.key === "Home"
                  ? 30
                  : event.key === "End"
                    ? 85
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
