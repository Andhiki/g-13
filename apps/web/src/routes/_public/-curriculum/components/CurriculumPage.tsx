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

function CourseListView({
  courses,
  selectedId,
  semesterNavigation,
  onVisibleSemesters,
  onSelectCourse,
}: {
  courses: ReturnType<typeof useCurriculumExplorer>["data"]["all"];
  selectedId: string | null;
  semesterNavigation: { semester: number } | null;
  onVisibleSemesters: (next: number[]) => void;
  onSelectCourse: (id: string) => void;
}) {
  const { text } = useLocale();
  return (
    <section
      className={`bg-bg-white-0 px-4 pb-[76px] pt-32 text-text-strong-950 transition-[padding] duration-200 ease-out motion-reduce:transition-none max-[1100px]:pt-36 max-[640px]:pt-28 ${selectedId ? "min-[650px]:pl-[calc(var(--course-details-width)+16px)] max-[650px]:pb-[calc(var(--course-sheet-height)+76px)]" : ""}`}
    >
      <div className="mx-auto max-w-3xl">
        <Typography as="h1" variant="title" color="strong" className="m-0 mb-8 max-[640px]:mb-4">
          {text("Mata kuliah")}
        </Typography>
        <CourseList
          navigation={semesterNavigation}
          onVisibleSemesters={onVisibleSemesters}
          courses={courses}
          selectedId={selectedId}
          select={onSelectCourse}
        />
      </div>
    </section>
  );
}

function CurriculumOverlayBar({
  explorer,
  visibleSemesters,
  navigateToSemester,
  onVersionReset,
}: {
  explorer: ReturnType<typeof useCurriculumExplorer>;
  visibleSemesters: number[];
  navigateToSemester: (semester: number) => void;
  onVersionReset: () => void;
}) {
  const { text } = useLocale();
  const { curriculum, data, selected, view, map } = explorer;
  return (
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
          onVersionReset();
          explorer.changeVersion(value);
        }}
      />
    </Overlay>
  );
}

function CurriculumStage({
  stage,
  explorer,
  resetVersion,
  semesterNavigation,
  onReset,
  onVisibleSemesters,
}: {
  stage: React.RefObject<HTMLDivElement | null>;
  explorer: ReturnType<typeof useCurriculumExplorer>;
  resetVersion: number;
  semesterNavigation: { semester: number } | null;
  onReset: () => void;
  onVisibleSemesters: (next: number[]) => void;
}) {
  const { curriculum, selected, view, map } = explorer;
  return (
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
        onReset={onReset}
        onVisibleSemesters={onVisibleSemesters}
        close={explorer.closeDetails}
        curriculum={curriculum}
        selectedId={selected?.id ?? null}
        nodes={map.nodes}
        edges={map.edges}
      />
    </div>
  );
}

function CurriculumMain({
  stage,
  explorer,
  detailsHeight,
  resetVersion,
  semesterNavigation,
  onReset,
  onVisibleSemesters,
  onDetailsHeightChange,
}: {
  stage: React.RefObject<HTMLDivElement | null>;
  explorer: ReturnType<typeof useCurriculumExplorer>;
  detailsHeight: number;
  resetVersion: number;
  semesterNavigation: { semester: number } | null;
  onReset: () => void;
  onVisibleSemesters: (next: number[]) => void;
  onDetailsHeightChange: (height: number) => void;
}) {
  const { data, relations, selected, view } = explorer;
  return (
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
      <CurriculumStage
        stage={stage}
        explorer={explorer}
        resetVersion={resetVersion}
        semesterNavigation={semesterNavigation}
        onReset={onReset}
        onVisibleSemesters={onVisibleSemesters}
      />
      {view === "list" && (
        <CourseListView
          courses={data.all}
          selectedId={selected?.id ?? null}
          semesterNavigation={semesterNavigation}
          onVisibleSemesters={onVisibleSemesters}
          onSelectCourse={explorer.selectCourse}
        />
      )}
      <CourseDetails
        onHeightChange={onDetailsHeightChange}
        modal={false}
        course={selected}
        data={data}
        relations={relations}
        select={explorer.selectCourse}
        close={explorer.closeDetails}
      />
    </main>
  );
}

export function CurriculumPage() {
  const explorer = useCurriculumExplorer();
  const { view, map } = explorer;

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
      <CurriculumOverlayBar
        explorer={explorer}
        visibleSemesters={visibleSemesters}
        navigateToSemester={navigateToSemester}
        onVersionReset={() => setSemesterNavigation(null)}
      />
      <CurriculumMain
        stage={stage}
        explorer={explorer}
        detailsHeight={detailsHeight}
        resetVersion={resetVersion}
        semesterNavigation={semesterNavigation}
        onReset={() => {
          setSemesterNavigation(null);
          explorer.closeDetails();
          setResetVersion((version) => version + 1);
        }}
        onVisibleSemesters={reportSemesters}
        onDetailsHeightChange={setDetailsHeight}
      />
    </div>
  );
}
