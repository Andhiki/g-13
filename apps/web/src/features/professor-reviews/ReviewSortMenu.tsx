import { RiArrowDownSLine, RiSortDesc } from "@remixicon/react";
import { AlignDropdown } from "../../ui/dropdown";
import { AlignButton } from "../../ui/button";
import { useLocale } from "../../useLocale";
import type { ProfessorOrder, ReviewOrder } from "./review-order";

export function ReviewSortMenu({
  professorOrder,
  reviewOrder,
  onProfessorOrder,
  onReviewOrder,
}: {
  professorOrder: ProfessorOrder;
  reviewOrder: ReviewOrder;
  onProfessorOrder: (order: ProfessorOrder) => void;
  onReviewOrder: (order: ReviewOrder) => void;
}) {
  const { text } = useLocale("professors");
  return (
    <AlignDropdown.Root>
      <AlignDropdown.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          className="min-h-11 shrink-0 gap-2"
          aria-label={text("Sort professors and reviews")}
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
        <p id="professor-order-label" className="mb-1 mt-1 px-2 text-label-xs text-text-sub-600">
          {text("Professor order")}
        </p>
        <AlignDropdown.RadioGroup
          aria-labelledby="professor-order-label"
          value={professorOrder}
          onValueChange={(value) => onProfessorOrder(value as ProfessorOrder)}
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
        <p id="review-order-label" className="mb-1 mt-3 px-2 text-label-xs text-text-sub-600">
          {text("Review order")}
        </p>
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
      </AlignDropdown.Content>
    </AlignDropdown.Root>
  );
}
