import { Typography } from "../../../ui/typography";
import { useMemo, useRef, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { AlignButton } from "../../../ui/button";
import { AlignCommandMenu } from "../../../ui/command-menu";
import { AlignKbd } from "../../../ui/kbd";
import type { Course, Curriculum } from "@g13/curriculum";
import { matches, semesterLabel } from "../course-utils";

export function CourseSearch({
  data,
  onSelect,
}: {
  data: Curriculum;
  onSelect: (course: Course) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };
  useHotkey("/", () => setOpen(true), {
    enabled: !open,
    ignoreInputs: true,
    requireReset: true,
  });
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
        aria-label="Cari mata kuliah"
        aria-haspopup="dialog"
        aria-keyshortcuts="/"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="flex-1 text-left">Cari mata kuliah</span>
        <AlignKbd.Root aria-hidden="true">/</AlignKbd.Root>
      </AlignButton.Root>
      <AlignCommandMenu.Dialog
        open={open}
        onOpenChange={changeOpen}
        overlayClassName="max-[650px]:p-0"
        className="max-[650px]:h-dvh max-[650px]:max-w-none max-[650px]:rounded-none"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
        shouldFilter={false}
      >
        <AlignCommandMenu.DialogTitle className="sr-only">
          Cari mata kuliah
        </AlignCommandMenu.DialogTitle>
        <AlignCommandMenu.DialogDescription className="sr-only">
          Cari berdasarkan nama, kode, atau prasyarat.
        </AlignCommandMenu.DialogDescription>
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <AlignCommandMenu.Input
              autoFocus
              aria-label="Cari mata kuliah"
              placeholder="Nama, kode, prasyarat…"
              value={query}
              onValueChange={setQuery}
            />
          </div>
          <div className="shrink-0 min-[650px]:hidden">
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="small"
              onClick={() => changeOpen(false)}
              aria-label="Tutup pencarian"
            >
              Batal
            </AlignButton.Root>
          </div>
        </div>
        <AlignCommandMenu.List className="max-[650px]:max-h-none">
          {query.trim() ? (
            results.length ? (
              <AlignCommandMenu.Group>
                {results.map((course) => (
                  <AlignCommandMenu.Item
                    key={course.id}
                    value={course.id}
                    onSelect={() => {
                      setQuery("");
                      setOpen(false);
                      onSelect(course);
                    }}
                  >
                    <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5">
                      <span>{course.title}</span>
                      {course.code && (
                        <Typography
                          as="span"
                          variant="labelSmall"
                          className="whitespace-nowrap text-text-sub-600"
                        >
                          {course.code}
                        </Typography>
                      )}
                      <Typography
                        as="small"
                        variant="labelSmall"
                        className="col-start-1 text-text-sub-600"
                      >
                        {semesterLabel(course)}
                      </Typography>
                    </span>
                  </AlignCommandMenu.Item>
                ))}
              </AlignCommandMenu.Group>
            ) : (
              <AlignCommandMenu.Empty
                className="px-5 py-4 text-paragraph-sm text-text-sub-600"
                role="status"
              >
                Tidak ada mata kuliah yang cocok.
              </AlignCommandMenu.Empty>
            )
          ) : (
            <AlignCommandMenu.Empty className="px-5 py-4 text-paragraph-sm text-text-sub-600">
              Ketik nama, kode, atau prasyarat untuk mencari.
            </AlignCommandMenu.Empty>
          )}
        </AlignCommandMenu.List>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-bg-weak-50 px-5 py-3 text-paragraph-xs text-text-sub-600">
          <span className="flex items-center gap-1.5">
            <AlignKbd.Root aria-label="Panah bawah">↓</AlignKbd.Root>
            Turun
          </span>
          <span className="flex items-center gap-1.5">
            <AlignKbd.Root aria-label="Panah atas">↑</AlignKbd.Root>
            Naik
          </span>
          <span className="flex items-center gap-1.5">
            <AlignKbd.Root>Enter</AlignKbd.Root>
            Buka mata kuliah
          </span>
        </div>
      </AlignCommandMenu.Dialog>
    </div>
  );
}
