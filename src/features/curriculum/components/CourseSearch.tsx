import { useMemo, useRef, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { AlignButton } from "../../../ui/button";
import { AlignCommandMenu } from "../../../ui/command-menu";
import { AlignKbd } from "../../../ui/kbd";
import type { Course, Curriculum } from "../../../data";
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
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery("");
        }}
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
        <div className="px-5 py-4">
          <AlignCommandMenu.Input
            autoFocus
            aria-label="Cari mata kuliah"
            placeholder="Nama, kode, prasyarat…"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <AlignCommandMenu.List>
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
                        <span className="whitespace-nowrap text-label-xs text-text-sub-600">
                          {course.code}
                        </span>
                      )}
                      <small className="col-start-1 text-label-xs text-text-sub-600">
                        {semesterLabel(course)}
                      </small>
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
      </AlignCommandMenu.Dialog>
    </div>
  );
}
