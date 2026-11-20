import { RiStarFill } from "@remixicon/react";

const starSize = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
} as const;

export function RatingStars({
  value,
  label,
  size = "md",
}: {
  value: number | null;
  label: string;
  size?: keyof typeof starSize;
}) {
  const dimension = starSize[size];
  return (
    <span role="img" aria-label={label} className="inline-flex shrink-0 gap-0.5 align-middle">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={`relative block ${dimension}`} aria-hidden="true">
          <RiStarFill className="size-full text-text-disabled-300" />
          <span
            className="absolute inset-y-0 left-0 overflow-hidden text-primary-base"
            style={{
              width: `${Math.max(0, Math.min(1, (value ?? 0) - index)) * 100}%`,
            }}
          >
            <RiStarFill className={`${dimension} max-w-none`} />
          </span>
        </span>
      ))}
    </span>
  );
}
