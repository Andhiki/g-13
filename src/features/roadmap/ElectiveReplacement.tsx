import { useState } from "react";
import { AlignButton } from "../../ui/button";
import { AlignModal } from "../../ui/modal";
import { AlignSelect } from "../../ui/select";
import { creditsFor, requirementText, sourceLocation } from "../curriculum/course-utils";
import type { PlannedCourse, Roadmap } from "./planner";
import { electiveOptions } from "./options";
import type { RoadmapSearch } from "./search";

export function ElectiveReplacement({
  item,
  plan,
  answers,
  replace,
}: {
  item: PlannedCourse;
  plan: Roadmap;
  answers: RoadmapSearch;
  replace: (originalId: string, id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const available = electiveOptions(answers.kurikulum ?? "2026").filter(
    (course) =>
      !plan.courses.some((x) => x.course.id === course.id) &&
      !course.placements.some((p) => p.section === "interest" && p.group === answers.minat),
  );
  const course = available.find((x) => x.id === choice);
  return (
    <AlignModal.Root open={open} onOpenChange={setOpen}>
      <AlignButton.Root
        variant="neutral"
        mode="stroke"
        onClick={() => {
          setChoice("");
          setOpen(true);
        }}
      >
        Ganti mata kuliah pilihan
      </AlignButton.Root>
      <AlignModal.Content>
        <div className="p-5">
          <AlignModal.Title className="pr-8 text-label-lg">
            Ganti mata kuliah pilihan
          </AlignModal.Title>
          <AlignModal.Description className="mb-5 mt-2 text-paragraph-sm text-text-sub-600">
            Menggantikan {item.course.title}. Beban dan prasyarat rencana dihitung ulang.
          </AlignModal.Description>
          <AlignSelect.Root value={choice} onValueChange={setChoice}>
            <AlignSelect.Trigger aria-label="Mata kuliah pengganti">
              <AlignSelect.Value placeholder="Pilih mata kuliah" />
            </AlignSelect.Trigger>
            <AlignSelect.Content>
              {available.map((x) => (
                <AlignSelect.Item key={x.id} value={x.id}>
                  {x.title} · {creditsFor(x)} SKS
                </AlignSelect.Item>
              ))}
            </AlignSelect.Content>
          </AlignSelect.Root>
          {course && (
            <div className="mt-4 text-paragraph-sm">
              <p>
                {course.code} · {creditsFor(course)} SKS
              </p>
              <p>
                Prasyarat: {requirementText(course).join("; ") || "Tidak dinyatakan dalam tabel."}
              </p>
              <p className="text-paragraph-xs text-text-sub-600">
                {sourceLocation(course).join("; ")}
              </p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <AlignButton.Root
              variant="neutral"
              disabled={!course}
              onClick={() => {
                if (course) {
                  replace(item.originalId, course.id);
                  setOpen(false);
                }
              }}
            >
              Gunakan mata kuliah ini
            </AlignButton.Root>
          </div>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
