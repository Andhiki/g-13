import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import * as SegmentedControl from "@/ui/segmented-control";
import { listCurricula, type CurriculumId } from "@g13/curriculum";

export function CurriculumVersionFilter({
  curriculum,
  onChange,
}: {
  curriculum: CurriculumId;
  onChange: (value: string) => void;
}) {
  const { text } = useLocale();
  return (
    <div className="flex min-w-0 flex-col gap-[5px]">
      <Typography
        as="p"
        variant="labelSmall"
        color="muted"
        className="m-0"
        id="curriculum-version-label"
      >
        {text("Versi kurikulum")}
      </Typography>
      <SegmentedControl.Root
        value={curriculum}
        onValueChange={(value) => {
          if (value !== null) onChange(value);
        }}
        aria-labelledby="curriculum-version-label"
      >
        <SegmentedControl.Indicator />
        {listCurricula().map((item) => (
          <SegmentedControl.Item key={item.id} value={item.id}>
            {item.id === "2021" ? text("2021 (rev. 2023)") : item.id}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl.Root>
    </div>
  );
}
