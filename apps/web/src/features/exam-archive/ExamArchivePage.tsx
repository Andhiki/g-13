import { PaperPreview } from "./PaperPreview";
import { useLocale } from "../../useLocale";
import { Fragment, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiArrowUpLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFolder3Line,
  RiArrowRightSLine,
  RiSearchLine,
} from "@remixicon/react";
import { AlignBreadcrumb } from "../../ui/breadcrumb";
import { AlignBadge } from "../../ui/badge";
import { Typography } from "../../ui/typography";
import { browseArchive, resolveArchive } from "./archive";
import { folderSearch } from "./search";
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
  const list = useRef<HTMLDivElement>(null);
  const folder = browseArchive({
    location,
    query,
    displayName: (course) => text(course.name),
    locale: language,
  });
  const parent = folder.breadcrumbs.at(-2);
  const openFolder = (next: ArchiveLocation) => {
    void navigate({ search: folderSearch(next), resetScroll: false });
  };

  return (
    <main className="mx-auto flex h-[calc(100dvh-var(--app-header-height))] max-w-5xl flex-col gap-6 px-0 py-5 text-text-strong-950 sm:px-8 sm:py-8">
      <header className="shrink-0 space-y-2 px-4 sm:px-0">
        <Typography as="h1" variant="title">
          {text("Arsip Ujian")}
        </Typography>
        <Typography as="p" variant="paragraph" className="text-text-sub-600">
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
      </header>
      <section className="flex min-h-0 flex-1 flex-col" aria-label={text("Penjelajah arsip ujian")}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-stroke-soft-200 sm:rounded-xl sm:border">
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
            <label className="ml-auto flex h-9 w-full items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 text-text-sub-600 sm:w-72">
              <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                className="w-full min-w-0 bg-transparent text-paragraph-sm text-text-strong-950 outline-none placeholder:text-text-soft-400"
                aria-label={text("Cari mata kuliah")}
                placeholder={text("Mata kuliah")}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (location.length > 0) openFolder([]);
                }}
              />
            </label>
          </div>
          <div
            className="grid shrink-0 grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-2 border-b border-stroke-soft-200 px-3 py-2 text-text-sub-600 sm:grid-cols-[minmax(0,1fr)_140px_76px_84px] sm:gap-4"
            aria-hidden="true"
          >
            <Typography as="span" variant="caption" className="flex items-center gap-1">
              {text("Nama")} <RiArrowUpLine className="size-3.5" aria-hidden="true" />
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
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-base"
          >
            {parent && (
              <Link
                to="/exam"
                search={folderSearch(parent.location)}
                resetScroll={false}
                aria-label={text("Naik satu folder")}
                className="flex w-full items-center gap-3 border-b border-stroke-soft-200 px-3 py-3 text-paragraph-sm text-text-strong-950 transition-colors duration-200 hover:bg-bg-weak-50 focus-visible:bg-bg-weak-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-base"
              >
                <RiFolder3Line className="size-5 shrink-0 text-text-sub-600" aria-hidden="true" />
                <Typography as="span">..</Typography>
              </Link>
            )}
            {folder.entries.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className="grid w-full grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-x-2 rounded-none border-b border-stroke-soft-200 bg-transparent px-3 py-3 text-left text-paragraph-sm text-text-strong-950 transition-colors duration-200 hover:bg-bg-weak-50 focus-visible:bg-bg-weak-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-base sm:grid-cols-[minmax(0,1fr)_140px_76px_84px] sm:gap-x-4"
                onClick={() => {
                  if (entry.kind === "folder") openFolder(entry.location);
                  else {
                    void navigate({
                      search: { ...folderSearch(location), file: entry.paper.id },
                      resetScroll: false,
                    });
                  }
                }}
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
              </button>
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
