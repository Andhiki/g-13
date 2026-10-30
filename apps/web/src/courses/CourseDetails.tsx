import { Loading } from "../ui/loading";
import { useLocale } from "../useLocale";
import { lazy, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DeferredContent } from "../ui/deferred-content";
import { AlignDrawer } from "../ui/drawer";
import { CompactButton } from "../ui/compact-button";
import { RiCloseLine } from "@remixicon/react";
import { CopyCourseButton } from "./CopyCourseButton";
import { CourseSheetHandle } from "./CourseSheetHandle";
import type { Course, Curriculum, Relation } from "@g13/curriculum";
import { courseLayout } from "./layout";

export type CourseDetailsProps = {
  course: Course | null;
  data: Curriculum;
  relations: Relation[];
  select: (id: string) => void;
  close: () => void;
  modal?: boolean;
  footer?: ReactNode;
  onHeightChange?: (height: number) => void;
};

const CourseDetailsPanel = lazy(() =>
  import("./CourseDetailsPanel").then((module) => ({ default: module.CourseDetailsPanel })),
);

export function CourseDetails({
  course,
  data,
  relations,
  select,
  close,
  modal = true,
  footer,
  onHeightChange,
}: CourseDetailsProps) {
  const { text, courseName } = useLocale();
  const closeButton = useRef<HTMLButtonElement>(null);
  const [height, setHeight] = useState(courseLayout.sheetHeights[0]);
  const sheet = useRef<HTMLDivElement>(null);
  const selection = course ? { course, data, relations } : null;
  // Retain the content while Radix runs the close animation.
  const [lastSelection, setLastSelection] = useState(selection);
  if (
    selection &&
    (course !== lastSelection?.course ||
      data !== lastSelection.data ||
      relations !== lastSelection.relations)
  ) {
    setLastSelection(selection);
  }
  const content = selection ?? lastSelection;

  return (
    <AlignDrawer.Root
      modal={modal}
      open={course !== null}
      onOpenChange={(open) => !open && close()}
    >
      {content && (
        <AlignDrawer.Content
          ref={sheet}
          modal={modal}
          aria-describedby={undefined}
          aria-label={text("Detail {{v0}}", { v0: courseName(content.course) })}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButton.current?.focus();
          }}
          onInteractOutside={modal ? undefined : (event) => event.preventDefault()}
          style={
            {
              "--course-sheet-height": `${height}dvh`,
              "--course-details-width": `${courseLayout.detailsWidth}px`,
            } as CSSProperties
          }
          className="data-[state=open]:duration-400 data-[state=closed]:duration-400 data-[state=open]:ease-[cubic-bezier(0.33,1,0.68,1)] data-[state=closed]:ease-[cubic-bezier(0.33,1,0.68,1)] max-w-[var(--course-details-width)] min-[650px]:top-[var(--app-header-height)] max-[650px]:fixed max-[650px]:inset-x-0 max-[650px]:top-auto max-[650px]:bottom-0 max-[650px]:h-[var(--course-sheet-height)] max-[650px]:max-w-none max-[650px]:rounded-t-10 max-[650px]:border-r-0 max-[650px]:border-t max-[650px]:data-[state=open]:slide-in-from-bottom-full max-[650px]:data-[state=closed]:slide-out-to-bottom-full max-[650px]:data-[state=open]:[--tw-enter-translate-x:0%] max-[650px]:data-[state=closed]:[--tw-exit-translate-x:0%]"
        >
          <CourseSheetHandle
            sheet={sheet}
            height={height}
            onChange={(next) => {
              setHeight(next);
              onHeightChange?.(next);
            }}
          />
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-5 sm:top-5">
            <CopyCourseButton
              key={content.course.id}
              value={content.course.id}
              label={text("ID mata kuliah")}
            />
            <AlignDrawer.Close asChild>
              <CompactButton ref={closeButton} aria-label={text("Tutup detail mata kuliah")}>
                <RiCloseLine className="size-5" aria-hidden="true" />
              </CompactButton>
            </AlignDrawer.Close>
          </div>
          <DeferredContent
            fallback={
              <>
                <AlignDrawer.Title className="sr-only">
                  {text("Memuat detail mata kuliah…")}
                </AlignDrawer.Title>
                <Loading />
              </>
            }
          >
            <CourseDetailsPanel {...content} select={select} footer={footer} />
          </DeferredContent>
        </AlignDrawer.Content>
      )}
    </AlignDrawer.Root>
  );
}
