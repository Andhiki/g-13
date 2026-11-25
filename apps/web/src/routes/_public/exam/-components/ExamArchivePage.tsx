import { PaperPreview } from "./PaperPreview";
import { useLocale } from "@/useLocale";
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiFilePdf2Line,
  RiFileTextLine,
  RiFolder3Line,
  RiArrowRightSLine,
  RiSearchLine,
} from "@remixicon/react";
import { AlignBreadcrumb } from "@/ui/breadcrumb";
import { AlignBadge } from "@/ui/badge";
import { AlignKbd } from "@/ui/kbd";
import { useKeyboardShortcuts, useShortcutHint } from "@/ui/shortcuts";
import { Typography } from "@/ui/typography";
import { browseArchive, prepareCourseSearch, resolveArchive } from "../-shared/archive";
import { folderSearch } from "../-shared/search";
import { examArchive } from "../-shared/catalog";
import { archiveUpdatedAt } from "../-shared/metadata";
import { Route } from "@/routes/_public/exam";
import type { ArchiveLocation } from "../-shared/contracts";

function ExamBadge({ exam }: { exam: "UTS" | "UAS" }) {
  const { text } = useLocale("exam");
  return (
    <AlignBadge.Root variant={exam === "UTS" ? "information" : "warning"} size="small">
      {text(exam)}
    </AlignBadge.Root>
  );
}

const formatCreatedAt = (value: string | null, relativeTimeFormatter: Intl.RelativeTimeFormat) => {
  if (!value) return "—";
  const days = Math.round((Date.parse(value) - Date.now()) / 86_400_000);
  if (Math.abs(days) >= 365) return relativeTimeFormatter.format(Math.round(days / 365), "year");
  if (Math.abs(days) >= 30) return relativeTimeFormatter.format(Math.round(days / 30), "month");
  return relativeTimeFormatter.format(days, "day");
};

function ExamKeyboardTips({ searchText }: { searchText: string }) {
  const { text } = useLocale("exam");
  const jHint = useShortcutHint("j");
  const downHint = useShortcutHint("arrowdown");
  const kHint = useShortcutHint("k");
  const upHint = useShortcutHint("arrowup");
  const enterHint = useShortcutHint("enter");
  const rightHint = useShortcutHint("arrowright");
  const minusHint = useShortcutHint("-");
  const leftHint = useShortcutHint("arrowleft");
  const pairs = [
    { keys: [searchText], label: text("Cari mata kuliah"), prefix: " — " },
    { keys: [jHint.text, downHint.text], label: text("Ke bawah"), prefix: " — " },
    { keys: [kHint.text, upHint.text], label: text("Ke atas"), prefix: " — " },
    {
      keys: [enterHint.text, rightHint.text],
      label: text("Buka folder atau berkas"),
      prefix: "— ",
    },
    { keys: [minusHint.text, leftHint.text], label: text("Naik satu folder"), prefix: " — " },
  ];
  return (
    <div className="mt-8 hidden text-text-sub-600 min-[650px]:block">
      <Typography className="mb-2">{text("Tip:")}</Typography>
      <ul className="m-0 list-none space-y-1 p-0">
        {pairs.map((tip) => (
          <li key={tip.label}>
            <span className="flex items-center gap-1.5">
              <AlignKbd.Root>{tip.keys[0]}</AlignKbd.Root>
              {tip.keys[1] && (
                <>
                  {" / "}
                  <AlignKbd.Root>{tip.keys[1]}</AlignKbd.Root>
                </>
              )}
              <Typography as="span">
                {tip.prefix}
                {tip.label}
              </Typography>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamBreadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs: ReturnType<typeof browseArchive>["breadcrumbs"];
}) {
  const { text } = useLocale("exam");
  return (
    <AlignBreadcrumb.Root asChild>
      <nav aria-label={text("Lokasi folder")} className="min-w-0">
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.name}>
            {index > 0 && (
              <AlignBreadcrumb.ArrowIcon asChild>
                <RiArrowRightSLine aria-hidden="true" />
              </AlignBreadcrumb.ArrowIcon>
            )}
            <AlignBreadcrumb.Item
              asChild
              active={index === breadcrumbs.length - 1}
              className="min-w-0 max-w-full break-words"
            >
              <Link
                aria-label={index === 0 ? text("Arsip ujian — direktori home") : undefined}
                to="/exam"
                search={folderSearch(crumb.location)}
                resetScroll={false}
                aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
              >
                {index === 0 ? "~" : text(crumb.name)}
              </Link>
            </AlignBreadcrumb.Item>
          </Fragment>
        ))}
      </nav>
    </AlignBreadcrumb.Root>
  );
}

function ExamFolderSearch({
  searchInput,
  query,
  hintText,
  onChange,
  onFocusList,
}: {
  searchInput: React.RefObject<HTMLInputElement | null>;
  query: string;
  hintText: string;
  onChange: (value: string) => void;
  onFocusList: () => void;
}) {
  const { text } = useLocale("exam");
  return (
    <label className="ml-auto flex h-9 w-full items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 text-text-sub-600 sm:w-72">
      <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
      <input
        ref={searchInput}
        type="search"
        className="w-full min-w-0 bg-transparent text-paragraph-sm text-text-strong-950 outline-none placeholder:text-text-soft-400"
        aria-label={text("Cari mata kuliah")}
        placeholder={text("Mata kuliah")}
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.blur();
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            onFocusList();
          }
        }}
      />
      <AlignKbd.Root aria-hidden="true">{hintText}</AlignKbd.Root>
    </label>
  );
}

function ExamEntryIcon({ entry }: { entry: ReturnType<typeof browseArchive>["entries"][number] }) {
  if (entry.kind === "folder") {
    return <RiFolder3Line className="size-5 shrink-0 text-text-sub-600" aria-hidden="true" />;
  }
  if (entry.paper.mimeType === "application/pdf") {
    return <RiFilePdf2Line className="size-5 shrink-0 text-text-sub-600" aria-hidden="true" />;
  }
  return <RiFileTextLine className="size-5 shrink-0 text-text-sub-600" aria-hidden="true" />;
}

function ExamEntryRow({
  entry,
  location,
  relativeTimeFormatter,
}: {
  entry: ReturnType<typeof browseArchive>["entries"][number];
  location: ArchiveLocation;
  relativeTimeFormatter: Intl.RelativeTimeFormat;
}) {
  const { text } = useLocale("exam");
  const createdLabel = formatCreatedAt(entry.createdAt, relativeTimeFormatter);
  return (
    <Link
      data-folder={entry.kind === "folder"}
      data-location={entry.kind === "folder" ? JSON.stringify(entry.location) : undefined}
      to="/exam"
      search={
        entry.kind === "folder"
          ? folderSearch(entry.location)
          : { ...folderSearch(location), file: entry.paper.id }
      }
      resetScroll={false}
      className="grid w-full grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-x-2 rounded-none border-b border-stroke-soft-200 bg-transparent px-3 py-3 text-left text-paragraph-sm text-text-strong-950 transition-colors duration-200 hover:bg-bg-weak-50 focus-visible:bg-bg-weak-50 focus-visible:outline-none focus-visible:shadow-[inset_2px_0_0_var(--color-primary-base)] sm:grid-cols-[minmax(0,1fr)_140px_76px_84px] sm:gap-x-4"
    >
      <span className="flex min-w-0 items-center gap-3">
        <ExamEntryIcon entry={entry} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Typography as="span" className="min-w-0 break-words">
            {entry.kind === "folder" ? text(entry.name) : entry.name}
          </Typography>
          <Typography as="span" variant="caption" color="soft" className="sm:hidden">
            {text("Dibuat")} {createdLabel}
          </Typography>
        </span>
      </span>
      <Typography as="span" variant="caption" color="muted" className="hidden text-center sm:block">
        {createdLabel}
      </Typography>
      <span className="flex justify-center text-text-sub-600">
        {entry.kind === "paper" && entry.paper.exam ? (
          <ExamBadge exam={entry.paper.exam} />
        ) : (
          <Typography as="span" variant="caption">
            —
          </Typography>
        )}
      </span>
      <AlignBadge.Root
        variant="light"
        size="small"
        className="w-fit justify-self-center rounded-md"
      >
        {entry.kind === "folder" ? text("Folder") : text("Berkas")}
      </AlignBadge.Root>
    </Link>
  );
}

function handleArchiveListKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
  parentLocation: ArchiveLocation | undefined,
  focusNextFolder: React.MutableRefObject<boolean>,
  openFolder: (next: ArchiveLocation) => void,
) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (["ArrowLeft", "-", "Backspace", "h"].includes(event.key)) {
    event.preventDefault();
    if (parentLocation) {
      focusNextFolder.current = true;
      openFolder(parentLocation);
    }
    return;
  }
  if (
    (event.key === "ArrowRight" || event.key === "l") &&
    event.target instanceof HTMLAnchorElement
  ) {
    event.preventDefault();
    focusNextFolder.current = event.target.dataset.folder === "true";
    event.target.click();
    return;
  }
  if (event.key === "Enter" && event.target instanceof HTMLAnchorElement) {
    focusNextFolder.current = event.target.dataset.folder === "true";
  }
  if (!["ArrowDown", "ArrowUp", "j", "k"].includes(event.key)) return;
  const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a"));
  if (!links.length) return;
  event.preventDefault();
  const index = links.findIndex((link) => link === document.activeElement);
  const delta = event.key === "ArrowDown" || event.key === "j" ? 1 : -1;
  const next = index === -1 ? 0 : Math.max(0, Math.min(links.length - 1, index + delta));
  links[next]?.focus();
}

function ExamArchiveList({
  folder,
  location,
  query,
  list,
  focusNextFolder,
  relativeTimeFormatter,
  onOpenFolder,
}: {
  folder: ReturnType<typeof browseArchive>;
  location: ArchiveLocation;
  query: string;
  list: React.RefObject<HTMLDivElement | null>;
  focusNextFolder: React.MutableRefObject<boolean>;
  relativeTimeFormatter: Intl.RelativeTimeFormat;
  onOpenFolder: (next: ArchiveLocation) => void;
}) {
  const { text } = useLocale("exam");
  const parent = folder.breadcrumbs.at(-2);
  return (
    <div
      ref={list}
      tabIndex={-1}
      aria-label={text("Isi folder")}
      onKeyDown={(event) =>
        handleArchiveListKeyDown(event, parent?.location, focusNextFolder, onOpenFolder)
      }
      className="min-h-0 flex-1 p-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-base lg:overflow-y-auto lg:overscroll-contain"
    >
      {parent && (
        <Link
          data-folder="true"
          to="/exam"
          search={folderSearch(parent.location)}
          resetScroll={false}
          aria-label={text("Naik satu folder")}
          className="flex w-full items-center gap-3 border-b border-stroke-soft-200 px-3 py-3 text-paragraph-sm text-text-strong-950 transition-colors duration-200 hover:bg-bg-weak-50 focus-visible:bg-bg-weak-50 focus-visible:outline-none focus-visible:shadow-[inset_2px_0_0_var(--color-primary-base)]"
        >
          <RiFolder3Line className="size-5 shrink-0 text-text-sub-600" aria-hidden="true" />
          <Typography as="span">..</Typography>
        </Link>
      )}
      {folder.entries.map((entry) => (
        <ExamEntryRow
          key={entry.id}
          entry={entry}
          location={location}
          relativeTimeFormatter={relativeTimeFormatter}
        />
      ))}
      {folder.entries.length === 0 && (
        <div className="px-3 py-16 text-center">
          <Typography color="muted" role="status">
            {location.length === 0 && query.trim()
              ? text("Tidak ada mata kuliah yang cocok.")
              : text("Folder kosong")}
          </Typography>
        </div>
      )}
    </div>
  );
}

function ExamArchiveExplorer({
  folder,
  location,
  query,
  searchHintText,
  searchInput,
  list,
  focusNextFolder,
  relativeTimeFormatter,
  onQueryChange,
  onOpenFolder,
}: {
  folder: ReturnType<typeof browseArchive>;
  location: ArchiveLocation;
  query: string;
  searchHintText: string;
  searchInput: React.RefObject<HTMLInputElement | null>;
  list: React.RefObject<HTMLDivElement | null>;
  focusNextFolder: React.MutableRefObject<boolean>;
  relativeTimeFormatter: Intl.RelativeTimeFormat;
  onQueryChange: (value: string) => void;
  onOpenFolder: (next: ArchiveLocation) => void;
}) {
  const { text } = useLocale("exam");
  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label={text("Penjelajah arsip ujian")}>
      <div className="flex min-h-0 flex-1 flex-col border-t border-stroke-soft-200 lg:overflow-hidden lg:border-l lg:border-t-0">
        <div className="sticky top-[var(--app-header-height)] z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 bg-bg-white-0 px-3 py-2 lg:static">
          <ExamBreadcrumbs breadcrumbs={folder.breadcrumbs} />
          {location.length === 0 && (
            <ExamFolderSearch
              searchInput={searchInput}
              query={query}
              hintText={searchHintText}
              onChange={onQueryChange}
              onFocusList={() => list.current?.querySelector<HTMLAnchorElement>("a")?.focus()}
            />
          )}
        </div>
        <div
          className="grid shrink-0 grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-2 border-b border-stroke-soft-200 px-3 py-2 text-text-sub-600 sm:grid-cols-[minmax(0,1fr)_140px_76px_84px] sm:gap-4"
          aria-hidden="true"
        >
          <Typography as="span" variant="caption" className="flex items-center">
            {text("Nama")}
          </Typography>
          <Typography as="span" variant="caption" className="hidden text-center sm:block">
            {text("Dibuat")}
          </Typography>
          <Typography as="span" variant="caption" className="text-center">
            {text("Ujian")}
          </Typography>
          <Typography as="span" variant="caption" className="text-center">
            {text("Jenis")}
          </Typography>
        </div>
        <ExamArchiveList
          folder={folder}
          location={location}
          query={query}
          list={list}
          focusNextFolder={focusNextFolder}
          relativeTimeFormatter={relativeTimeFormatter}
          onOpenFolder={onOpenFolder}
        />
      </div>
    </section>
  );
}

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
    <main className="flex min-h-[calc(100dvh-var(--app-header-height))] flex-col bg-bg-white-0 text-text-strong-950 lg:grid lg:h-[calc(100dvh-var(--app-header-height))] lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)]">
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
