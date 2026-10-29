import { useLocale } from "../../useLocale";
import { AlignTooltip } from "../../ui/tooltip";
import { toast, SuccessToast } from "../../ui/toast";
import { Fragment, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiArrowUpLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFolder3Line,
  RiArrowRightSLine,
  RiSearchLine,
  RiDriveLine,
} from "@remixicon/react";
import { AlignBreadcrumb } from "../../ui/breadcrumb";
import { AlignBadge } from "../../ui/badge";
import { AlignButton, buttonVariants } from "../../ui/button";
import { AlignModal } from "../../ui/modal";
import { Typography } from "../../ui/typography";
import { browseArchive, paperLinks, resolveArchive } from "./archive";
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
  const [shared, setShared] = useState<{
    selection: string;
    url: string;
    status: "copied" | "manual";
  } | null>(null);
  const selection = JSON.stringify([...location, paper?.id]);
  const share = shared?.selection === selection ? shared : null;
  const list = useRef<HTMLDivElement>(null);
  const modalTitle = useRef<HTMLHeadingElement>(null);
  const folder = browseArchive({
    location,
    query,
    displayName: (course) => text(course.name),
    locale: language,
  });
  const parent = folder.breadcrumbs.at(-2);
  const links = paper ? paperLinks(paper) : null;
  const openFolder = (next: ArchiveLocation) => {
    void navigate({ search: folderSearch(next), resetScroll: false });
  };
  async function copyLink() {
    if (!paper) return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.custom(() => <SuccessToast message={text("Tautan arsip ujian disalin")} />);
      setShared({ selection, url, status: "copied" });
    } catch {
      setShared({ selection, url, status: "manual" });
    }
  }

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
            className="grid shrink-0 grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-2 border-b border-stroke-soft-200 px-3 py-2 text-paragraph-xs text-text-sub-600 sm:grid-cols-[minmax(0,1fr)_140px_76px_84px] sm:gap-4"
            aria-hidden="true"
          >
            <span className="flex items-center gap-1">
              {text("Nama")} <RiArrowUpLine className="size-3.5" aria-hidden="true" />
            </span>
            <span className="hidden text-center sm:block">{text("Dibuat")}</span>
            <span className="text-center">{text("Ujian")}</span>
            <span className="text-center">{text("Jenis")}</span>
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
                    setShared(null);
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
                <span className="flex justify-center text-paragraph-xs text-text-sub-600">
                  {entry.kind === "paper" && entry.paper.exam ? (
                    <ExamBadge exam={entry.paper.exam} />
                  ) : (
                    "—"
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
              <p
                role="status"
                className="px-3 py-16 text-center text-paragraph-sm text-text-sub-600"
              >
                {location.length === 0 && query.trim()
                  ? text("Tidak ada mata kuliah yang cocok.")
                  : text("Folder kosong")}
              </p>
            )}
          </div>
        </div>
      </section>
      <AlignModal.Root
        open={paper !== null}
        onOpenChange={(open) => {
          if (!open) openFolder(location);
        }}
      >
        <AlignModal.Content
          className="flex h-[90dvh] max-w-5xl flex-col overflow-hidden"
          showClose={false}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            modalTitle.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            list.current?.focus();
          }}
        >
          <div className="flex min-w-0 items-center justify-between gap-4 p-4">
            <AlignModal.Title asChild>
              <Typography
                ref={modalTitle}
                as="h2"
                tabIndex={-1}
                variant="label"
                className="min-w-0 flex-1 truncate outline-none"
                title={paper?.name}
              >
                {paper?.name}
              </Typography>
            </AlignModal.Title>
            {links && (
              <div
                className="flex shrink-0 items-center gap-1"
                role="group"
                aria-label={text("Aksi berkas")}
              >
                <a
                  href={links.download}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={text("Unduh")}
                  title={text("Unduh")}
                  className={buttonVariants({
                    variant: "neutral",
                    mode: "ghost",
                    size: "xsmall",
                    className: "size-8 p-0",
                  })}
                >
                  <RiDownloadLine className="size-4" aria-hidden="true" />
                </a>
                <AlignTooltip.Provider>
                  <AlignTooltip.Root>
                    <AlignTooltip.Trigger asChild>
                      <AlignButton.Root
                        variant="neutral"
                        mode="ghost"
                        size="xsmall"
                        className="size-8 p-0"
                        aria-label={
                          share?.status === "copied"
                            ? text("Tautan berhasil disalin")
                            : text("Salin tautan")
                        }
                        onClick={() => {
                          void copyLink();
                        }}
                      >
                        {share?.status === "copied" ? (
                          <RiCheckLine
                            key="copied"
                            className="size-4 animate-in fade-in-0 zoom-in-75 text-success-base duration-200"
                            aria-hidden="true"
                          />
                        ) : (
                          <RiFileCopyLine key="copy" className="size-4" aria-hidden="true" />
                        )}
                      </AlignButton.Root>
                    </AlignTooltip.Trigger>
                    <AlignTooltip.Content size="xsmall" side="bottom">
                      {share?.status === "copied" ? text("Tautan disalin") : text("Salin tautan")}
                    </AlignTooltip.Content>
                  </AlignTooltip.Root>
                </AlignTooltip.Provider>
                <a
                  href={links.drive}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={text("Buka di Drive")}
                  title={text("Buka di Drive")}
                  className={buttonVariants({
                    variant: "neutral",
                    mode: "ghost",
                    size: "xsmall",
                    className: "size-8 p-0",
                  })}
                >
                  <RiDriveLine className="size-4" aria-hidden="true" />
                </a>
                <AlignModal.Close asChild>
                  <AlignButton.Root
                    variant="neutral"
                    mode="ghost"
                    size="xsmall"
                    className="size-8 p-0"
                    aria-label={text("Tutup dialog")}
                    title={text("Tutup")}
                  >
                    <RiCloseLine className="size-4" aria-hidden="true" />
                  </AlignButton.Root>
                </AlignModal.Close>
              </div>
            )}
            <span className="sr-only" role="status" aria-live="polite">
              {share?.status === "copied" ? text("Tautan berhasil disalin") : ""}
            </span>
          </div>
          {share?.status === "manual" && (
            <div className="border-y border-stroke-soft-200 px-4 py-2">
              <Typography variant="caption" role="status">
                {text("Gagal menyalin otomatis. Salin tautan berikut.")}
              </Typography>
              <input
                aria-label={text("Tautan berkas")}
                readOnly
                value={share.url}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-2 w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm"
              />
            </div>
          )}
          {paper && links && (
            <iframe
              title={paper.name}
              src={links.preview}
              className="min-h-0 w-full flex-1 border-0"
              allow="fullscreen"
            />
          )}
        </AlignModal.Content>
      </AlignModal.Root>
    </main>
  );
}
