import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { RiArrowLeftLine, RiSearchLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import * as Tabs from "@radix-ui/react-tabs";
import { m, useReducedMotion } from "motion/react";
import { useLocale } from "@/useLocale";
import { AlignButton } from "@/ui/button";
import { Loading } from "@/ui/loading";
import { AlignKbd } from "@/ui/kbd";
import { useKeyboardShortcuts, useShortcutHint } from "@/ui/shortcuts";
import { Typography } from "@/ui/typography";
import { AlumniDirectoryCard } from "./AlumniDirectoryCard";
import { filterAlumni, type AlumniDirectoryData } from "../-shared/directory";
import { useAlumniDirectory } from "../-client/useAlumniDirectory";
import { AlphabetScrubber } from "./AlphabetScrubber";

const allBatches = "semua";
const tabClassName =
  "relative shrink-0 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-label-sm text-text-sub-600 transition-colors hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-base data-[state=active]:border-primary-base data-[state=active]:text-text-strong-950";
const letterOf = (name: string) => name[0]?.toLocaleUpperCase("id") ?? "#";

function AlumniSearchBar({
  searchId,
  searchRef,
  searchSectionRef,
  query,
  isSticky,
  hintText,
  reducedMotion,
  onQueryChange,
}: {
  searchId: string;
  searchRef: RefObject<HTMLInputElement | null>;
  searchSectionRef: RefObject<HTMLElement | null>;
  query: string;
  isSticky: boolean;
  hintText: string;
  reducedMotion: boolean | null;
  onQueryChange: (value: string) => void;
}) {
  const { text } = useLocale("alumni");
  return (
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
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={text("Cari nama, instansi, atau posisi")}
          className="h-12 w-full rounded-full bg-bg-weak-50/60 backdrop-blur-xl pl-12 pr-4 min-[651px]:pr-12 text-paragraph-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 outline-none transition-colors duration-120 placeholder:text-text-sub-600 focus:bg-bg-weak-50/75 focus:ring-primary-base"
        />
        <AlignKbd.Root
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
        >
          {hintText}
        </AlignKbd.Root>
      </m.div>
    </section>
  );
}

function AlumniResultsContent({
  batch,
  status,
  filtered,
  listRef,
  onReload,
}: {
  batch: string;
  status: "loading" | "unavailable" | "ready";
  filtered: ReturnType<typeof filterAlumni>;
  listRef: RefObject<HTMLUListElement | null>;
  onReload: () => void;
}) {
  const { text } = useLocale("alumni");
  return (
    <Tabs.Content value={batch}>
      <p aria-live="polite" className="mt-6 text-paragraph-sm text-text-sub-600">
        {status === "ready" && text("Menampilkan {{v0}} alumni", { v0: String(filtered.length) })}
      </p>
      {status === "loading" && (
        <div className="mt-6 flex min-h-64">
          <Loading />
        </div>
      )}
      {status === "unavailable" && (
        <div
          role="alert"
          className="mt-6 flex flex-col items-start gap-3 rounded-10 bg-bg-weak-50 p-6"
        >
          <Typography variant="label" className="m-0">
            {text("Daftar alumni gagal dimuat.")}
          </Typography>
          <AlignButton.Root size="small" onClick={onReload}>
            {text("Coba lagi")}
          </AlignButton.Root>
        </div>
      )}
      {status === "ready" && filtered.length === 0 && (
        <div className="mt-6 rounded-10 border border-stroke-soft-200 p-10 text-center">
          <Typography variant="label" className="m-0">
            {text("Tidak ada alumni yang cocok.")}
          </Typography>
          <Typography variant="paragraph" color="muted" className="mb-0 mt-2">
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
  );
}

function AlumniBatchTabs({ batches }: { batches: number[] }) {
  const { text } = useLocale("alumni");
  return (
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
  );
}

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
  useKeyboardShortcuts({
    "/": { run: () => searchRef.current?.focus(), description: "Cari alumni" },
  });
  const searchHint = useShortcutHint("/");

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
  const letters = useMemo(
    () => [...new Set(filtered.map((item) => letterOf(item.name)))],
    [filtered],
  );
  const letterLabel = useCallback(
    (letter: string) => text("Ke huruf {{v0}}", { v0: letter }),
    [text],
  );

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
          <AlumniSearchBar
            searchId={searchId}
            searchRef={searchRef}
            searchSectionRef={searchSectionRef}
            query={query}
            isSticky={isSticky}
            hintText={searchHint.text}
            reducedMotion={reducedMotion}
            onQueryChange={setQuery}
          />
          {directory.status === "ready" && <AlumniBatchTabs batches={batches} />}
          <AlumniResultsContent
            batch={batch}
            status={directory.status}
            filtered={filtered}
            listRef={listRef}
            onReload={directory.reload}
          />
        </Tabs.Root>
      </div>
      {letters.length > 1 && (
        <AlphabetScrubber
          letters={letters}
          listRef={listRef}
          label={text("Navigasi alfabet")}
          letterLabel={letterLabel}
        />
      )}
    </main>
  );
}
