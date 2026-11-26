import { RiSortDesc } from "@remixicon/react";
import { AlignSelect } from "@/ui/select";
import { useLocale } from "@/useLocale";
import type { LecturerOrder, ReviewOrder } from "../-shared/review-order";

const lecturerOptions: [LecturerOrder, string][] = [
  ["name", "Name A–Z"],
  ["name-desc", "Name Z–A"],
  ["reviews", "Most reviews"],
  ["reviews-asc", "Fewest reviews"],
  ["rating", "Highest rating"],
  ["rating-asc", "Lowest rating"],
];

const reviewOptions: [ReviewOrder, string][] = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["highest", "Highest rating"],
  ["lowest", "Lowest rating"],
];

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
        if (props.kind === "lecturer") {
          const option = lecturerOptions.find(([optionValue]) => optionValue === value);
          if (option) props.onValueChange(option[0]);
          return;
        }
        const option = reviewOptions.find(([optionValue]) => optionValue === value);
        if (option) props.onValueChange(option[0]);
      }}
    >
      <AlignSelect.Trigger
        className="h-9 min-h-9 gap-2"
        aria-label={text(isLecturer ? "Lecturer order" : "Review order")}
      >
        <RiSortDesc aria-hidden="true" className="hidden size-5 sm:block" />
        <AlignSelect.Value />
      </AlignSelect.Trigger>
      <AlignSelect.Content align="end" viewportClassName={isLecturer ? "max-h-60" : undefined}>
        {(isLecturer ? lecturerOptions : reviewOptions).map(([value, label]) => (
          <AlignSelect.Item key={value} value={value}>
            {text(label)}
          </AlignSelect.Item>
        ))}
      </AlignSelect.Content>
    </AlignSelect.Root>
  );
}
