import { useCallback, useMemo, useState } from "react";
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
}: {
  answers: RoadmapSearch;
  update: (next: RoadmapSearch) => void;
}) {
  const plan = useMemo(() => buildRoadmap(answers), [answers]);
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
  const exposureControl =
    answers.iup === "ya" && ["exchange", "internship"].includes(answers.paparan ?? "");
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-2 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-semibold tracking-[-0.03em]">Roadmap kuliahmu</h1>
          <p className="mb-0 mt-1 text-paragraph-sm text-text-sub-600">
            Kurikulum {data.id} · {answers.minat?.replace(/^Lab /, "")} · {plan.totalCredits} SKS
            direncanakan
          </p>
        </div>
        <div className="flex gap-2">
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            onClick={() => update({ ...answers, hasil: undefined, langkah: "kurikulum" })}
          >
            Ubah jawaban
          </AlignButton.Root>
          <AlignButton.Root variant="neutral" mode="stroke" onClick={copyLink}>
            Bagikan
          </AlignButton.Root>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3" role="group" aria-label="Target selesai">
          <span className="text-paragraph-sm text-text-sub-600">Target selesai</span>
          {[7, 8].map((term) => (
            <AlignButton.Root
              key={term}
              variant="neutral"
              mode={answers.lulus === term ? "filled" : "ghost"}
              aria-pressed={answers.lulus === term}
              onClick={() => update({ ...answers, lulus: term as 7 | 8 })}
            >
              {term} semester
            </AlignButton.Root>
          ))}
        </div>
        {exposureControl && (
          <div className="flex items-center gap-2" role="group" aria-label="Semester exposure">
            <span className="text-paragraph-sm text-text-sub-600">Exposure</span>
            {[6, 7].map((term) => (
              <AlignButton.Root
                key={term}
                variant="neutral"
                mode={answers.semesterPaparan === term ? "filled" : "ghost"}
                aria-pressed={answers.semesterPaparan === term}
                onClick={() => update({ ...answers, semesterPaparan: term as 6 | 7 })}
              >
                Semester {term}
              </AlignButton.Root>
            ))}
          </div>
        )}
        <span className="text-paragraph-xs text-text-sub-600">
          Geser dan perbesar peta. Pilih mata kuliah untuk detail.
        </span>
      </div>
      <div aria-live="polite" className="text-paragraph-sm">
        {share === "copied" && sharedPlan === answers && (
          <p className="m-0">Tautan roadmap disalin.</p>
        )}
        {share === "manual" && sharedPlan === answers && (
          <label className="block">
            Salin tautan ini
            <input
              aria-label="Tautan roadmap"
              readOnly
              value={manualLink}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 block w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3"
            />
          </label>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="order-1 h-[60dvh] min-h-[480px] flex-1 lg:h-auto">
          <RoadmapGraph
            plan={plan}
            target={answers.lulus}
            selectedId={selectedId}
            choose={choose}
          />
        </div>
        <aside
          className="order-2 shrink-0 space-y-3 lg:w-[300px] lg:overflow-y-auto"
          aria-label="Catatan roadmap"
        >
          <details
            open={plan.conflicts.length > 0}
            className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-4"
          >
            <summary className="cursor-pointer text-label-sm">
              {plan.conflicts.length
                ? `${plan.conflicts.length} hal perlu diperiksa`
                : "Rencana awal tersusun"}
            </summary>
            {answers.lulus === 7 && plan.conflicts.length > 0 && (
              <p className="text-paragraph-sm">
                Bandingkan target 8 semester untuk mencari ruang tambahan. Skenario 8 semester juga
                perlu diperiksa.
              </p>
            )}
            {plan.conflicts.length ? (
              <ul className="mb-0 space-y-3 pl-4 text-paragraph-xs text-text-sub-600">
                {plan.conflicts.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            ) : (
              <p className="mb-0 text-paragraph-xs text-text-sub-600">
                Tidak ada konflik pada pemeriksaan dasar. Ini belum menjamin kelayakan KRS atau
                kelulusan.
              </p>
            )}
          </details>
          <details className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-4">
            <summary className="cursor-pointer text-label-sm">Asumsi dan sumber</summary>
            <p className="text-paragraph-xs text-text-sub-600">
              {data.sourceTitle}. Setiap mata kuliah mengikuti data sumber. Semester panduan bukan
              jadwal penawaran aktual.
            </p>
            <ul className="mb-0 space-y-3 pl-4 text-paragraph-xs text-text-sub-600">
              {plan.notes.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </details>
          <p className="m-0 text-paragraph-xs text-text-sub-600">
            Rekomendasi pilihan dapat diganti lewat detail mata kuliah. Mata kuliah wajib tetap
            disertakan.
          </p>
        </aside>
      </div>
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
    </main>
  );
}
