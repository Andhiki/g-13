import { Typography } from "../../../ui/typography";
import * as SegmentedControl from "../../../ui/segmented-control";
import { listCurricula, type CurriculumId } from "@g13/curriculum";

export function CurriculumVersionFilter({
  curriculum,
  onChange,
}: {
  curriculum: CurriculumId;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[5px]">
      <Typography
        as="p"
        variant="labelSmall"
        className="m-0 text-text-sub-600"
        id="curriculum-version-label"
      >
        Versi kurikulum
      </Typography>
      <SegmentedControl.Root value={curriculum} onValueChange={onChange}>
        <SegmentedControl.List aria-labelledby="curriculum-version-label">
          {listCurricula().map((item) => (
            <SegmentedControl.Trigger key={item.id} value={item.id}>
              {item.id === "2021" ? "2021 (rev. 2023)" : item.id}
            </SegmentedControl.Trigger>
          ))}
        </SegmentedControl.List>
      </SegmentedControl.Root>
    </div>
  );
}
