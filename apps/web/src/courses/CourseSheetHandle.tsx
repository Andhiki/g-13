import { useLocale } from "../useLocale";
import { useEffect, useRef, type RefObject } from "react";

import { courseLayout } from "./layout";

const heights = courseLayout.sheetHeights;
const [minimum, maximum] = heights;

export function CourseSheetHandle({
  height,
  onChange,
  onClose,
  sheet: sheetRef,
}: {
  height: number;
  sheet: RefObject<HTMLDivElement | null>;
  onChange: (height: number) => void;
  onClose: () => void;
}) {
  const { text } = useLocale();
  const button = useRef<HTMLButtonElement>(null);
  const suppressClick = useRef(false);
  const change = useRef(onChange);
  const close = useRef(onClose);
  useEffect(() => {
    change.current = onChange;
    close.current = onClose;
  }, [onChange, onClose]);
  useEffect(() => {
    const handle = button.current!;
    const sheet = sheetRef.current!;
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
      handle.setAttribute("aria-valuetext", text("screenHeight", { percent: Math.round(next) }));
    };
    const start = (target: EventTarget | null, y: number) => {
      if (!window.matchMedia(courseLayout.phoneQuery).matches) return;
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
        if (
          (delta > 0 && height === maximum) ||
          (delta < 0 && (active.scroll?.scrollTop ?? 0) > 0)
        ) {
          active = null;
          return;
        }
        active.dragging = true;
      }
      event.preventDefault();
      active.current = Math.max(0, Math.min(maximum, height + (delta / window.innerHeight) * 100));
      if (frame === null)
        frame = requestAnimationFrame(() => {
          frame = null;
          if (active) preview(active.current);
        });
    };
    const finish = (cancelled = false) => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (active?.dragging) {
        suppressClick.current = true;
        if (cancelled || active.current < minimum / 2) {
          preview(height);
          if (!cancelled) close.current();
          active = null;
          return;
        }
        const next = heights.reduce((best, value) =>
          Math.abs(value - active!.current) < Math.abs(best - active!.current) ? value : best,
        );
        preview(next);
        change.current(next);
      }
      active = null;
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) start(event.target, event.touches[0].clientY);
      else finish(true);
    };
    const end = () => finish();
    const cancel = () => finish(true);
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) move(event.touches[0].clientY, event);
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      suppressClick.current = false;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
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
    sheet.addEventListener("touchend", end);
    sheet.addEventListener("touchcancel", cancel);
    sheet.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", end);
    sheet.addEventListener("click", click, true);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      sheet.removeEventListener("touchstart", touchStart);
      sheet.removeEventListener("touchmove", touchMove);
      sheet.removeEventListener("touchend", end);
      sheet.removeEventListener("touchcancel", cancel);
      sheet.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", end);
      sheet.removeEventListener("click", click, true);
    };
  }, [height, text, sheetRef]);

  return (
    <div className="flex shrink-0 justify-center min-[650px]:hidden">
      <button
        type="button"
        role="slider"
        aria-label={text("Tinggi detail mata kuliah")}
        aria-orientation="vertical"
        aria-valuemin={minimum}
        aria-valuemax={maximum}
        aria-valuenow={Math.round(height)}
        aria-valuetext={text("screenHeight", { percent: Math.round(height) })}
        className="flex h-5 w-24 touch-none items-center justify-center rounded-lg cursor-ns-resize outline-none focus-visible:[&>span]:bg-primary-base select-none"
        ref={button}
        onKeyDown={(event) => {
          const next =
            event.key === "ArrowUp"
              ? (heights.find((value) => value > height) ?? maximum)
              : event.key === "ArrowDown"
                ? ([...heights].reverse().find((value) => value < height) ?? minimum)
                : event.key === "Home"
                  ? minimum
                  : event.key === "End"
                    ? maximum
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
