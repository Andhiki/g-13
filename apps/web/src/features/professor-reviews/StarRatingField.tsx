// AlignUI Rating appearance with native radio inputs for selection and keyboard support.
// See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
import { useId, useState } from "react";
import { RiStarFill, RiStarLine } from "@remixicon/react";
import { useLocale } from "../../useLocale";

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
  const { text } = useLocale("professors");
  const id = useId();
  const [preview, setPreview] = useState(0);
  return (
    <fieldset aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} className="min-w-0">
      <legend className="text-label-sm">{label}</legend>
      <p id={`${id}-hint`} className="mb-2 mt-1 text-paragraph-xs text-text-sub-600">
        {hint}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex gap-1.5" onPointerLeave={() => setPreview(0)}>
          {[1, 2, 3, 4, 5].map((score) => {
            const Star = score <= (preview || value) ? RiStarFill : RiStarLine;
            return (
              <label
                key={score}
                className="relative flex size-10 cursor-pointer items-center justify-center rounded-10 border border-stroke-soft-200 bg-bg-white-0 transition duration-200 ease-out has-checked:border-primary-base has-checked:bg-primary-alpha-10 hover:border-stroke-strong-950"
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setPreview(score);
                }}
              >
                <input
                  className="peer sr-only"
                  type="radio"
                  name={name}
                  value={score}
                  checked={value === score}
                  required
                  aria-label={text("{{metric}}: {{value}} of 5", { metric: label, value: score })}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : `${id}-hint`}
                  onChange={() => onChange(score)}
                />
                <span className="absolute inset-0 rounded-10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-base" />
                <Star
                  aria-hidden="true"
                  className={`pointer-events-none size-5 ${score <= (preview || value) ? "text-primary-base" : "text-text-sub-600"}`}
                />
              </label>
            );
          })}
        </div>
        <span className="text-paragraph-xs text-text-sub-600" aria-live="polite">
          {value ? `${value}/5` : text("Not rated")}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mb-0 mt-1 text-paragraph-xs text-error-base">
          {error}
        </p>
      )}
    </fieldset>
  );
}
