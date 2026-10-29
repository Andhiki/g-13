import { useLocale } from "../../useLocale";
import { defaultCurriculumId } from "@g13/curriculum";
import { Typography } from "../../ui/typography";
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
  const { text, courseName } = useLocale("roadmap");
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const available = electiveOptions(answers.kurikulum ?? defaultCurriculumId).filter(
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
        {text("Ganti mata kuliah pilihan")}
      </AlignButton.Root>
      <AlignModal.Content>
        <div className="p-5">
          <AlignModal.Title asChild>
            <Typography as="h2" variant="subtitle1" className="pr-8">
              {text("Ganti mata kuliah pilihan")}
            </Typography>
          </AlignModal.Title>
          <AlignModal.Description asChild>
            <Typography as="p" variant="paragraph" className="mb-5 mt-2 text-text-sub-600">
              {text("Menggantikan")} {courseName(item.course)}
              {text(". Beban dan prasyarat rencana dihitung ulang.")}
            </Typography>
          </AlignModal.Description>
          <AlignSelect.Root value={choice} onValueChange={setChoice}>
            <AlignSelect.Trigger aria-label={text("Mata kuliah pengganti")}>
              <AlignSelect.Value placeholder={text("Pilih mata kuliah")} />
            </AlignSelect.Trigger>
            <AlignSelect.Content>
              {available.map((x) => (
                <AlignSelect.Item key={x.id} value={x.id}>
                  {courseName(x)} · {creditsFor(x)} {text("SKS")}
                </AlignSelect.Item>
              ))}
            </AlignSelect.Content>
          </AlignSelect.Root>
          {course && (
            <div className="mt-4 text-paragraph-sm">
              <Typography as="p" variant="paragraph">
                {course.code} · {creditsFor(course)} {text("SKS")}
              </Typography>
              <Typography as="p" variant="paragraph">
                {text("Prasyarat:")}{" "}
                {requirementText(course)
                  .map((requirement) => text(requirement))
                  .join("; ") || text("Tidak dinyatakan dalam tabel.")}
              </Typography>
              <Typography as="p" variant="caption" className="text-text-sub-600">
                {sourceLocation(course, text).join("; ")}
              </Typography>
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
              {text("Gunakan mata kuliah ini")}
            </AlignButton.Root>
          </div>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
