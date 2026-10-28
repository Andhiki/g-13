import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { defaultCurriculumId } from "@g13/curriculum";
import {
  RiArrowLeftLine,
  RiArrowRightUpLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFolder3Line,
  RiArrowRightSLine,
} from "@remixicon/react";
import { AlignButton, buttonVariants } from "../../ui/button";
import { AlignCommandMenu } from "../../ui/command-menu";
import { AlignModal } from "../../ui/modal";
import { ThemeSwitch } from "../../ui/theme-switch";
import { Typography } from "../../ui/typography";
import { archiveSource, browseArchive, paperLinks, resolveArchive } from "./archive";
import { folderSearch } from "./search";
import { Route } from "../../routes/exam";
import type { ArchiveLocation } from "./contracts";

export function ExamArchivePage() {
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
  const folder = browseArchive({ location, query });
  const links = paper ? paperLinks(paper) : null;
  const openFolder = (next: ArchiveLocation) => {
    void navigate({ search: folderSearch(next), resetScroll: false });
  };
  async function copyLink() {
    if (!paper) return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShared({ selection, url, status: "copied" });
    } catch {
      setShared({ selection, url, status: "manual" });
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-5 text-text-strong-950 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <Link
          to="/"
          search={{ kurikulum: defaultCurriculumId }}
          className={buttonVariants({ variant: "neutral", mode: "ghost", size: "small" })}
        >
          <RiArrowLeftLine className="size-4" aria-hidden="true" />
          Peta kurikulum
        </Link>
        <ThemeSwitch />
      </header>
      <Typography as="h1" variant="title">
        Arsip Ujian
      </Typography>
      <section
        className="flex min-h-[60dvh] flex-col overflow-hidden rounded-xl border border-stroke-soft-200"
        aria-label="Penjelajah arsip ujian"
      >
        <nav
          aria-label="Lokasi folder"
          className="flex flex-wrap items-center gap-1 border-b border-stroke-soft-200 p-3"
        >
          {folder.breadcrumbs.map((crumb, index) => (
            <span key={crumb.name} className="flex min-w-0 max-w-full items-center gap-1">
              {index > 0 && (
                <RiArrowRightSLine
                  className="size-4 shrink-0 text-text-soft-400"
                  aria-hidden="true"
                />
              )}
              <AlignButton.Root
                variant="neutral"
                mode="ghost"
                size="small"
                className="h-auto min-h-9 min-w-0 whitespace-normal text-left"
                aria-current={index === folder.breadcrumbs.length - 1 ? "page" : undefined}
                onClick={() => openFolder(crumb.location)}
              >
                {crumb.name}
              </AlignButton.Root>
            </span>
          ))}
        </nav>
        <AlignCommandMenu.Root
          shouldFilter={false}
          tabIndex={location.length > 0 ? 0 : -1}
          label={location.length === 0 ? "Cari mata kuliah" : "Berkas dan folder"}
          className="flex min-h-0 flex-1 flex-col"
        >
          {location.length === 0 && (
            <div className="border-b border-stroke-soft-200 px-5 py-4">
              <AlignCommandMenu.Input
                aria-label="Cari mata kuliah"
                placeholder="Cari mata kuliah…"
                value={query}
                onValueChange={setQuery}
              />
            </div>
          )}
          <AlignCommandMenu.List
            ref={list}
            label="Isi folder"
            className="max-h-none p-2 focus-visible:outline-2 focus-visible:outline-primary-base"
          >
            {folder.entries.map((entry) => (
              <AlignCommandMenu.Item
                key={entry.id}
                value={entry.id}
                size="medium"
                onSelect={() => {
                  list.current?.focus();
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
                {entry.kind === "folder" ? (
                  <RiFolder3Line className="size-5 shrink-0 text-warning-base" aria-hidden="true" />
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
                <Typography as="span" className="min-w-0 flex-1 break-words">
                  {entry.name}
                </Typography>
                {entry.kind === "paper" && entry.paper.exam && (
                  <Typography as="span" variant="caption" className="shrink-0 text-text-sub-600">
                    {entry.paper.exam}
                  </Typography>
                )}
              </AlignCommandMenu.Item>
            ))}
            <AlignCommandMenu.Empty className="px-3 py-16 text-center text-paragraph-sm text-text-sub-600">
              {location.length === 0 && query.trim()
                ? "Tidak ada mata kuliah yang cocok."
                : "Folder kosong"}
            </AlignCommandMenu.Empty>
          </AlignCommandMenu.List>
        </AlignCommandMenu.Root>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="caption" className="text-text-sub-600">
          {folder.entries.length} item
        </Typography>
        <a
          href={archiveSource}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "neutral", mode: "ghost", size: "xsmall" })}
        >
          Sumber: Himakom UGM <RiArrowRightUpLine className="size-4" aria-hidden="true" />
        </a>
      </footer>
      <AlignModal.Root
        open={paper !== null}
        onOpenChange={(open) => {
          if (!open) openFolder(location);
        }}
      >
        <AlignModal.Content
          className="flex h-[90dvh] max-w-5xl flex-col overflow-hidden"
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
          <div className="min-w-0 p-4 pr-14">
            <AlignModal.Title asChild>
              <Typography
                ref={modalTitle}
                as="h2"
                tabIndex={-1}
                variant="label"
                className="min-w-0 flex-1 break-words outline-none"
              >
                {paper?.name}
              </Typography>
            </AlignModal.Title>
          </div>
          {links && (
            <div className="flex flex-wrap items-center gap-2 border-b border-stroke-soft-200 px-4 pb-3">
              <a
                href={links.download}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "neutral", mode: "stroke", size: "small" })}
              >
                Unduh
              </a>
              <AlignButton.Root
                variant="neutral"
                mode="stroke"
                size="small"
                onClick={() => {
                  void copyLink();
                }}
                aria-live="polite"
              >
                {share?.status === "copied" ? "Tautan disalin" : "Salin tautan"}
              </AlignButton.Root>
              <a
                href={links.drive}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "neutral", mode: "stroke", size: "small" })}
              >
                Buka di Drive <RiArrowRightUpLine className="size-4" aria-hidden="true" />
              </a>
              {share?.status === "manual" && (
                <div className="w-full">
                  <Typography variant="caption" role="status">
                    Gagal menyalin otomatis. Salin tautan berikut.
                  </Typography>
                  <input
                    aria-label="Tautan berkas"
                    readOnly
                    value={share.url}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-2 w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm"
                  />
                </div>
              )}
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
