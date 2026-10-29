import { useLocale } from "../../useLocale";
import { Typography } from "../../ui/typography";
import { useCallback, useState, type CSSProperties } from "react";
import { CourseDetails } from "./components/CourseDetails";
import { CurriculumVersionFilter } from "./components/CourseFilters";
import { CourseList } from "./components/CourseList";
import { CourseSearch } from "./components/CourseSearch";
import { CurriculumMap } from "./components/CurriculumMap";
import { SemesterFilter } from "./components/SemesterFilter";
import { ViewSwitch } from "./components/ViewSwitch";
import { Overlay } from "./components/Overlay";
import { useCurriculumExplorer } from "./useCurriculumExplorer";
import { useKeyboardShortcuts } from "../../ui/use-keyboard-shortcuts";

export function CurriculumPage() {
  const { text } = useLocale();
  const explorer = useCurriculumExplorer();
  const { curriculum, data, relations, selected, view, map } = explorer;

  const [resetVersion, setResetVersion] = useState(0);
  const [visibleSemesters, setVisibleSemesters] = useState<number[]>([]);
  const [detailsHeight, setDetailsHeight] = useState(30);
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
    "1": () => navigateToSemester(1),
    "2": () => navigateToSemester(2),
    "3": () => navigateToSemester(3),
    "4": () => navigateToSemester(4),
    "5": () => navigateToSemester(5),
    "6": () => navigateToSemester(6),
    "7": () => navigateToSemester(7),
    "8": () => navigateToSemester(8),
    v: () => explorer.setView((current) => (current === "map" ? "list" : "map")),
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
        filtersInToolbar={view === "list"}
        controlsLabel={text("Filter peta kurikulum")}
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
            onSelect={(course) => explorer.navigateToCourse(course.id)}
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
        style={{ "--course-sheet-height": `${detailsHeight}dvh` } as CSSProperties}
        data-map-stage={view === "map" ? "" : undefined}
        className={
          view === "map"
            ? "fixed inset-x-0 bottom-0 top-[var(--app-header-height)] overflow-hidden bg-bg-weak-25 text-text-strong-950"
            : "min-h-[calc(100dvh-var(--app-header-height))] text-text-strong-950"
        }
      >
        {view === "map" ? (
          <CurriculumMap
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
            positions={map.positions}
            lastSemester={map.lastSemester}
          />
        ) : (
          <section
            className={`bg-bg-white-0 px-4 pb-[76px] pt-32 text-text-strong-950 transition-[padding] duration-200 ease-out motion-reduce:transition-none max-[1100px]:pt-36 ${selected ? "min-[650px]:pl-[416px] max-[650px]:pb-[calc(var(--course-sheet-height)+76px)]" : ""}`}
          >
            <div className="mx-auto max-w-3xl">
              <Typography as="h1" variant="title" className="m-0 mb-8 text-text-strong-950">
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
