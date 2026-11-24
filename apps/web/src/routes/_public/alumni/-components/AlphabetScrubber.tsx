import { memo, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { animate, m, useMotionValue, useReducedMotion } from "motion/react";

const TICK_SCALES = [1, 0.833, 0.667] as const;
const TICK_OPACITIES = ["1", "0.7", "0.5"] as const;

function collectAlphabetTargets(
  listEl: HTMLUListElement | null,
  letters: string[],
  buttons: (HTMLButtonElement | null)[],
) {
  const cards = listEl?.querySelectorAll<HTMLElement>("[data-letter]");
  const targetMap = new Map<string, HTMLElement>();
  const ordered: { letter: string; el: HTMLElement }[] = [];
  if (cards) {
    for (const card of cards) {
      const letter = card.dataset.letter ?? "";
      ordered.push({ letter, el: card });
      if (letter && !targetMap.has(letter)) targetMap.set(letter, card);
    }
  }
  const offsets = letters.map((_, i) => {
    const btn = buttons[i];
    return btn ? btn.offsetTop + btn.offsetHeight / 2 : 0;
  });
  return { targetMap, ordered, offsets };
}

function useAlphabetScrubber({
  letters,
  listRef,
  reducedMotion,
}: {
  letters: string[];
  listRef: RefObject<HTMLUListElement | null>;
  reducedMotion: boolean | null;
}) {
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const offsetsRef = useRef<number[]>([]);
  const targetMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const orderedCardsRef = useRef<{ letter: string; el: HTMLElement }[]>([]);
  const railRectRef = useRef<{ top: number; bottom: number; step: number } | null>(null);
  const draggingRef = useRef(false);
  const lastDragIndexRef = useRef(-1);
  const scrollIndexRef = useRef(0);
  const hoverIndexRef = useRef(-1);
  // Browsers synthesise compat mouse pointer events right after a touch lift;
  // ignore them so the rail does not spring back open after a scrub.
  const lastTouchRef = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const rubberY = useMotionValue(0);

  const recentTouch = () => Date.now() - lastTouchRef.current < 700;

  const setTickTransition = (enabled: boolean) => {
    for (const tick of tickRefs.current) {
      if (tick) tick.style.transitionDuration = enabled && !reducedMotion ? "150ms" : "0ms";
    }
  };

  const paintActive = useCallback(
    (index: number, showPill: boolean) => {
      for (let i = 0; i < letters.length; i++) {
        const tick = tickRefs.current[i];
        if (!tick) continue;
        const dist = index >= 0 ? Math.abs(i - index) : 99;
        tick.style.transform = `scaleX(${TICK_SCALES[dist] ?? 0.5})`;
        tick.style.opacity = TICK_OPACITIES[dist] ?? "0.4";
      }
      const pill = pillRef.current;
      if (!pill) return;
      if (showPill && index >= 0 && letters[index]) {
        const offsetTop = offsetsRef.current[index] ?? 0;
        pill.textContent = letters[index];
        pill.style.opacity = "1";
        pill.style.transform = `translate3d(0, calc(${offsetTop}px - 50%), 0)`;
      } else {
        pill.style.opacity = "0";
      }
    },
    [letters],
  );

  const cacheTargetsAndOffsets = useCallback(() => {
    const cached = collectAlphabetTargets(listRef.current, letters, buttonRefs.current);
    targetMapRef.current = cached.targetMap;
    orderedCardsRef.current = cached.ordered;
    offsetsRef.current = cached.offsets;
  }, [letters, listRef]);

  useEffect(() => {
    cacheTargetsAndOffsets();
    const updateFromScroll = () => {
      const cards = orderedCardsRef.current;
      if (!cards.length) return;
      let letter = cards[0].letter;
      for (const card of cards) {
        if (card.el.getBoundingClientRect().top > window.innerHeight / 3) break;
        letter = card.letter;
      }
      const nextIdx = letters.indexOf(letter);
      if (nextIdx < 0) return;
      scrollIndexRef.current = nextIdx;
      if (!draggingRef.current && hoverIndexRef.current < 0) paintActive(nextIdx, false);
    };
    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateFromScroll);
  }, [cacheTargetsAndOffsets, letters, paintActive]);

  const jumpIndex = (index: number) => {
    const letter = letters[index];
    if (!letter) return;
    targetMapRef.current.get(letter)?.scrollIntoView({ block: "start", behavior: "auto" });
    scrollIndexRef.current = index;
  };

  const dragTo = (clientY: number) => {
    const rect = railRectRef.current;
    const count = letters.length;
    if (!rect || !count) return;
    if (clientY < rect.top) {
      const overshoot = rect.top - clientY;
      rubberY.set(reducedMotion ? 0 : -((overshoot * 24) / (overshoot + 48)));
    } else if (clientY > rect.bottom) {
      const overshoot = clientY - rect.bottom;
      rubberY.set(reducedMotion ? 0 : (overshoot * 24) / (overshoot + 48));
    } else {
      rubberY.set(0);
    }
    const index = Math.min(count - 1, Math.max(0, Math.floor((clientY - rect.top) / rect.step)));
    if (index === lastDragIndexRef.current) return;
    lastDragIndexRef.current = index;
    paintActive(index, true);
    jumpIndex(index);
  };

  const finishDrag = (collapse: boolean) => {
    draggingRef.current = false;
    lastDragIndexRef.current = -1;
    railRectRef.current = null;
    setTickTransition(true);
    if (reducedMotion) rubberY.set(0);
    else animate(rubberY, 0, { type: "spring", stiffness: 500, damping: 32 });
    if (collapse) {
      hoverIndexRef.current = -1;
      setExpanded(false);
      paintActive(scrollIndexRef.current, false);
    } else {
      const activeIdx = hoverIndexRef.current >= 0 ? hoverIndexRef.current : scrollIndexRef.current;
      paintActive(activeIdx, hoverIndexRef.current >= 0);
    }
  };

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const count = letters.length;
    const first = buttonRefs.current[0]?.getBoundingClientRect();
    const last = buttonRefs.current[count - 1]?.getBoundingClientRect();
    if (!first || !last) return;
    cacheTargetsAndOffsets();
    railRectRef.current = {
      top: first.top,
      bottom: last.bottom,
      step: (last.bottom - first.top) / count,
    };
    draggingRef.current = true;
    lastDragIndexRef.current = -1;
    setTickTransition(false);
    setExpanded(true);
    navRef.current?.setPointerCapture(event.pointerId);
    dragTo(event.clientY);
  };

  const navHandlers = {
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && !recentTouch()) setExpanded(true);
    },
    onPointerLeave: () => {
      if (draggingRef.current) return;
      hoverIndexRef.current = -1;
      setExpanded(false);
      paintActive(scrollIndexRef.current, false);
    },
    onPointerDown: startDrag,
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (draggingRef.current) dragTo(event.clientY);
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return;
      if (event.pointerType !== "mouse") lastTouchRef.current = Date.now();
      const shouldCollapse = event.pointerType !== "mouse" || !navRef.current?.matches(":hover");
      finishDrag(shouldCollapse);
    },
    onPointerCancel: () => {
      if (draggingRef.current) finishDrag(true);
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      hoverIndexRef.current = -1;
      setExpanded(false);
      paintActive(scrollIndexRef.current, false);
    },
  };

  return {
    navRef,
    pillRef,
    buttonRefs,
    tickRefs,
    expanded,
    rubberY,
    navHandlers,
    recentTouch,
    draggingRef,
    hoverIndexRef,
    scrollIndexRef,
    setExpanded,
    paintActive,
    jumpIndex,
  };
}

function AlphabetTickButton({
  letter,
  index,
  scrubber,
  letterLabel,
}: {
  letter: string;
  index: number;
  scrubber: ReturnType<typeof useAlphabetScrubber>;
  letterLabel: (letter: string) => string;
}) {
  return (
    <button
      ref={(el) => {
        scrubber.buttonRefs.current[index] = el;
      }}
      type="button"
      data-letter={letter}
      aria-label={letterLabel(letter)}
      onPointerEnter={(event) => {
        if (
          event.pointerType === "mouse" &&
          !scrubber.recentTouch() &&
          !scrubber.draggingRef.current
        ) {
          scrubber.hoverIndexRef.current = index;
          scrubber.paintActive(index, true);
        }
      }}
      onFocus={() => {
        scrubber.setExpanded(true);
        scrubber.hoverIndexRef.current = index;
        scrubber.paintActive(index, true);
      }}
      onBlur={() => {
        scrubber.hoverIndexRef.current = -1;
        scrubber.paintActive(scrubber.scrollIndexRef.current, false);
      }}
      onClick={() => scrubber.jumpIndex(index)}
      className="group relative flex h-3 w-11 items-center justify-start pl-1 focus-visible:outline-2 focus-visible:outline-primary-base"
    >
      <span
        ref={(el) => {
          scrubber.tickRefs.current[index] = el;
        }}
        className="h-0.5 w-6 origin-left rounded-full bg-text-sub-600 transition-[transform,opacity] duration-150"
      />
    </button>
  );
}

export const AlphabetScrubber = memo(function AlphabetScrubber({
  letters,
  listRef,
  label,
  letterLabel,
}: {
  letters: string[];
  listRef: RefObject<HTMLUListElement | null>;
  label: string;
  letterLabel: (letter: string) => string;
}) {
  const reducedMotion = useReducedMotion();
  const scrubber = useAlphabetScrubber({ letters, listRef, reducedMotion });

  return (
    <div className="fixed left-0 top-1/2 z-20 -translate-y-1/2">
      <m.div style={reducedMotion ? undefined : { y: scrubber.rubberY }}>
        <nav
          ref={scrubber.navRef}
          aria-label={label}
          className={`relative flex touch-none flex-col items-start py-2 transition-transform duration-200 before:absolute before:-inset-y-2 before:left-0 before:w-12 before:content-[''] ${
            scrubber.expanded ? "translate-x-0" : "-translate-x-1"
          }`}
          {...scrubber.navHandlers}
        >
          <span
            ref={scrubber.pillRef}
            aria-hidden="true"
            style={{ opacity: 0 }}
            className="pointer-events-none absolute left-12 top-0 rounded-md bg-bg-strong-950 px-2 py-1 text-label-sm text-text-white-0 transition-opacity duration-100"
          />
          {letters.map((letter, index) => (
            <AlphabetTickButton
              key={letter}
              letter={letter}
              index={index}
              scrubber={scrubber}
              letterLabel={letterLabel}
            />
          ))}
        </nav>
      </m.div>
    </div>
  );
});
