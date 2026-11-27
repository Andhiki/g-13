import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import { useMemo, useRef, useState } from "react";
import { useKeyboardShortcuts, useShortcutHint } from "@/ui/shortcuts";
import { AlignButton } from "@/ui/button";
import { AlignCommandMenu } from "@/ui/command-menu";
import { AlignKbd } from "@/ui/kbd";
import type { Course, Curriculum } from "@g13/curriculum";
import { matches, semesterLabel } from "@/courses/course-utils";

function CourseSearchResultItem({
  course,
  onSelect,
}: {
  course: Course;
  onSelect: (course: Course) => void;
}) {
  const { text, courseName } = useLocale();
  return (
    <AlignCommandMenu.Item value={course.id} onSelect={() => onSelect(course)}>
      <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5">
        <span>{courseName(course)}</span>
        {course.code && (
          <Typography as="span" variant="labelSmall" color="muted" className="whitespace-nowrap">
            {course.code}
          </Typography>
        )}
        <Typography as="small" variant="labelSmall" color="muted" className="col-start-1">
          {semesterLabel(course, text)}
        </Typography>
      </span>
    </AlignCommandMenu.Item>
  );
}

function CourseSearchFooter() {
  const { text } = useLocale();
  const hints = [
    { key: "↓", label: "Turun", ariaLabel: text("Panah bawah") },
    { key: "↑", label: "Naik", ariaLabel: text("Panah atas") },
    { key: "Enter", label: "Buka mata kuliah", ariaLabel: undefined },
  ];
  return (
    <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 bg-bg-weak-50 px-5 py-3 text-text-sub-600 min-[650px]:flex">
      {hints.map((hint) => (
        <span key={hint.key} className="flex items-center gap-1.5">
          <AlignKbd.Root aria-label={hint.ariaLabel}>{hint.key}</AlignKbd.Root>
          <Typography as="span" variant="caption">
            {text(hint.label)}
          </Typography>
        </span>
      ))}
    </div>
  );
}

function CourseSearchInputRow({ onClose }: { onClose: () => void }) {
  const { text } = useLocale();
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <AlignCommandMenu.Input
          autoFocus
          aria-label={text("Cari mata kuliah")}
          placeholder={text("Nama, kode, prasyarat…")}
        />
      </div>
      <div className="shrink-0 min-[650px]:hidden">
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="small"
          onClick={onClose}
          aria-label={text("Tutup pencarian")}
        >
          {text("Batal")}
        </AlignButton.Root>
      </div>
    </div>
  );
}

function CourseSearchDialog({
  open,
  query,
  results,
  triggerRef,
  onOpenChange,
  onQueryChange,
  onSelect,
}: {
  open: boolean;
  query: string;
  results: Course[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelect: (course: Course) => void;
}) {
  const { text } = useLocale();
  return (
    <AlignCommandMenu.Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-[650px]:my-0 max-[650px]:h-dvh max-[650px]:max-h-none max-[650px]:w-full max-[650px]:max-w-none max-[650px]:rounded-none"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        triggerRef.current?.focus();
      }}
      filter={false}
      query={query}
      onQueryChange={onQueryChange}
    >
      <AlignCommandMenu.DialogTitle className="sr-only">
        {text("Cari mata kuliah")}
      </AlignCommandMenu.DialogTitle>
      <AlignCommandMenu.DialogDescription className="sr-only">
        {text("Cari berdasarkan nama, kode, atau prasyarat.")}
      </AlignCommandMenu.DialogDescription>
      <CourseSearchInputRow onClose={() => onOpenChange(false)} />
      <AlignCommandMenu.List className="max-[650px]:max-h-none">
        {results.length ? (
          <AlignCommandMenu.Group>
            {results.map((course) => (
              <CourseSearchResultItem
                key={course.id}
                course={course}
                onSelect={(picked) => {
                  onOpenChange(false);
                  onSelect(picked);
                }}
              />
            ))}
          </AlignCommandMenu.Group>
        ) : query.trim() ? (
          <div className="px-5 py-4 text-text-sub-600" role="status">
            <Typography>{text("Tidak ada mata kuliah yang cocok.")}</Typography>
          </div>
        ) : null}
      </AlignCommandMenu.List>
      <CourseSearchFooter />
    </AlignCommandMenu.Dialog>
  );
}

export function CourseSearch({
  data,
  onSelect,
}: {
  data: Curriculum;
  onSelect: (course: Course) => void;
}) {
  const { text } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };
  useKeyboardShortcuts({
    "/": { run: () => setOpen(true), description: "Cari mata kuliah" },
  });
  const searchHint = useShortcutHint("/");
  const results = useMemo(
    () => (query.trim() ? data.all.filter((course) => matches(course, query)).slice(0, 8) : []),
    [data, query],
  );

  return (
    <div className="relative flex min-w-0 flex-col gap-[5px]">
      <AlignButton.Root
        ref={triggerRef}
        variant="neutral"
        mode="stroke"
        size="medium"
        aria-label={text("Cari mata kuliah")}
        aria-haspopup="dialog"
        aria-keyshortcuts={searchHint.ariaKeyshortcuts}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="min-w-0 flex-1 truncate text-left">{text("Cari mata kuliah")}</span>
        <AlignKbd.Root aria-hidden="true">{searchHint.text}</AlignKbd.Root>
      </AlignButton.Root>
      <CourseSearchDialog
        open={open}
        query={query}
        results={results}
        triggerRef={triggerRef}
        onOpenChange={changeOpen}
        onQueryChange={setQuery}
        onSelect={onSelect}
      />
    </div>
  );
}
