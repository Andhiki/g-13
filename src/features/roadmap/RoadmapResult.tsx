import { useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftLine, RiShareLine } from "@remixicon/react";
import { ThemeSwitch } from "../../ui/theme-switch";
import { AlignModal } from "../../ui/modal";
import { Overlay } from "../curriculum/components/Overlay";
import { SemesterFilter } from "../curriculum/components/SemesterFilter";
import { RoadmapFilters } from "./RoadmapFilters";
import { RoadmapNotes } from "./RoadmapNotes";
import { curricula } from "../../data";
import { AlignButton } from "../../ui/button";
import { CourseDetails } from "../curriculum/components/CourseDetails";
import { buildRoadmap } from "./planner";
import { RoadmapGraph } from "./RoadmapGraph";
import { ElectiveReplacement } from "./ElectiveReplacement";
import type { RoadmapSearch } from "./search";

const kinds = {
  required: "Wajib",
  interest: "Wajib minat",
  elective: "Rekomendasi pilihan",
  internship: "Magang pilihan",
};
export function RoadmapResult({
  answers,
  update,
  restart,
}: {
  restart: () => void;
  answers: RoadmapSearch;
  update: (next: RoadmapSearch) => void;
}) {
  const plan = useMemo(() => buildRoadmap(answers), [answers]);
  const [navigation, setNavigation] = useState<{ semester: number } | null>(null);
  const [visibleSemesters, setVisibleSemesters] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const choose = useCallback((id: string) => setSelectedId(id), []);
  const [share, setShare] = useState<"idle" | "copied" | "manual">("idle");
  const selected = plan.courses.find((x) => x.course.id === selectedId);
  const data = curricula[answers.kurikulum ?? "2026"];
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
  const [manualLink, setManualLink] = useState("");
  const [sharedPlan, setSharedPlan] = useState<RoadmapSearch | null>(null);
  async function copyLink() {
    setSharedPlan(answers);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShare("copied");
    } catch {
      setManualLink(window.location.href);
      setShare("manual");
    }
  }
  return (
    <div className="h-dvh w-full overflow-hidden bg-bg-weak-25 text-text-strong-950">
      <main className="fixed inset-0 overflow-hidden">
        <RoadmapGraph
          plan={plan}
          target={answers.lulus}
          selectedId={selectedId}
          choose={choose}
          navigation={navigation}
          onVisibleSemesters={setVisibleSemesters}
        />
      </main>
      <Overlay
        controlsLabel="Filter roadmap"
        filterCopy={{
          title: "Filter roadmap",
          description: "Bandingkan target selesai dan waktu kegiatan.",
          action: "Tampilkan roadmap",
        }}
        home={
          <Link
            to="/"
            search={{ kurikulum: answers.kurikulum ?? "2026" }}
            aria-label="Peta kurikulum"
            className="pointer-events-auto flex h-10 items-center gap-2 text-label-sm text-text-sub-600 hover:text-text-strong-950"
          >
            <RiArrowLeftLine className="size-5" aria-hidden="true" />
            <span className="max-[1100px]:hidden">Peta kurikulum</span>
          </Link>
        }
        navigation={
          <SemesterFilter
            visible={visibleSemesters}
            onNavigate={(semester) => {
              setSelectedId(null);
              setNavigation({ semester });
            }}
            lastSemester={Math.max(answers.lulus, ...plan.courses.map((x) => x.semester))}
          />
        }
        appearance={<ThemeSwitch />}
        search={
          <div className="flex justify-end">
            <AlignButton.Root variant="neutral" mode="stroke" onClick={copyLink}>
              <RiShareLine className="size-5" aria-hidden="true" />
              {share === "copied" && sharedPlan === answers ? "Tautan disalin" : "Bagikan"}
            </AlignButton.Root>
          </div>
        }
        viewControl={
          <RoadmapNotes plan={plan} target={answers.lulus} sourceTitle={data.sourceTitle} />
        }
      >
        <RoadmapFilters
          answers={answers}
          totalCredits={plan.totalCredits}
          update={update}
          restart={restart}
        />
      </Overlay>
      <span className="sr-only" role="status">
        {share === "copied" && sharedPlan === answers ? "Tautan roadmap disalin." : ""}
      </span>
      <AlignModal.Root
        open={share === "manual" && sharedPlan === answers}
        onOpenChange={(open) => {
          if (!open) setShare("idle");
        }}
      >
        <AlignModal.Content>
          <div className="p-5">
            <AlignModal.Title className="pr-8 text-label-lg">Bagikan roadmap</AlignModal.Title>
            <AlignModal.Description className="mt-2 text-paragraph-sm text-text-sub-600">
              Salin tautan ini untuk membuka rencana yang sama.
            </AlignModal.Description>
            <input
              aria-label="Tautan roadmap"
              readOnly
              value={manualLink}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-4 block w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm"
            />
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
      <CourseDetails
        course={selected?.course ?? data.all.find((course) => course.id === selectedId) ?? null}
        data={detailsData}
        relations={plan.relations}
        select={choose}
        close={() => setSelectedId(null)}
        footer={
          selected && (
            <div className="space-y-3">
              <p className="m-0 text-paragraph-sm">
                {kinds[selected.kind]} · Rencana semester {selected.semester}
              </p>
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
