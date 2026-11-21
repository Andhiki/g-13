import { Loading } from "../ui/loading";
import { useLocale } from "../useLocale";
import {
  lazy,
  useEffect,
  useSyncExternalStore,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { DeferredContent } from "../ui/deferred-content";
import { AlignDrawer } from "../ui/drawer";
import { CompactButton } from "../ui/compact-button";
import { RiCloseLine } from "@remixicon/react";
import { CopyCourseButton } from "./CopyCourseButton";
import { showStarNudgeToast } from "../ui/star-nudge-toast";
import { noteCourseOpen } from "../ui/star-nudge";
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

const sheetSnapPoints = courseLayout.sheetHeights.map((height) => height / 100);

function subscribeToPhone(onChange: () => void) {
  const query = window.matchMedia(courseLayout.phoneQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

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
  const phone = useSyncExternalStore(
    subscribeToPhone,
    () => window.matchMedia(courseLayout.phoneQuery).matches,
    () => false,
  );
  const selection = course ? { course, data, relations } : null;
  // Retain the content while ui-sdk runs the close animation.
  const [lastSelection, setLastSelection] = useState(selection);
  if (
    selection &&
    (course !== lastSelection?.course ||
      data !== lastSelection.data ||
      relations !== lastSelection.relations)
  ) {
    setLastSelection(selection);
  }
  useEffect(() => {
    const courseId = course?.id;
    if (courseId && noteCourseOpen(courseId)) showStarNudgeToast(text);
  }, [course?.id, text]);
  const content = selection ?? lastSelection;

  return (
    <AlignDrawer.Root
      modal={phone ? true : modal}
      modalAbove={phone ? sheetSnapPoints[0] : undefined}
      open={course !== null}
      onOpenChange={(open) => !open && close()}
      side={phone ? "bottom" : "left"}
      driver="pointer"
      snapPoints={phone ? sheetSnapPoints : undefined}
      onSnapPointChange={
        onHeightChange
          ? (snapPoint) => {
              if (typeof snapPoint === "number") onHeightChange(snapPoint * 100);
            }
          : undefined
      }
    >
      {content && (
        <AlignDrawer.Content
          aria-describedby={undefined}
          aria-label={text("Detail {{v0}}", { v0: courseName(content.course) })}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButton.current?.focus();
          }}
          style={
            {
              "--course-details-width": `${courseLayout.detailsWidth}px`,
            } as CSSProperties
          }
          className="min-[650px]:mt-[var(--app-header-height)] min-[650px]:max-w-[var(--course-details-width)] overflow-hidden pt-0 max-[650px]:h-[75dvh]"
        >
          <AlignDrawer.Handle
            aria-label={text("Tinggi detail mata kuliah")}
            className="min-[650px]:hidden"
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
