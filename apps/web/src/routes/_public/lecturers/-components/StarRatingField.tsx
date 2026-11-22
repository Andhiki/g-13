import { Typography } from "@/ui/typography";
import { RiStarFill, RiStarLine } from "@remixicon/react";
import { Rating, RatingItem } from "@ui-sdk/react/rating";
import { useId, useRef } from "react";
import { useLocale } from "@/useLocale";

function scoreFromPointerX(element: HTMLDivElement, clientX: number, fallback: number) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0) return fallback;
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return Math.min(5, Math.max(1, Math.floor(ratio * 5) + 1));
}

function StarRatingInput({
  id,
  name,
  label,
  describedBy,
  value,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  describedBy: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const { text } = useLocale("lecturers");
  const pointerRef = useRef<{
    id: number;
    startX: number;
    captured: boolean;
    dragged: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  return (
    <div
      className="touch-pan-y select-none"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerRef.current = {
          id: event.pointerId,
          startX: event.clientX,
          captured: false,
          dragged: false,
        };
      }}
      onPointerMove={(event) => {
        const active = pointerRef.current;
        if (!active || active.id !== event.pointerId) return;
        if (!active.captured) {
          if (Math.abs(event.clientX - active.startX) < 6) return;
          active.captured = true;
          active.dragged = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const next = scoreFromPointerX(event.currentTarget, event.clientX, value);
        if (next !== value) onChange(next);
      }}
      onPointerUp={(event) => {
        if (pointerRef.current?.id !== event.pointerId) return;
        if (pointerRef.current.dragged) suppressClickRef.current = true;
        pointerRef.current = null;
      }}
      onPointerCancel={() => {
        pointerRef.current = null;
      }}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Rating
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        aria-labelledby={`${id}-label`}
        className="flex"
        getValueLabel={(score) =>
          text("{{metric}}: {{value}} of 5", { metric: label, value: score })
        }
        name={name}
        required
        value={value > 0 ? value : null}
        onValueChange={(next) => onChange(next ?? 0)}
      >
        <RatingItem className="flex size-11 items-center justify-center rounded-10 data-checked:bg-primary-alpha-10 hover:bg-bg-weak-50 [&_[role=radio]:focus-visible]:outline-2 [&_[role=radio]:focus-visible]:outline-offset-2 [&_[role=radio]:focus-visible]:outline-primary-base">
          {({ fill }) =>
            fill > 0 ? (
              <RiStarFill
                aria-hidden="true"
                className="pointer-events-none size-5 text-primary-base"
              />
            ) : (
              <RiStarLine
                aria-hidden="true"
                className="pointer-events-none size-5 text-text-sub-600"
              />
            )
          }
        </RatingItem>
      </Rating>
    </div>
  );
}

function StarRatingControlColumn({
  id,
  name,
  label,
  describedBy,
  value,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  describedBy: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const { text } = useLocale("lecturers");
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRatingInput
          id={id}
          name={name}
          label={label}
          describedBy={describedBy}
          value={value}
          error={error}
          onChange={onChange}
        />
        <Typography as="span" variant="caption" color="muted" aria-live="polite">
          {value ? `${value}/5` : text("Not rated")}
        </Typography>
      </div>
      {error && (
        <Typography
          as="p"
          variant="caption"
          color="danger"
          id={`${id}-error`}
          className="mb-0 mt-1"
        >
          {error}
        </Typography>
      )}
    </div>
  );
}

export function StarRatingField({
  name,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  const id = useId();
  const describedBy = `${id}-hint${error ? ` ${id}-error` : ""}`;

  return (
    <fieldset aria-describedby={describedBy} aria-labelledby={`${id}-label`} className="min-w-0">
      <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
        <div>
          <div id={`${id}-label`}>
            <Typography as="span" variant="label">
              {label}
            </Typography>
          </div>
          <Typography
            as="p"
            variant="caption"
            color="muted"
            id={`${id}-hint`}
            className="mb-0 mt-1"
          >
            {hint}
          </Typography>
        </div>
        <StarRatingControlColumn
          id={id}
          name={name}
          label={label}
          describedBy={describedBy}
          value={value}
          error={error}
          onChange={onChange}
        />
      </div>
    </fieldset>
  );
}
