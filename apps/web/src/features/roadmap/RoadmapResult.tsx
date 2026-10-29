import { useLocale } from "../../useLocale";
import { AlignTooltip } from "../../ui/tooltip";
import { toast, SuccessToast } from "../../ui/toast";
import { defaultCurriculumId, getCurriculum } from "@g13/curriculum";
import { m, useReducedMotion } from "motion/react";
import { Typography } from "../../ui/typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftLine, RiShareLine, RiCheckLine, RiRestartLine } from "@remixicon/react";
import { AlignModal } from "../../ui/modal";
import { Overlay } from "../curriculum/components/Overlay";
import { SemesterFilter } from "../curriculum/components/SemesterFilter";
import { RoadmapFilters } from "./RoadmapFilters";
import { RoadmapNotes } from "./RoadmapNotes";
import { AlignButton, buttonVariants } from "../../ui/button";
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
  const { text, courseName } = useLocale("roadmap");
  const plan = useMemo(
    () => buildRoadmap(answers, { text, courseName }),
    [answers, text, courseName],
  );
  const [navigation, setNavigation] = useState<{ semester: number } | null>(null);
  const [visibleSemesters, setVisibleSemesters] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const choose = useCallback((id: string) => setSelectedId(id), []);
  const [share, setShare] = useState<"idle" | "copied" | "manual">("idle");
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (share !== "copied") return;
    const timer = window.setTimeout(() => setShare("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [share]);
  const selected = plan.courses.find((x) => x.course.id === selectedId);
  const data = getCurriculum(answers.kurikulum ?? defaultCurriculumId);
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
      toast.custom(() => <SuccessToast message={text("Tautan roadmap disalin")} />);
      setShare("copied");
    } catch {
      setManualLink(window.location.href);
      setShare("manual");
    }
  }
  return (
    <div className="h-[calc(100dvh-var(--app-header-height))] w-full overflow-hidden bg-bg-weak-25 text-text-strong-950">
      <main className="fixed inset-x-0 bottom-0 top-[var(--app-header-height)] overflow-hidden">
        <RoadmapGraph
          plan={plan}
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
          <div className="flex items-center gap-2">
            <Link
              to="/"
              search={{ kurikulum: answers.kurikulum ?? defaultCurriculumId }}
              className={buttonVariants({
                variant: "neutral",
                mode: "stroke",
                className: "pointer-events-auto",
              })}
            >
              <RiArrowLeftLine className="size-5" aria-hidden="true" />
              {text("Kembali")}
            </Link>
            <AlignTooltip.Provider>
              <AlignTooltip.Root>
                <AlignTooltip.Trigger asChild>
                  <AlignButton.Root
                    variant="neutral"
                    mode="stroke"
                    className="pointer-events-auto size-10 p-2.5"
                    aria-label={text("Coba lagi")}
                    onClick={restart}
                  >
                    <RiRestartLine className="size-5" aria-hidden="true" />
                  </AlignButton.Root>
                </AlignTooltip.Trigger>
                <AlignTooltip.Content size="xsmall" side="bottom">
                  {text("Coba lagi")}
                </AlignTooltip.Content>
              </AlignTooltip.Root>
            </AlignTooltip.Provider>
          </div>
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
        search={
          <div className="flex items-center justify-end gap-2">
            <AlignTooltip.Provider>
              <AlignTooltip.Root>
                <AlignTooltip.Trigger asChild>
                  <AlignButton.Root
                    variant="neutral"
                    mode="stroke"
                    onClick={copyLink}
                    className="max-[650px]:size-10 max-[650px]:p-2.5"
                  >
                    <span className="relative size-5" aria-hidden="true">
                      {[
                        { Icon: RiShareLine, active: share !== "copied" || sharedPlan !== answers },
                        { Icon: RiCheckLine, active: share === "copied" && sharedPlan === answers },
                      ].map(({ Icon, active }, index) => (
                        <m.span
                          key={index}
                          initial={false}
                          className="absolute inset-0"
                          animate={{
                            opacity: active ? 1 : 0,
                            scale: active || reducedMotion ? 1 : 0.25,
                            filter: active || reducedMotion ? "blur(0px)" : "blur(4px)",
                          }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { type: "spring", duration: 0.3, bounce: 0 }
                          }
                        >
                          <Icon className="size-5" />
                        </m.span>
                      ))}
                    </span>
                    <span className="max-[650px]:sr-only">
                      {share === "copied" && sharedPlan === answers
                        ? text("Tautan disalin")
                        : text("Bagikan")}
                    </span>
                  </AlignButton.Root>
                </AlignTooltip.Trigger>
                <AlignTooltip.Content size="xsmall" side="bottom">
                  {share === "copied" && sharedPlan === answers
                    ? text("Tautan disalin")
                    : text("Salin tautan roadmap")}
                </AlignTooltip.Content>
              </AlignTooltip.Root>
            </AlignTooltip.Provider>
          </div>
        }
        viewControl={
          <RoadmapNotes plan={plan} target={answers.lulus} sourceTitle={data.sourceTitle} />
        }
      >
        <RoadmapFilters answers={answers} update={update} />
      </Overlay>
      <span className="sr-only" role="status">
        {share === "copied" && sharedPlan === answers ? text("Tautan roadmap disalin.") : ""}
      </span>
      <AlignModal.Root
        open={share === "manual" && sharedPlan === answers}
        onOpenChange={(open) => {
          if (!open) setShare("idle");
        }}
      >
        <AlignModal.Content>
          <div className="p-5">
            <AlignModal.Title asChild>
              <Typography as="h2" variant="subtitle1" className="pr-8">
                {text("Bagikan roadmap")}
              </Typography>
            </AlignModal.Title>
            <AlignModal.Description asChild>
              <Typography as="p" variant="paragraph" className="mt-2 text-text-sub-600">
                {text("Salin tautan ini untuk membuka rencana yang sama.")}
              </Typography>
            </AlignModal.Description>
            <input
              aria-label={text("Tautan roadmap")}
              readOnly
              value={manualLink}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-4 block w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm"
            />
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
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
