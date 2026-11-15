import { RiSortDesc } from "@remixicon/react";
import { AlignSelect } from "../../../ui/select";
import { useLocale } from "../../../useLocale";
import type { LecturerOrder, ReviewOrder } from "../shared/review-order";

const lecturerOptions = [
  ["name", "Name A–Z"],
  ["review-count", "Most reviews"],
  ["rating", "Highest rating"],
] as const;

const reviewOptions = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["highest", "Highest rating"],
  ["lowest", "Lowest rating"],
] as const;

type Props =
  | { kind: "lecturer"; value: LecturerOrder; onValueChange: (value: LecturerOrder) => void }
  | { kind: "review"; value: ReviewOrder; onValueChange: (value: ReviewOrder) => void };

export function ReviewSortMenu(props: Props) {
  const { text } = useLocale("lecturers");
  const isLecturer = props.kind === "lecturer";
  return (
    <AlignSelect.Root
      variant="compact"
      value={props.value}
      onValueChange={(value) => {
        if (props.kind === "lecturer") props.onValueChange(value as LecturerOrder);
        else props.onValueChange(value as ReviewOrder);
      }}
    >
      <AlignSelect.Trigger
        className="h-9 min-h-9 gap-2"
        aria-label={text(isLecturer ? "Lecturer order" : "Review order")}
      >
        <RiSortDesc aria-hidden="true" className="hidden size-5 sm:block" />
        <AlignSelect.Value>{text("Sort")}</AlignSelect.Value>
      </AlignSelect.Trigger>
      <AlignSelect.Content align="end">
        {(isLecturer ? lecturerOptions : reviewOptions).map(([value, label]) => (
          <AlignSelect.Item key={value} value={value}>
            {text(label)}
          </AlignSelect.Item>
        ))}
      </AlignSelect.Content>
    </AlignSelect.Root>
  );
}
