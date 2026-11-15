import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { RiArrowLeftLine, RiSearchLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import * as Tabs from "@radix-ui/react-tabs";
import { m, useReducedMotion } from "motion/react";
import { useLocale } from "../../useLocale";
import { AlignButton } from "../../ui/button";
import { Loading } from "../../ui/loading";
import { AlignKbd } from "../../ui/kbd";
import { useKeyboardShortcuts } from "../../ui/use-keyboard-shortcuts";
import { Typography } from "../../ui/typography";
import { AlumniDirectoryCard } from "./AlumniDirectoryCard";
import { filterAlumni, type AlumniDirectoryData } from "./directory";
import { useAlumniDirectory } from "./useAlumniDirectory";

const allBatches = "semua";
const tabClassName =
  "relative shrink-0 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-label-sm text-text-sub-600 transition-colors hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-base data-[state=active]:border-primary-base data-[state=active]:text-text-strong-950";
const letterOf = (name: string) => name[0]?.toLocaleUpperCase("id") ?? "#";

export function AlumniDirectory({ initialData }: { initialData: AlumniDirectoryData | null }) {
  const { text } = useLocale("alumni");
  const directory = useAlumniDirectory(initialData);
  const [batch, setBatch] = useState(allBatches);
  const [query, setQuery] = useState("");
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const stickyMarkerRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const reducedMotion = useReducedMotion();
  useKeyboardShortcuts({ "/": () => searchRef.current?.focus() });

  useEffect(() => {
    const update = () => {
      const marker = stickyMarkerRef.current;
      const section = searchSectionRef.current;
      if (marker && section)
        setIsSticky(marker.getBoundingClientRect().top < section.getBoundingClientRect().top);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  // Keystrokes stay responsive on mobile; the heavy list re-renders behind them.
  const deferredQuery = useDeferredValue(query);

  const items = directory.status === "ready" ? directory.data.items : [];
  const batches = directory.status === "ready" ? directory.data.batches : [];

  const filtered = useMemo(
    () =>
      filterAlumni(items, {
        batch: batch === allBatches ? undefined : Number(batch),
        query: deferredQuery,
      }),
    [items, batch, deferredQuery],
  );

  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState("");
  const [hovered, setHovered] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const draggingRef = useRef(false);
  const lastDragLetterRef = useRef("");
  // Browsers synthesise compat mouse pointer events right after a touch lift;
  // ignore them so the rail does not spring back open after a scrub.
  const lastTouchRef = useRef(0);
  const recentTouch = () => Date.now() - lastTouchRef.current < 700;
  const letters = useMemo(
    () => [...new Set(filtered.map((item) => letterOf(item.name)))],
    [filtered],
  );
  useEffect(() => {
    const update = () => {
      const cards = listRef.current?.querySelectorAll<HTMLElement>("[data-letter]");
      if (!cards?.length) return;
      let letter = cards[0]?.dataset.letter ?? "";
      for (const card of cards) {
        if (card.getBoundingClientRect().top > window.innerHeight / 3) break;
        letter = card.dataset.letter ?? letter;
      }
      setCurrent(letter);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [filtered]);
  const activeIndex = letters.indexOf(hovered || current);
  const jump = (letter: string) => {
    const target = [
      ...(listRef.current?.querySelectorAll<HTMLElement>("[data-letter]") ?? []),
    ].find((card) => card.dataset.letter === letter);
    target?.scrollIntoView({ block: "start", behavior: "auto" });
    setCurrent(letter);
  };
  // Maps a thumb position to the letter whose button covers it, clamping
  // overshoot above/below the rail so fast drags never lose the pointer.
  const letterFromY = (clientY: number): string | null => {
    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>("[data-letter]");
    const count = buttons?.length ?? 0;
    if (!count || !buttons) return null;
    const first = buttons[0].getBoundingClientRect();
    const last = buttons[count - 1].getBoundingClientRect();
    const step = (last.bottom - first.top) / count;
    const index = Math.min(count - 1, Math.max(0, Math.floor((clientY - first.top) / step)));
    return buttons[index]?.dataset.letter ?? null;
  };
  const dragTo = (clientY: number) => {
    const letter = letterFromY(clientY);
    if (!letter || letter === lastDragLetterRef.current) return;
    lastDragLetterRef.current = letter;
    setHovered(letter);
    jump(letter);
  };
  const endDrag = (collapse: boolean) => {
    draggingRef.current = false;
    lastDragLetterRef.current = "";
    if (collapse) {
      setHovered("");
      setExpanded(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-8 text-text-strong-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <Link
            to="/alumni"
            className="inline-flex items-center gap-1.5 rounded text-label-sm text-text-sub-600 transition hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
          >
            <RiArrowLeftLine aria-hidden="true" className="size-4" />
            {text("Kembali ke alumni")}
          </Link>
          <h1 className="sr-only">{text("Semua alumni")}</h1>
        </header>

        <Tabs.Root value={batch} onValueChange={setBatch}>
          <div ref={stickyMarkerRef} aria-hidden="true" className="relative top-3" />
          <section
            ref={searchSectionRef}
            aria-label={text("Filter alumni")}
            className="sticky top-[var(--app-header-height)] z-30 mt-3 py-3"
          >
            <m.div
              className="relative mx-auto"
              initial={false}
              animate={{ width: isSticky ? "90%" : "100%" }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.12, ease: "easeOut" }}
            >
              <label htmlFor={searchId} className="sr-only">
                {text("Cari alumni")}
              </label>
              <RiSearchLine
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-primary-base"
              />
              <input
                id={searchId}
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={text("Cari nama, instansi, atau posisi")}
                className="h-12 w-full rounded-full bg-bg-weak-50/60 backdrop-blur-xl pl-12 pr-4 min-[651px]:pr-12 text-paragraph-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 outline-none transition-colors duration-120 placeholder:text-text-sub-600 focus:bg-bg-weak-50/75 focus:ring-primary-base"
              />
              <AlignKbd.Root
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              >
                /
              </AlignKbd.Root>
            </m.div>
          </section>
          {directory.status === "ready" && (
            <Tabs.List
              aria-label={text("Angkatan")}
              className="mt-5 flex w-full overflow-x-auto border-b border-stroke-soft-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Tabs.Trigger value={allBatches} className={tabClassName}>
                {text("Semua angkatan")}
              </Tabs.Trigger>
              {batches.map((year) => (
                <Tabs.Trigger key={year} value={String(year)} className={tabClassName}>
                  {text("Angkatan {{v0}}", { v0: String(year) })}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          )}

          <Tabs.Content value={batch}>
            <p aria-live="polite" className="mt-6 text-paragraph-sm text-text-sub-600">
              {directory.status === "ready" &&
                text("Menampilkan {{v0}} alumni", { v0: String(filtered.length) })}
            </p>

            {directory.status === "loading" && (
              <div className="mt-6 flex min-h-64">
                <Loading />
              </div>
            )}

            {directory.status === "unavailable" && (
              <div
                role="alert"
                className="mt-6 flex flex-col items-start gap-3 rounded-10 bg-bg-weak-50 p-6"
              >
                <Typography variant="label" className="m-0">
                  {text("Daftar alumni gagal dimuat.")}
                </Typography>
                <AlignButton.Root size="small" onClick={directory.reload}>
                  {text("Coba lagi")}
                </AlignButton.Root>
              </div>
            )}

            {directory.status === "ready" && filtered.length === 0 && (
              <div className="mt-6 rounded-10 border border-stroke-soft-200 p-10 text-center">
                <Typography variant="label" className="m-0">
                  {text("Tidak ada alumni yang cocok.")}
                </Typography>
                <Typography variant="paragraph" className="mb-0 mt-2 text-text-sub-600">
                  {text("Coba kata kunci lain atau pilih semua angkatan.")}
                </Typography>
              </div>
            )}

            {filtered.length > 0 && (
              <ul
                ref={listRef}
                className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtered.map((alumnus) => (
                  <li
                    key={alumnus.id}
                    data-letter={letterOf(alumnus.name)}
                    className="min-w-0 scroll-mt-36"
                  >
                    <AlumniDirectoryCard alumnus={alumnus} />
                  </li>
                ))}
              </ul>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
      {letters.length > 1 && (
        <nav
          ref={navRef}
          aria-label={text("Navigasi alfabet")}
          className={`fixed right-0 top-1/2 z-20 flex -translate-y-1/2 touch-none flex-col items-end py-2 transition-transform duration-200 ${
            expanded ? "translate-x-0" : "translate-x-7"
          }`}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse" && !recentTouch()) setExpanded(true);
          }}
          onPointerLeave={() => {
            if (!draggingRef.current) endDrag(true);
          }}
          onPointerDown={(event) => {
            draggingRef.current = true;
            lastDragLetterRef.current = "";
            setExpanded(true);
            navRef.current?.setPointerCapture(event.pointerId);
            dragTo(event.clientY);
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) dragTo(event.clientY);
          }}
          onPointerUp={(event) => {
            if (event.pointerType !== "mouse") lastTouchRef.current = Date.now();
            endDrag(event.pointerType !== "mouse");
          }}
          onPointerCancel={() => endDrag(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setHovered("");
              setExpanded(false);
            }
          }}
        >
          {letters.map((letter, index) => (
            <button
              key={letter}
              type="button"
              data-letter={letter}
              aria-label={text("Ke huruf {{v0}}", { v0: letter })}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse" || !recentTouch()) setHovered(letter);
              }}
              onFocus={() => {
                setExpanded(true);
                setHovered(letter);
              }}
              onBlur={() => setHovered("")}
              onClick={() => jump(letter)}
              className="group relative flex h-3 w-9 items-center justify-end pr-1 focus-visible:outline-2 focus-visible:outline-primary-base"
            >
              {(hovered === letter || (!hovered && current === letter)) && (
                <span className="absolute right-9 rounded-6 bg-bg-strong-950 px-2 py-1 text-label-sm text-text-white-0">
                  {letter}
                </span>
              )}
              <span
                className={`h-0.5 rounded-full bg-text-sub-600 transition-all ${
                  activeIndex >= 0 && index === activeIndex
                    ? "w-6 opacity-100"
                    : activeIndex >= 0 && Math.abs(index - activeIndex) === 1
                      ? "w-5 opacity-70"
                      : activeIndex >= 0 && Math.abs(index - activeIndex) === 2
                        ? "w-4 opacity-50"
                        : "w-3 opacity-40"
                }`}
              />
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
