import { useLocale } from "@/useLocale";
import { defaultCurriculumId } from "@g13/curriculum";
import { Typography } from "@/ui/typography";
import { useState } from "react";
import { AlignButton } from "@/ui/button";
import { AlignModal } from "@/ui/modal";
import { AlignSelect } from "@/ui/select";
import { creditsFor, requirementText, sourceLocation } from "@/courses/course-utils";
import type { PlannedCourse, Roadmap } from "../-shared/planner";
import { electiveOptions } from "../-shared/options";
import type { RoadmapSearch } from "../-shared/search";

function ReplacementCourseSummary({ course }: { course: PlannedCourse["course"] }) {
  const { text } = useLocale("roadmap");
  const prerequisites = requirementText(course)
    .map((requirement) => text(requirement))
    .join("; ");
  return (
    <div className="mt-4 text-paragraph-sm">
      <Typography as="p" variant="paragraph">
        {course.code} · {creditsFor(course)} {text("SKS")}
      </Typography>
      <Typography as="p" variant="paragraph">
        {text("Prasyarat:")} {prerequisites || text("Tidak dinyatakan dalam tabel.")}
      </Typography>
      <Typography as="p" variant="caption" color="muted">
        {sourceLocation(course, text).join("; ")}
      </Typography>
    </div>
  );
}

function ElectiveReplacementDialogBody({
  item,
  available,
  choice,
  course,
  onChoiceChange,
  onConfirm,
}: {
  item: PlannedCourse;
  available: PlannedCourse["course"][];
  choice: string;
  course?: PlannedCourse["course"];
  onChoiceChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const { text, courseName } = useLocale("roadmap");
  return (
    <div className="p-5">
      <AlignModal.Title asChild className="pr-8">
        <Typography as="h2" variant="subtitle1">
          {text("Ganti mata kuliah pilihan")}
        </Typography>
      </AlignModal.Title>
      <AlignModal.Description asChild>
        <Typography as="p" variant="paragraph" color="muted" className="mb-5 mt-2">
          {text("Menggantikan")} {courseName(item.course)}
          {text(". Beban dan prasyarat rencana dihitung ulang.")}
        </Typography>
      </AlignModal.Description>
      <AlignSelect.Root value={choice} onValueChange={onChoiceChange}>
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
      {course && <ReplacementCourseSummary course={course} />}
      <div className="mt-5 flex justify-end">
        <AlignButton.Root variant="neutral" disabled={!course} onClick={onConfirm}>
          {text("Gunakan mata kuliah ini")}
        </AlignButton.Root>
      </div>
    </div>
  );
}

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
  const { text } = useLocale("roadmap");
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
        <ElectiveReplacementDialogBody
          item={item}
          available={available}
          choice={choice}
          course={course}
          onChoiceChange={setChoice}
          onConfirm={() => {
            if (!course) return;
            replace(item.originalId, course.id);
            setOpen(false);
          }}
        />
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
