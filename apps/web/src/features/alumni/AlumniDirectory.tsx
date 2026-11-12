import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { RiArrowLeftLine, RiSearchLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import { useLocale } from "../../useLocale";
import { AlignButton } from "../../ui/button";
import { Loading } from "../../ui/loading";
import { AlignSelect } from "../../ui/select";
import { Typography } from "../../ui/typography";
import { AlumniDirectoryCard } from "./AlumniDirectoryCard";
import { filterAlumni, type AlumniDirectoryData } from "./directory";
import { useAlumniDirectory } from "./useAlumniDirectory";

const allBatches = "semua";
const letterOf = (name: string) => name[0]?.toLocaleUpperCase("id") ?? "#";

export function AlumniDirectory({ initialData }: { initialData: AlumniDirectoryData | null }) {
  const { text } = useLocale("alumni");
  const directory = useAlumniDirectory(initialData);
  const [batch, setBatch] = useState(allBatches);
  const [query, setQuery] = useState("");
  const searchId = useId();
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

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <Link
            to="/alumni"
            className="inline-flex items-center gap-1.5 rounded text-label-sm text-text-sub-600 transition hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
          >
            <RiArrowLeftLine aria-hidden="true" className="size-4" />
            {text("Kembali ke alumni")}
          </Link>
          <Typography as="h1" variant="title" className="mb-0 mt-4 text-title-h3 sm:text-title-h2">
            {text("Semua alumni")}
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-4 text-text-sub-600">
            {text(
              "Cari alumni Ilmu Komputer UGM berdasarkan nama, kampus angkatan, atau tempat berkarya.",
            )}
          </Typography>
        </header>

        <section
          aria-label={text("Filter alumni")}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <label htmlFor={searchId} className="sr-only">
              {text("Cari alumni")}
            </label>
            <RiSearchLine
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-sub-600"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text("Cari nama, instansi, atau posisi")}
              className="h-10 w-full rounded-10 bg-bg-white-0 pl-10 pr-3 text-paragraph-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 outline-none transition placeholder:text-text-sub-600 focus:ring-stroke-strong-950"
            />
          </div>
          <AlignSelect.Root value={batch} onValueChange={setBatch} variant="compact">
            <AlignSelect.Trigger className="sm:w-56" aria-label={text("Angkatan")}>
              <AlignSelect.Value />
            </AlignSelect.Trigger>
            <AlignSelect.Content align="end" className="w-[var(--radix-select-trigger-width)]">
              <AlignSelect.Item value={allBatches}>{text("Semua angkatan")}</AlignSelect.Item>
              {batches.map((year) => (
                <AlignSelect.Item key={year} value={String(year)}>
                  {text("Angkatan {{v0}}", { v0: String(year) })}
                </AlignSelect.Item>
              ))}
            </AlignSelect.Content>
          </AlignSelect.Root>
        </section>

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
                className="min-w-0 scroll-mt-24"
              >
                <AlumniDirectoryCard alumnus={alumnus} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {letters.length > 1 && (
        <nav
          aria-label={text("Navigasi alfabet")}
          className="fixed right-1 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end py-2 sm:right-3"
          onPointerLeave={() => setHovered("")}
        >
          {letters.map((letter, index) => (
            <button
              key={letter}
              type="button"
              aria-label={text("Ke huruf {{v0}}", { v0: letter })}
              onPointerEnter={(event) => {
                setHovered(letter);
                if (event.buttons === 1) jump(letter);
              }}
              onFocus={() => setHovered(letter)}
              onBlur={() => setHovered("")}
              onClick={() => jump(letter)}
              className="group relative flex h-3 w-9 items-center justify-end pr-1 focus-visible:outline-2 focus-visible:outline-primary-base"
            >
              {(hovered === letter || (!hovered && current === letter)) && (
                <span className="absolute right-9 rounded-6 bg-bg-strong-950 px-2 py-1 text-label-sm text-white">
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
