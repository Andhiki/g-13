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

  return (
    <div
      className={
        view === "map"
          ? "flex h-dvh w-full flex-col overflow-hidden bg-bg-white-0"
          : "min-h-dvh w-full bg-bg-white-0"
      }
    >
      <Overlay
        controlsLabel="Filter peta kurikulum"
        navigation={<SemesterFilter scope={scope} onChange={explorer.setScope} />}
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
        <CurriculumVersionFilter curriculum={curriculum} onChange={explorer.changeVersion} />
        <ChoiceGroupFilter data={data} group={group} onChange={explorer.setGroup} />
      </Overlay>

      <main
        className={
          view === "map" ? "map-stage text-text-strong-950" : "min-h-dvh text-text-strong-950"
        }
      >
        {view === "map" ? (
          <CurriculumMap
            curriculum={curriculum}
            scope={scope}
            group={group}
            selectedId={selected?.id ?? null}
            nodes={map.nodes}
            edges={map.edges}
            positions={map.positions}
          />
        ) : (
          <section className="bg-bg-white-0 px-4 pb-[76px] pt-[76px] text-text-strong-950 min-[1100px]:pr-[348px] max-[1100px]:pt-[116px]">
            <div className="mx-auto max-w-5xl">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h1 className="m-0 text-label-md text-text-strong-950">Mata kuliah</h1>
                <span className="text-paragraph-xs text-text-sub-600" aria-live="polite">
                  {visible.length} mata kuliah
                </span>
              </div>
              <CourseList
                courses={visible}
                selectedId={selected?.id ?? null}
                select={explorer.selectCourse}
              />
            </div>
          </section>
        )}
        <CourseDetails
          modal={view !== "map"}
          course={selected}
          data={data}
          relations={relations}
          select={explorer.navigateToCourse}
          close={explorer.closeDetails}
        />
      </main>
    </div>
  );
}
