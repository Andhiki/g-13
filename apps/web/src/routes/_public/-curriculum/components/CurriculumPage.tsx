import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { courseLayout } from "@/courses/layout";
import { CourseDetails } from "@/courses/CourseDetails";
import { CurriculumVersionFilter } from "./CourseFilters";
import { CourseList } from "./CourseList";
import { CourseSearch } from "./CourseSearch";
import { CurriculumMap } from "./CurriculumMap";
import { SemesterFilter } from "@/graph/SemesterFilter";
import { ViewSwitch } from "./ViewSwitch";
import { Overlay } from "@/graph/Overlay";
import { useCurriculumExplorer } from "../client/useCurriculumExplorer";
import { useKeyboardShortcuts } from "@/ui/shortcuts";

export function CurriculumPage() {
  const { text } = useLocale();
  const explorer = useCurriculumExplorer();
  const { curriculum, data, relations, selected, view, map } = explorer;

  const [resetVersion, setResetVersion] = useState(0);
  const [visibleSemesters, setVisibleSemesters] = useState<number[]>([]);
  const [detailsHeight, setDetailsHeight] = useState(courseLayout.sheetHeights[0]);
  const stage = useRef<HTMLDivElement>(null);
  const [semesterNavigation, setSemesterNavigation] = useState<{ semester: number } | null>(null);
  const reportSemesters = useCallback((next: number[]) => {
    setVisibleSemesters((previous) => (previous.join(",") === next.join(",") ? previous : next));
  }, []);
  const navigateToSemester = (semester: number) => {
    if (semester > map.lastSemester) return;
    explorer.closeDetails();
    setSemesterNavigation({ semester });
  };
  useKeyboardShortcuts({
    "1": { run: () => navigateToSemester(1), description: "Ke semester {{v0}}" },
    "2": { run: () => navigateToSemester(2), description: "Ke semester {{v0}}" },
    "3": { run: () => navigateToSemester(3), description: "Ke semester {{v0}}" },
    "4": { run: () => navigateToSemester(4), description: "Ke semester {{v0}}" },
    "5": { run: () => navigateToSemester(5), description: "Ke semester {{v0}}" },
    "6": { run: () => navigateToSemester(6), description: "Ke semester {{v0}}" },
    "7": { run: () => navigateToSemester(7), description: "Ke semester {{v0}}" },
    "8": { run: () => navigateToSemester(8), description: "Ke semester {{v0}}" },
    v: {
      run: () => explorer.setView((current) => (current === "map" ? "list" : "map")),
      description: "Ganti tampilan",
    },
  });

  return (
    <div
      className={
        view === "map"
          ? "flex h-[calc(100dvh-var(--app-header-height))] w-full flex-col overflow-hidden bg-bg-white-0"
          : "min-h-[calc(100dvh-var(--app-header-height))] w-full bg-bg-white-0"
      }
    >
      <Overlay
        controlsLabel={text("Kurikulum")}
        shortcutDescription="Buka/tutup pilihan kurikulum"
        navigation={
          <SemesterFilter
            visible={view === "map" && selected ? [] : visibleSemesters}
            onNavigate={navigateToSemester}
            lastSemester={map.lastSemester}
          />
        }
        searchLeading={<ViewSwitch view={view} onViewChange={explorer.setView} />}
        search={
          <CourseSearch
            key={curriculum}
            data={data}
            onSelect={(course) => explorer.selectCourse(course.id)}
          />
        }
      >
        <CurriculumVersionFilter
          curriculum={curriculum}
          onChange={(value) => {
            setSemesterNavigation(null);
            explorer.changeVersion(value);
          }}
        />
      </Overlay>

      <main
        style={
          {
            "--course-sheet-height": `${detailsHeight}dvh`,
            "--course-details-width": `${courseLayout.detailsWidth}px`,
          } as CSSProperties
        }
        className={
          view === "map"
            ? "fixed inset-x-0 bottom-0 top-[var(--app-header-height)] overflow-hidden bg-bg-weak-25 text-text-strong-950"
            : "min-h-[calc(100dvh-var(--app-header-height))] text-text-strong-950"
        }
      >
        <div
          ref={stage}
          data-map-stage
          aria-hidden={view !== "map"}
          inert={view !== "map"}
          className="fixed inset-x-0 bottom-0 top-[var(--app-header-height)] overflow-hidden"
          style={{ opacity: view === "map" ? 1 : 0 }}
        >
          <CurriculumMap
            stage={stage}
            active={view === "map"}
            navigation={semesterNavigation}
            resetVersion={resetVersion}
            onReset={() => {
              setSemesterNavigation(null);
              explorer.closeDetails();
              setResetVersion((version) => version + 1);
            }}
            onVisibleSemesters={reportSemesters}
            close={explorer.closeDetails}
            curriculum={curriculum}
            selectedId={selected?.id ?? null}
            nodes={map.nodes}
            edges={map.edges}
          />
        </div>
        {view === "list" && (
          <section
            className={`bg-bg-white-0 px-4 pb-[76px] pt-32 text-text-strong-950 transition-[padding] duration-200 ease-out motion-reduce:transition-none max-[1100px]:pt-36 max-[640px]:pt-28 ${selected ? "min-[650px]:pl-[calc(var(--course-details-width)+16px)] max-[650px]:pb-[calc(var(--course-sheet-height)+76px)]" : ""}`}
          >
            <div className="mx-auto max-w-3xl">
              <Typography
                as="h1"
                variant="title"
                color="strong"
                className="m-0 mb-8 max-[640px]:mb-4"
              >
                {text("Mata kuliah")}
              </Typography>
              <CourseList
                navigation={semesterNavigation}
                onVisibleSemesters={reportSemesters}
                courses={data.all}
                selectedId={selected?.id ?? null}
                select={explorer.selectCourse}
              />
            </div>
          </section>
        )}
        <CourseDetails
          onHeightChange={setDetailsHeight}
          modal={false}
          course={selected}
          data={data}
          relations={relations}
          select={explorer.selectCourse}
          close={explorer.closeDetails}
        />
      </main>
    </div>
  );
}
