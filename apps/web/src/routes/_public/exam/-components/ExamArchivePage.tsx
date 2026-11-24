import { PaperPreview } from "./PaperPreview";
import { useLocale } from "@/useLocale";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useKeyboardShortcuts, useShortcutHint } from "@/ui/shortcuts";
import { Typography } from "@/ui/typography";
import { browseArchive, prepareCourseSearch, resolveArchive } from "../-shared/archive";
import { folderSearch } from "../-shared/search";
import { examArchive } from "../-shared/catalog";
import { archiveUpdatedAt } from "../-shared/metadata";
import { Route } from "@/routes/_public/exam";
import type { ArchiveLocation } from "../-shared/contracts";
import { ExamKeyboardTips, ExamArchiveExplorer } from "./ExamArchiveExplorer";

export function ExamArchivePage() {
  const { text, language } = useLocale("exam");
  const archiveUpdatedLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(archiveUpdatedAt)),
    [language],
  );
  const relativeTimeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat(language, { numeric: "auto" }),
    [language],
  );
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { location, paper } = resolveArchive(search);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const focusSearch = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const focusNextFolder = useRef(false);
  const previousLocation = useRef(location);
  const locationKey = JSON.stringify(location);
  const lastGAt = useRef<number | null>(null);
  const goFirstLink = (event: KeyboardEvent) => {
    lastGAt.current = null;
    if (event.target instanceof Node && list.current?.contains(event.target)) return;
    list.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  };
  const goListTop = () => {
    if (lastGAt.current !== null && performance.now() - lastGAt.current < 1000) {
      lastGAt.current = null;
      list.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    } else {
      lastGAt.current = performance.now();
    }
  };
  const goListEnd = () => {
    lastGAt.current = null;
    Array.from(list.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])
      .at(-1)
      ?.focus();
  };
  const focusCourseSearch = () => {
    lastGAt.current = null;
    if (searchInput.current) searchInput.current.focus();
    else {
      focusSearch.current = true;
      void navigate({ search: folderSearch([]), resetScroll: false });
    }
  };
  // The registry replaces the old window listener: the preview modal pauses
  // page shortcuts while it is open, and ordinary typing stays typing. The
  // list's own keydown handler keeps moving inside the list and wins by
  // preventing the event before the registry sees it.
  useKeyboardShortcuts({
    j: { run: goFirstLink, description: "Ke bawah" },
    k: { run: goFirstLink, description: "Ke atas" },
    arrowdown: { run: goFirstLink, description: "Ke bawah" },
    arrowup: { run: goFirstLink, description: "Ke atas" },
    g: goListTop,
    "shift+g": goListEnd,
    "/": {
      run: focusCourseSearch,
      description: "Cari mata kuliah",
      when: () => window.matchMedia("(min-width: 640px)").matches,
    },
    "shift+/": {
      run: focusCourseSearch,
      when: () => window.matchMedia("(min-width: 640px)").matches,
    },
  });
  const searchHint = useShortcutHint("/");
  useLayoutEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = location;
    if (focusSearch.current) {
      focusSearch.current = false;
      searchInput.current?.focus();
    } else if (
      location.length < previous.length &&
      location.every((segment, index) => segment === previous[index])
    ) {
      focusNextFolder.current = false;
      const childLocationKey = JSON.stringify(previous.slice(0, location.length + 1));
      const links = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
      const child = links.find((link) => link.dataset.location === childLocationKey);
      (child ?? links[0] ?? list.current)?.focus();
    } else if (focusNextFolder.current) {
      focusNextFolder.current = false;
      (list.current?.querySelector<HTMLAnchorElement>("a") ?? list.current)?.focus();
    }
  }, [locationKey]);
  const searchIndex = useMemo(
    () => prepareCourseSearch(examArchive, (course) => text(course.name), language),
    [text, language],
  );
  const folder = browseArchive({
    location,
    query,
    searchIndex,
    displayName: (course) => text(course.name),
    locale: language,
  });
  const openFolder = (next: ArchiveLocation) => {
    void navigate({ search: folderSearch(next), resetScroll: false });
  };

  return (
    <main className="flex h-[calc(100dvh-var(--app-header-height))] flex-col bg-bg-white-0 text-text-strong-950 lg:grid lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)]">
      <header className="shrink-0 px-5 py-10 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <Typography as="h1" variant="pageTitle" className="m-0">
          {text("Arsip Ujian")}
        </Typography>
        <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-5 max-w-md">
          {text("Provided by")}{" "}
          <a
            href="https://himakom.ugm.ac.id"
            className="underline underline-offset-4 hover:text-text-strong-950"
          >
            Himakom UGM
          </a>
          {text(". Last updated at")}{" "}
          <time dateTime={archiveUpdatedAt}>
            {archiveUpdatedLabel} {text("WIB")}
          </time>
          .
        </Typography>
        <ExamKeyboardTips searchText={searchHint.text} />
      </header>
      <ExamArchiveExplorer
        folder={folder}
        location={location}
        query={query}
        searchHintText={searchHint.text}
        searchInput={searchInput}
        list={list}
        focusNextFolder={focusNextFolder}
        relativeTimeFormatter={relativeTimeFormatter}
        onQueryChange={setQuery}
        onOpenFolder={openFolder}
      />
      <PaperPreview
        paper={paper}
        location={location}
        list={list}
        onClose={() => openFolder(location)}
      />
    </main>
  );
}
