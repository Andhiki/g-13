import { useEffect, useRef } from "react";

const heights = [30, 75];

export function CourseSheetHandle({
  height,
  onChange,
}: {
  height: number;
  onChange: (height: number) => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const suppressClick = useRef(false);
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const handle = button.current!;
    const sheet = handle.closest<HTMLElement>('[role="dialog"]')!;
    let active: {
      y: number;
      current: number;
      dragging: boolean;
      scroll: HTMLElement | null;
    } | null = null;
    let frame: number | null = null;
    const preview = (next: number) => {
      sheet.style.setProperty("--course-sheet-height", `${next}dvh`);
      handle.setAttribute("aria-valuenow", String(Math.round(next)));
      handle.setAttribute("aria-valuetext", `${Math.round(next)}% layar`);
    };
    const start = (target: EventTarget | null, y: number) => {
      if (!window.matchMedia("(max-width: 649px)").matches) return;
      let scroll = target instanceof HTMLElement ? target : null;
      while (scroll && scroll !== sheet && getComputedStyle(scroll).overflowY !== "auto") {
        scroll = scroll.parentElement;
      }
      active = { y, current: height, dragging: false, scroll: scroll === sheet ? null : scroll };
      suppressClick.current = false;
    };
    const move = (y: number, event: Event) => {
      if (!active) return;
      const delta = active.y - y;
      if (!active.dragging) {
        if (Math.abs(delta) < 8) return;
        // Expanded content keeps native scrolling; dragging down takes over only at its top.
        if ((delta > 0 && height === 75) || (delta < 0 && (active.scroll?.scrollTop ?? 0) > 0)) {
          active = null;
          return;
        }
        active.dragging = true;
      }
      event.preventDefault();
      active.current = Math.max(30, Math.min(75, height + (delta / window.innerHeight) * 100));
      if (frame === null)
        frame = requestAnimationFrame(() => {
          frame = null;
          if (active) preview(active.current);
        });
    };
    const finish = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (active?.dragging) {
        const next = heights.reduce((best, value) =>
          Math.abs(value - active!.current) < Math.abs(best - active!.current) ? value : best,
        );
        preview(next);
        suppressClick.current = true;
        change.current(next);
      }
      active = null;
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) start(event.target, event.touches[0].clientY);
      else finish();
    };
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) move(event.touches[0].clientY, event);
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      suppressClick.current = false;
      const target = event.target as HTMLElement;
      if (target.closest("a, button, input, select, textarea") && !handle.contains(target)) return;
      start(target, event.clientY);
      if (active) event.preventDefault();
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") move(event.clientY, event);
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick.current || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    };
    sheet.addEventListener("touchstart", touchStart, { passive: true });
    sheet.addEventListener("touchmove", touchMove, { passive: false });
    sheet.addEventListener("touchend", finish);
    sheet.addEventListener("touchcancel", finish);
    sheet.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", finish);
    sheet.addEventListener("click", click, true);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      sheet.removeEventListener("touchstart", touchStart);
      sheet.removeEventListener("touchmove", touchMove);
      sheet.removeEventListener("touchend", finish);
      sheet.removeEventListener("touchcancel", finish);
      sheet.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", finish);
      sheet.removeEventListener("click", click, true);
    };
  }, [height]);

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
        className="flex h-5 w-24 touch-none items-center justify-center rounded-lg cursor-ns-resize outline-none focus-visible:[&>span]:bg-primary-base select-none"
        ref={button}
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
