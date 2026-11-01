import { PaperPreview } from "./PaperPreview";
import { useLocale } from "../../useLocale";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiFilePdf2Line,
  RiFileTextLine,
  RiFolder3Line,
  RiArrowRightSLine,
  RiSearchLine,
} from "@remixicon/react";
import { AlignBreadcrumb } from "../../ui/breadcrumb";
import { AlignBadge } from "../../ui/badge";
import { AlignKbd } from "../../ui/kbd";
import { Typography } from "../../ui/typography";
import { browseArchive, prepareCourseSearch, resolveArchive } from "./archive";
import { folderSearch } from "./search";
import { examArchive } from "./catalog";
import { archiveUpdatedAt } from "./metadata";
import { Route } from "../../routes/exam";
import type { ArchiveLocation } from "./contracts";

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
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !["ArrowDown", "ArrowUp", "j", "k", "/"].includes(event.key) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        paper ||
        !(event.target instanceof HTMLElement) ||
        event.target.closest("input, textarea, select, [contenteditable], [role='dialog']")
      )
        return;
      if (event.key === "/") {
        if (!window.matchMedia("(min-width: 640px)").matches) return;
        event.preventDefault();
        if (searchInput.current) searchInput.current.focus();
        else {
          focusSearch.current = true;
          void navigate({ search: folderSearch([]), resetScroll: false });
        }
        return;
      }
      if (list.current?.contains(event.target)) return;
      const first = list.current?.querySelector<HTMLAnchorElement>("a");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paper, navigate]);
  const locationKey = JSON.stringify(location);
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
  const parent = folder.breadcrumbs.at(-2);
  const openFolder = (next: ArchiveLocation) => {
    void navigate({ search: folderSearch(next), resetScroll: false });
  };

  return (
    <main className="flex h-[calc(100dvh-var(--app-header-height))] flex-col bg-bg-white-0 text-text-strong-950 lg:grid lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)]">
      <header className="shrink-0 px-5 py-10 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
          {text("Arsip Ujian")}
        </Typography>
        <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
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
        <div className="mt-8 hidden text-text-sub-600 min-[650px]:block">
          <Typography className="mb-2">{text("Tip:")}</Typography>
          <ul className="m-0 list-none space-y-1 p-0">
            <li>
              <Typography as="span" className="flex items-center gap-1.5">
                <AlignKbd.Root>/</AlignKbd.Root> — {text("Cari mata kuliah")}
              </Typography>
            </li>
            <li>
              <Typography as="span" className="flex items-center gap-1.5">
                <AlignKbd.Root>j</AlignKbd.Root> / <AlignKbd.Root>↓</AlignKbd.Root> —{" "}
                {text("Ke bawah")}
              </Typography>
            </li>
            <li>
              <Typography as="span" className="flex items-center gap-1.5">
                <AlignKbd.Root>k</AlignKbd.Root> / <AlignKbd.Root>↑</AlignKbd.Root> —{" "}
                {text("Ke atas")}
              </Typography>
            </li>
            <li>
              <Typography as="span" className="flex items-center gap-1.5">
                <AlignKbd.Root>Enter</AlignKbd.Root> / <AlignKbd.Root>→</AlignKbd.Root> —{" "}
                {text("Buka folder atau berkas")}
              </Typography>
            </li>
            <li>
              <Typography as="span" className="flex items-center gap-1.5">
                <AlignKbd.Root>-</AlignKbd.Root> / <AlignKbd.Root>←</AlignKbd.Root> —{" "}
                {text("Naik satu folder")}
              </Typography>
            </li>
          </ul>
        </div>
      </header>
      <section className="flex min-h-0 flex-1 flex-col" aria-label={text("Penjelajah arsip ujian")}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-stroke-soft-200 lg:border-l lg:border-t-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-2">
            <AlignBreadcrumb.Root asChild>
              <nav aria-label={text("Lokasi folder")} className="min-w-0">
                {folder.breadcrumbs.map((crumb, index) => (
                  <Fragment key={crumb.name}>
                    {index > 0 && (
                      <AlignBreadcrumb.ArrowIcon asChild>
                        <RiArrowRightSLine aria-hidden="true" />
                      </AlignBreadcrumb.ArrowIcon>
                    )}
                    <AlignBreadcrumb.Item
                      asChild
                      active={index === folder.breadcrumbs.length - 1}
                      className="min-w-0 max-w-full break-words"
                    >
                      <Link
                        aria-label={index === 0 ? text("Arsip ujian — direktori home") : undefined}
                        to="/exam"
                        search={folderSearch(crumb.location)}
                        resetScroll={false}
                        aria-current={index === folder.breadcrumbs.length - 1 ? "page" : undefined}
                      >
                        {index === 0 ? "~" : text(crumb.name)}
                      </Link>
                    </AlignBreadcrumb.Item>
                  </Fragment>
                ))}
              </nav>
            </AlignBreadcrumb.Root>
            {location.length === 0 && (
              <label className="ml-auto flex h-9 w-full items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 text-text-sub-600 sm:w-72">
                <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
                <input
                  ref={searchInput}
                  type="search"
                  className="w-full min-w-0 bg-transparent text-paragraph-sm text-text-strong-950 outline-none placeholder:text-text-soft-400"
                  aria-label={text("Cari mata kuliah")}
                  placeholder={text("Mata kuliah")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      const first = list.current?.querySelector<HTMLAnchorElement>("a");
                      if (first) {
                        event.preventDefault();
                        first.focus();
                      }
                    }
                  }}
                />
                <AlignKbd.Root aria-hidden="true">/</AlignKbd.Root>
              </label>
            )}
          </div>
          <div
            className="grid shrink-0 grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-2 border-b border-stroke-soft-200 px-3 py-2 text-text-sub-600 sm:grid-cols-[minmax(0,1fr)_140px_76px_84px] sm:gap-4"
            aria-hidden="true"
          >
            <Typography as="span" variant="caption" className="flex items-center gap-1">
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
          <div
            ref={list}
            tabIndex={-1}
            aria-label={text("Isi folder")}
            onKeyDown={(event) => {
              if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
              if (event.key === "ArrowLeft" || event.key === "-") {
                if (parent) {
                  event.preventDefault();
                  focusNextFolder.current = true;
                  openFolder(parent.location);
                }
                return;
              }
              if (event.key === "ArrowRight" && event.target instanceof HTMLAnchorElement) {
                event.preventDefault();
                focusNextFolder.current = event.target.dataset.folder === "true";
                event.target.click();
                return;
              }
              if (event.key === "Enter" && event.target instanceof HTMLAnchorElement) {
                focusNextFolder.current = event.target.dataset.folder === "true";
              }
              if (!["ArrowDown", "ArrowUp", "j", "k"].includes(event.key)) return;
              const links = Array.from(
                event.currentTarget.querySelectorAll<HTMLAnchorElement>("a"),
              );
              if (!links.length) return;
              event.preventDefault();
              const index = links.findIndex((link) => link === document.activeElement);
              const next =
                index === -1
                  ? 0
                  : Math.max(
                      0,
                      Math.min(
                        links.length - 1,
                        index + (event.key === "ArrowDown" || event.key === "j" ? 1 : -1),
                      ),
                    );
              links[next]?.focus();
            }}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-base"
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
              <Link
                key={entry.id}
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
                  {entry.kind === "folder" ? (
                    <RiFolder3Line
                      className="size-5 shrink-0 text-text-sub-600"
                      aria-hidden="true"
                    />
                  ) : entry.paper.mimeType === "application/pdf" ? (
                    <RiFilePdf2Line
                      className="size-5 shrink-0 text-text-sub-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <RiFileTextLine
                      className="size-5 shrink-0 text-text-sub-600"
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Typography as="span" className="min-w-0 break-words">
                      {entry.kind === "folder" ? text(entry.name) : entry.name}
                    </Typography>
                    <Typography
                      as="span"
                      variant="caption"
                      className="text-text-soft-400 sm:hidden"
                    >
                      {text("Dibuat")} {formatCreatedAt(entry.createdAt, relativeTimeFormatter)}
                    </Typography>
                  </span>
                </span>
                <Typography
                  as="span"
                  variant="caption"
                  className="hidden text-center text-text-sub-600 sm:block"
                >
                  {formatCreatedAt(entry.createdAt, relativeTimeFormatter)}
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
            ))}
            {folder.entries.length === 0 && (
              <Typography role="status" className="px-3 py-16 text-center text-text-sub-600">
                {location.length === 0 && query.trim()
                  ? text("Tidak ada mata kuliah yang cocok.")
                  : text("Folder kosong")}
              </Typography>
            )}
          </div>
        </div>
      </section>
      <PaperPreview
        paper={paper}
        location={location}
        list={list}
        onClose={() => openFolder(location)}
      />
    </main>
  );
}
