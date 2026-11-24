import { useLocale } from "@/useLocale";
import { Fragment } from "react";
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
import { useShortcutHint } from "@/ui/shortcuts";
import { Typography } from "@/ui/typography";
import { browseArchive } from "../-shared/archive";
import { folderSearch } from "../-shared/search";
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

export function ExamKeyboardTips({ searchText }: { searchText: string }) {
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

export function ExamArchiveExplorer({
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-stroke-soft-200 lg:border-l lg:border-t-0">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-2">
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
