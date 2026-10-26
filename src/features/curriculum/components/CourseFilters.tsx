import { Typography } from "../../../ui/typography";
import * as SegmentedControl from "../../../ui/segmented-control";
import { AlignSelect } from "../../../ui/select";
import type { Curriculum, CurriculumId } from "../../../data";

export function ChoiceGroupFilter({
  data,
  group,
  onChange,
}: {
  data: Curriculum;
  group: string;
  onChange: (group: string) => void;
}) {
  return (
    <div className="relative flex min-w-0 flex-col gap-[5px]">
      <Typography
        as="label"
        variant="labelSmall"
        className="text-text-sub-600"
        htmlFor="course-group"
      >
        Kelompok pilihan
      </Typography>
      <AlignSelect.Root value={group} onValueChange={onChange}>
        <AlignSelect.Trigger
          className="h-9 min-h-9 text-[14px]"
          id="course-group"
          aria-label={`Kelompok pilihan: ${group === "__all__" ? "Semua mata kuliah" : group}`}
        >
          <span className="min-w-0 flex-1 truncate">
            <AlignSelect.Value>
              {group === "__all__" ? "Semua mata kuliah" : group}
            </AlignSelect.Value>
          </span>
        </AlignSelect.Trigger>
        <AlignSelect.Content align="end">
          <AlignSelect.Item value="__all__">Semua mata kuliah</AlignSelect.Item>
          {data.groups.map((item) => (
            <AlignSelect.Item value={item.name} key={item.name}>
              {item.name} ({item.count})
            </AlignSelect.Item>
          ))}
        </AlignSelect.Content>
      </AlignSelect.Root>
    </div>
  );
}

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
          <SegmentedControl.Trigger value="2021">2021 Revisi 2023</SegmentedControl.Trigger>
          <SegmentedControl.Trigger value="2026">2026</SegmentedControl.Trigger>
        </SegmentedControl.List>
      </SegmentedControl.Root>
    </div>
  );
}
