import { Typography } from "../../ui/typography";
import { useCallback, useState, type CSSProperties } from "react";
import { ThemeSwitch } from "../../ui/theme-switch";
import { CourseDetails } from "./components/CourseDetails";
import { ChoiceGroupFilter, CurriculumVersionFilter } from "./components/CourseFilters";
import { CourseList } from "./components/CourseList";
import { CourseSearch } from "./components/CourseSearch";
import { CurriculumMap } from "./components/CurriculumMap";
import { SemesterFilter } from "./components/SemesterFilter";
import { ViewSwitch } from "./components/ViewSwitch";
import { Overlay } from "./components/Overlay";
import { useCurriculumExplorer } from "./useCurriculumExplorer";

export function CurriculumPage() {
  const explorer = useCurriculumExplorer();
  const { curriculum, data, relations, visible, selected, group, scope, view, map } = explorer;

  const [visibleSemesters, setVisibleSemesters] = useState<number[]>([]);
  const [detailsHeight, setDetailsHeight] = useState(30);
  const [semesterNavigation, setSemesterNavigation] = useState<{ semester: number } | null>(null);
  const reportSemesters = useCallback((next: number[]) => {
    setVisibleSemesters((previous) => (previous.join(",") === next.join(",") ? previous : next));
  }, []);
  const navigateToSemester = (semester: number) => {
    explorer.closeDetails();
    setSemesterNavigation({ semester });
  };

  return (
    <div
      className={
        view === "map"
          ? "flex h-dvh w-full flex-col overflow-hidden bg-bg-white-0"
          : "min-h-dvh w-full bg-bg-white-0"
      }
    >
      <Overlay
        filtersInToolbar={view === "list"}
        controlsLabel="Filter peta kurikulum"
        navigation={
          <SemesterFilter
            visible={view === "map" && selected ? [] : visibleSemesters}
            onNavigate={navigateToSemester}
          />
        }
        viewControl={<ViewSwitch view={view} onViewChange={explorer.setView} />}
        appearance={<ThemeSwitch />}
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
        <ChoiceGroupFilter
          data={data}
          group={group}
          onChange={(value) => {
            setSemesterNavigation(null);
            explorer.setGroup(value);
          }}
        />
      </Overlay>

      <main
        data-map-stage={view === "map" ? "" : undefined}
        className={
          view === "map"
            ? "fixed inset-0 min-h-dvh overflow-hidden bg-bg-weak-25 text-text-strong-950"
            : "min-h-dvh text-text-strong-950"
        }
      >
        {view === "map" ? (
          <CurriculumMap
            navigation={semesterNavigation}
            onVisibleSemesters={reportSemesters}
            close={explorer.closeDetails}
            curriculum={curriculum}
            scope={scope}
            group={group}
            selectedId={selected?.id ?? null}
            nodes={map.nodes}
            edges={map.edges}
            positions={map.positions}
          />
        ) : (
          <section
            style={{ "--course-sheet-height": `${detailsHeight}dvh` } as CSSProperties}
            className={`bg-bg-white-0 px-4 pb-[76px] pt-[76px] text-text-strong-950 transition-[padding] duration-200 ease-out motion-reduce:transition-none max-[1100px]:pt-[116px] ${selected ? "min-[650px]:pl-[416px] max-[650px]:pb-[calc(var(--course-sheet-height)+76px)]" : ""}`}
          >
            <div className="mx-auto max-w-5xl">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <Typography as="h1" variant="subtitle2" className="m-0 text-text-strong-950">
                  Mata kuliah
                </Typography>
                <Typography
                  as="span"
                  variant="caption"
                  className="text-text-sub-600"
                  aria-live="polite"
                >
                  {visible.length} mata kuliah
                </Typography>
              </div>
              <CourseList
                navigation={semesterNavigation}
                onVisibleSemesters={reportSemesters}
                courses={visible}
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
