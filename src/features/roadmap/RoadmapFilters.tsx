import { Typography } from "../../ui/typography";
import { AlignButton } from "../../ui/button";
import { AlignSelect } from "../../ui/select";
import type { RoadmapSearch } from "./search";

export function RoadmapFilters({
  answers,
  totalCredits,
  update,
  restart,
}: {
  restart: () => void;
  answers: RoadmapSearch;
  totalCredits: number;
  update: (next: RoadmapSearch) => void;
}) {
  return (
    <>
      <Typography as="p" variant="paragraph" className="m-0 text-text-sub-600">
        Kurikulum {answers.kurikulum} · {answers.minat?.replace(/^Lab /, "")} · {totalCredits} SKS
        direncanakan
      </Typography>
      <div className="flex flex-col gap-[5px]">
        <Typography
          as="label"
          variant="labelSmall"
          htmlFor="roadmap-target"
          className="text-text-sub-600"
        >
          Target selesai
        </Typography>
        <AlignSelect.Root
          value={String(answers.lulus)}
          onValueChange={(value) => update({ ...answers, lulus: value === "7" ? 7 : 8 })}
        >
          <AlignSelect.Trigger id="roadmap-target" aria-label="Target selesai">
            <AlignSelect.Value />
          </AlignSelect.Trigger>
          <AlignSelect.Content>
            <AlignSelect.Item value="7">7 semester</AlignSelect.Item>
            <AlignSelect.Item value="8">8 semester</AlignSelect.Item>
          </AlignSelect.Content>
        </AlignSelect.Root>
      </div>
      {answers.iup === "ya" && ["exchange", "internship"].includes(answers.paparan ?? "") && (
        <div className="flex flex-col gap-[5px]">
          <Typography
            as="label"
            variant="labelSmall"
            htmlFor="roadmap-exposure"
            className="text-text-sub-600"
          >
            Semester exposure
          </Typography>
          <AlignSelect.Root
            value={String(answers.semesterPaparan)}
            onValueChange={(value) =>
              update({ ...answers, semesterPaparan: value === "7" ? 7 : 6 })
            }
          >
            <AlignSelect.Trigger id="roadmap-exposure" aria-label="Semester exposure">
              <AlignSelect.Value />
            </AlignSelect.Trigger>
            <AlignSelect.Content>
              <AlignSelect.Item value="6">Semester 6</AlignSelect.Item>
              <AlignSelect.Item value="7">Semester 7</AlignSelect.Item>
            </AlignSelect.Content>
          </AlignSelect.Root>
        </div>
      )}
      <AlignButton.Root
        variant="neutral"
        mode="stroke"
        onClick={() => update({ ...answers, hasil: undefined, langkah: "kurikulum" })}
      >
        Ubah jawaban
      </AlignButton.Root>
      <AlignButton.Root variant="neutral" mode="ghost" onClick={restart}>
        Mulai lagi
      </AlignButton.Root>
    </>
  );
}
