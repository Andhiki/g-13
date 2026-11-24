import { useLocale } from "../../useLocale";
import { Typography } from "../../ui/typography";
import * as SegmentedControl from "../../ui/segmented-control";
import { AlignSelect } from "../../ui/select";
import type { RoadmapSearch } from "./search";

export function RoadmapFilters({
  answers,
  update,
}: {
  answers: RoadmapSearch;
  update: (next: RoadmapSearch) => void;
}) {
  const { text } = useLocale("roadmap");
  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <Typography
          as="p"
          variant="labelSmall"
          id="roadmap-target-label"
          className="m-0 text-text-sub-600"
        >
          {text("Target selesai")}
        </Typography>
        <SegmentedControl.Root
          value={String(answers.lulus)}
          onValueChange={(value) => update({ ...answers, lulus: value === "7" ? 7 : 8 })}
        >
          <SegmentedControl.List aria-labelledby="roadmap-target-label">
            <SegmentedControl.Trigger value="7">{text("7 semester")}</SegmentedControl.Trigger>
            <SegmentedControl.Trigger value="8">{text("8 semester")}</SegmentedControl.Trigger>
          </SegmentedControl.List>
        </SegmentedControl.Root>
      </div>
      {answers.iup === "ya" && ["exchange", "internship"].includes(answers.paparan ?? "") && (
        <div className="flex flex-col gap-[5px]">
          <Typography
            as="label"
            variant="labelSmall"
            htmlFor="roadmap-exposure"
            className="text-text-sub-600"
          >
            {text("Semester exposure")}
          </Typography>
          <AlignSelect.Root
            value={String(answers.semesterPaparan)}
            onValueChange={(value) =>
              update({ ...answers, semesterPaparan: value === "7" ? 7 : 6 })
            }
          >
            <AlignSelect.Trigger id="roadmap-exposure" aria-label={text("Semester exposure")}>
              <AlignSelect.Value />
            </AlignSelect.Trigger>
            <AlignSelect.Content>
              <AlignSelect.Item value="6">{text("Semester 6")}</AlignSelect.Item>
              <AlignSelect.Item value="7">{text("Semester 7")}</AlignSelect.Item>
            </AlignSelect.Content>
          </AlignSelect.Root>
        </div>
      )}
    </>
  );
}
