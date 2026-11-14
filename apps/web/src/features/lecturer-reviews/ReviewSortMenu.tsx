import { RiArrowDownSLine, RiSortDesc } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { AlignDropdown } from "../../ui/dropdown";
import { Typography } from "../../ui/typography";
import { useLocale } from "../../useLocale";
import type { LecturerOrder, ReviewOrder } from "./review-order";

export function ReviewSortMenu({
  lecturerOrder,
  reviewOrder,
  onLecturerOrder,
  onReviewOrder,
}: {
  lecturerOrder?: LecturerOrder;
  reviewOrder?: ReviewOrder;
  onLecturerOrder?: (order: LecturerOrder) => void;
  onReviewOrder?: (order: ReviewOrder) => void;
}) {
  const { text } = useLocale("lecturers");
  return (
    <AlignDropdown.Root>
      <AlignDropdown.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          className="min-h-11 shrink-0 gap-2"
          aria-label={text(lecturerOrder ? "Sort lecturers and reviews" : "Sort reviews")}
        >
          <RiSortDesc aria-hidden="true" className="size-5" />
          <span className="hidden sm:inline">{text("Sort")}</span>
          <RiArrowDownSLine aria-hidden="true" className="hidden size-4 sm:block" />
        </AlignButton.Root>
      </AlignDropdown.Trigger>
      <AlignDropdown.Content
        align="end"
        className="w-64 max-w-[calc(100vw-2rem)] motion-reduce:animate-none"
      >
        {lecturerOrder && onLecturerOrder && (
          <>
            <Typography
              as="p"
              variant="labelSmall"
              id="lecturer-order-label"
              className="mb-1 mt-1 px-2 text-text-sub-600"
            >
              {text("Lecturer order")}
            </Typography>
            <AlignDropdown.RadioGroup
              aria-labelledby="lecturer-order-label"
              value={lecturerOrder}
              onValueChange={(value) => onLecturerOrder(value as LecturerOrder)}
            >
              {(
                [
                  ["name", "Name A–Z"],
                  ["review-count", "Most reviews"],
                  ["rating", "Highest rating"],
                ] as const
              ).map(([value, label]) => (
                <AlignDropdown.RadioItem
                  key={value}
                  value={value}
                  className="min-h-11"
                  onSelect={(event) => event.preventDefault()}
                >
                  {text(label)}
                </AlignDropdown.RadioItem>
              ))}
            </AlignDropdown.RadioGroup>
          </>
        )}
        {reviewOrder && onReviewOrder && (
          <>
            <Typography
              as="p"
              variant="labelSmall"
              id="review-order-label"
              className={`mb-1 px-2 text-text-sub-600 ${lecturerOrder ? "mt-3" : "mt-1"}`}
            >
              {text("Review order")}
            </Typography>
            <AlignDropdown.RadioGroup
              aria-labelledby="review-order-label"
              value={reviewOrder}
              onValueChange={(value) => onReviewOrder(value as ReviewOrder)}
            >
              {(
                [
                  ["newest", "Newest first"],
                  ["oldest", "Oldest first"],
                  ["highest", "Highest rating"],
                  ["lowest", "Lowest rating"],
                ] as const
              ).map(([value, label]) => (
                <AlignDropdown.RadioItem
                  key={value}
                  value={value}
                  className="min-h-11"
                  onSelect={(event) => event.preventDefault()}
                >
                  {text(label)}
                </AlignDropdown.RadioItem>
              ))}
            </AlignDropdown.RadioGroup>
          </>
        )}
      </AlignDropdown.Content>
    </AlignDropdown.Root>
  );
}
