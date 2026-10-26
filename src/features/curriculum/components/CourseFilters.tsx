import { Typography } from "../../../ui/typography";
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
          <AlignSelect.Value>{group === "__all__" ? "Semua mata kuliah" : group}</AlignSelect.Value>
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
        as="label"
        variant="labelSmall"
        className="text-text-sub-600"
        htmlFor="curriculum-version"
      >
        Versi kurikulum
      </Typography>
      <AlignSelect.Root variant="compact" value={curriculum} onValueChange={onChange}>
        <AlignSelect.Trigger
          className="h-9 min-h-9 text-[14px]"
          id="curriculum-version"
          aria-label={`Versi kurikulum: ${curriculum === "2021" ? "2021, Revisi 2023" : "2026"}`}
        >
          <AlignSelect.Value>
            {`Kurikulum ${curriculum === "2021" ? "2021 · Revisi 2023" : "2026"}`}
          </AlignSelect.Value>
        </AlignSelect.Trigger>
        <AlignSelect.Content align="end">
          <AlignSelect.Item value="2021">2021 · Revisi 2023</AlignSelect.Item>
          <AlignSelect.Item value="2026">2026</AlignSelect.Item>
        </AlignSelect.Content>
      </AlignSelect.Root>
    </div>
  );
}
