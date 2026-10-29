import { RoadmapShare } from "./RoadmapShare";
import { useLocale } from "../../useLocale";
import { getCurriculum } from "@g13/curriculum";
import { Typography } from "../../ui/typography";
import { useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftLine } from "@remixicon/react";
import { Overlay } from "../../graph/Overlay";
import { SemesterFilter } from "../../graph/SemesterFilter";
import { RoadmapFilters } from "./RoadmapFilters";
import { RoadmapNotes } from "./RoadmapNotes";
import { buttonVariants } from "../../ui/button";
import { CourseDetails } from "../../courses/CourseDetails";
import { getRoadmap } from "./roadmap-cache";
import { RoadmapGraph } from "./RoadmapGraph";
import { ElectiveReplacement } from "./ElectiveReplacement";
import type { PlanningInput } from "./planning-input";
import type { RoadmapSearch } from "./search";

const kinds = {
  required: "Wajib",
  interest: "Wajib minat",
  elective: "Rekomendasi pilihan",
  internship: "Magang pilihan",
};
export function RoadmapResult({
  answers,
  input,
  update,
  restart,
}: {
  restart: () => void;
  answers: RoadmapSearch;
  input: PlanningInput;
  update: (next: RoadmapSearch) => void;
}) {
  const { text } = useLocale("roadmap");
  const plan = useMemo(() => getRoadmap(input), [input]);
  const [navigation, setNavigation] = useState<{ semester: number } | null>(null);
  const [visibleSemesters, setVisibleSemesters] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const choose = useCallback((id: string) => setSelectedId(id), []);
  const selected = plan.courses.find((x) => x.course.id === selectedId);
  const data = getCurriculum(input.kurikulum);
  const detailsData = useMemo(
    () => ({
      ...data,
      all: [
        ...data.all,
        ...plan.courses
          .filter((x) => !data.all.some((c) => c.id === x.course.id))
          .map((x) => x.course),
      ],
    }),
    [data, plan],
  );
  return (
    <div className="h-[calc(100dvh-var(--app-header-height))] w-full overflow-hidden bg-bg-weak-25 text-text-strong-950">
      <main className="fixed inset-x-0 bottom-0 top-[var(--app-header-height)] overflow-hidden">
        <RoadmapGraph
          plan={plan}
          restart={restart}
          shareLink={<RoadmapShare selection={JSON.stringify(answers)} />}
          target={answers.lulus}
          summary={text("roadmapSummary", {
            curriculum: data.id,
            interest: text(
              answers.minat && answers.minat !== "tanpa-minat"
                ? answers.minat.replace(/^Lab /, "")
                : "Tanpa peminatan",
            ),
            target: answers.lulus,
            activities:
              plan.activities.map((activity) => text(activity.title)).join(", ") ||
              text("Tanpa kegiatan tambahan"),
            review: plan.conflicts.length
              ? text("reviewCount", { count: plan.conflicts.length })
              : text("Cek catatan roadmap sebelum menyusun KRS."),
          })}
          selectedId={selectedId}
          choose={choose}
          navigation={navigation}
          onVisibleSemesters={setVisibleSemesters}
        />
      </main>
      <Overlay
        controlsLabel={text("Filter roadmap")}
        filterCopy={{
          title: text("Filter roadmap"),
          description: text("Bandingkan target selesai dan waktu kegiatan."),
        }}
        home={
          <Link
            to="/"
            search={{ kurikulum: input.kurikulum }}
            className={buttonVariants({
              variant: "neutral",
              mode: "stroke",
              className: "pointer-events-auto",
            })}
          >
            <RiArrowLeftLine className="size-5" aria-hidden="true" />
            {text("Kembali")}
          </Link>
        }
        navigation={
          <SemesterFilter
            visible={visibleSemesters}
            onNavigate={(semester) => {
              setSelectedId(null);
              setNavigation({ semester });
            }}
            lastSemester={Math.max(
              1,
              ...plan.courses.map((x) => x.semester),
              ...plan.activities.map((x) => x.semester),
            )}
          />
        }
        search={null}
        viewControl={
          <RoadmapNotes plan={plan} target={answers.lulus} sourceTitle={data.sourceTitle} />
        }
      >
        <RoadmapFilters answers={answers} update={update} />
      </Overlay>
      <CourseDetails
        modal={false}
        course={selected?.course ?? data.all.find((course) => course.id === selectedId) ?? null}
        data={detailsData}
        relations={plan.relations}
        select={choose}
        close={() => setSelectedId(null)}
        footer={
          selected && (
            <div className="space-y-3">
              <Typography as="p" variant="paragraph" className="m-0">
                {text(kinds[selected.kind])} {text("· Rencana semester")} {selected.semester}
              </Typography>
              {selected.kind === "elective" && (
                <ElectiveReplacement
                  key={selected.course.id}
                  item={selected}
                  plan={plan}
                  answers={answers}
                  replace={(originalId, id) => {
                    update({ ...answers, ganti: { ...answers.ganti, [originalId]: id } });
                    setSelectedId(id);
                  }}
                />
              )}
            </div>
          )
        }
      />
    </div>
  );
}
