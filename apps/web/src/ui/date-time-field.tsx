import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCalendarLine, RiCloseLine } from "@remixicon/react";
import { datePattern } from "@ui-sdk/react/date";
import {
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  createDatePickerController,
  DatePicker,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerTrigger,
} from "@ui-sdk/react/date-picker";
import { FieldSet, FieldLegend } from "@ui-sdk/react/field";
import { createTimeInputController, TimeInput, TimeInputSegment } from "@ui-sdk/react/time-input";
import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import { AlignButton } from "@/ui/button";
import {
  EMPTY_DATE_TIME_PARTS,
  resolveDateTimeControlIssue,
  type DateTimeControlIssue,
  type DateTimeParts,
} from "./date-time-value";

export type DateTimeFieldHandle = {
  getIssue: () => DateTimeControlIssue | null;
};

function getEditableTimeSegments(group: HTMLDivElement | null): HTMLInputElement[] {
  return group
    ? Array.from(group.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]'))
    : [];
}

function hasFilledTimeSegment(group: HTMLDivElement | null): boolean {
  return getEditableTimeSegments(group).some((segment) => !("empty" in segment.dataset));
}

function isTimeEditKey(key: string): boolean {
  return (
    key === "Backspace" ||
    key === "Delete" ||
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "PageUp" ||
    key === "PageDown" ||
    key === "Home" ||
    key === "End" ||
    /^\d$/.test(key)
  );
}

const controlClass =
  "flex min-h-9 items-center rounded-10 border border-stroke-soft-200 bg-bg-white-0 text-base text-text-strong-950 focus-within:border-stroke-strong-950 sm:pointer-fine:min-h-8 sm:pointer-fine:text-paragraph-xs";

function DateTimeCalendarContent() {
  return (
    <DatePickerContent
      sideOffset={6}
      collisionPadding={12}
      className="z-[60] w-72 rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-3 shadow-regular-md outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-[presentation=sheet]:w-full data-[presentation=sheet]:rounded-b-none data-[presentation=sheet]:p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <CalendarPrevious
          aria-label="Previous month"
          className="inline-flex size-8 items-center justify-center rounded-lg text-text-sub-600 outline-none hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-stroke-strong-950/35 disabled:pointer-events-none disabled:opacity-40"
        >
          <RiArrowLeftSLine aria-hidden="true" className="size-4" />
        </CalendarPrevious>
        <CalendarHeading className="text-label-sm text-text-strong-950" />
        <CalendarNext
          aria-label="Next month"
          className="inline-flex size-8 items-center justify-center rounded-lg text-text-sub-600 outline-none hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-stroke-strong-950/35 disabled:pointer-events-none disabled:opacity-40"
        >
          <RiArrowRightSLine aria-hidden="true" className="size-4" />
        </CalendarNext>
      </div>
      <CalendarGrid className="w-full border-collapse">
        <CalendarWeekdays>
          {(index) => (
            <CalendarWeekday
              index={index}
              className="pb-1.5 text-center text-label-xs font-normal text-text-sub-600"
            />
          )}
        </CalendarWeekdays>
        <CalendarWeeks>
          {(cell) => (
            <CalendarDay
              value={cell.date}
              className="h-8 w-8 cursor-[var(--interactive-cursor)] rounded-lg text-center text-paragraph-xs text-text-strong-950 outline-none hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-primary-base/55 data-today:ring-1 data-today:ring-inset data-today:ring-primary-base data-selected:bg-primary-base data-selected:text-static-white dark:data-selected:text-static-black data-selected:hover:bg-primary-darker data-outside:text-text-soft-400 data-disabled:pointer-events-none data-disabled:text-text-disabled-300 data-unavailable:text-text-disabled-300"
            />
          )}
        </CalendarWeeks>
      </CalendarGrid>
    </DatePickerContent>
  );
}

export function DateTimeField({
  ref,
  id,
  name,
  label,
  value,
  locale,
  error,
  errorPart = "both",
  disabled = false,
  required = false,
  optional = false,
  onChange,
  onInputActivity,
}: {
  ref?: Ref<DateTimeFieldHandle>;
  id: string;
  name: string;
  label: string;
  value: DateTimeParts;
  locale?: string;
  error?: string;
  errorPart?: "date" | "time" | "both";
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  onChange: (next: DateTimeParts) => void;
  onInputActivity?: () => void;
}) {
  const { language } = useLocale();
  const effectiveLocale = locale ?? language;
  const datePlaceholder = datePattern(effectiveLocale).placeholder;
  const [datePickerController] = useState(createDatePickerController);
  const [timeInputController] = useState(createTimeInputController);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeGroupRef = useRef<HTMLDivElement>(null);
  const [hasDateDraft, setHasDateDraft] = useState(false);
  const [hasTimeDraft, setHasTimeDraft] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      getIssue() {
        const dateInput = dateInputRef.current;
        const segments = getEditableTimeSegments(timeGroupRef.current);
        const filledCount = segments.filter((segment) => !("empty" in segment.dataset)).length;
        const timeGroupInvalid = Boolean(timeGroupRef.current?.hasAttribute("data-invalid"));
        const invalidTimeSegment = segments.find(
          (segment) => segment.validity.customError || segment.hasAttribute("data-invalid"),
        );

        return resolveDateTimeControlIssue({
          dateInvalid: Boolean(
            dateInput && (dateInput.validity.customError || dateInput.hasAttribute("data-invalid")),
          ),
          dateValidationMessage: dateInput?.validationMessage ?? "",
          dateText: dateInput?.value ?? "",
          locale: effectiveLocale,
          timeInvalid: Boolean(timeGroupInvalid || invalidTimeSegment),
          timeValidationMessage: invalidTimeSegment?.validationMessage ?? "",
          hasPartialTime: filledCount > 0 && filledCount < segments.length,
        });
      },
    }),
    [effectiveLocale],
  );

  const hasValue = value.date !== null || value.time !== null || hasDateDraft || hasTimeDraft;
  const dateInvalid = Boolean(error) && errorPart !== "time";
  const timeInvalid = Boolean(error) && errorPart !== "date";
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <FieldSet disabled={disabled} className="min-w-0 disabled:opacity-70">
      <FieldLegend className="mb-1.5 block text-label-xs text-text-strong-950">{label}</FieldLegend>
      <div className="flex flex-wrap items-center gap-2">
        <DatePicker
          presentation="auto"
          locale={effectiveLocale}
          name={name}
          disabled={disabled}
          required={required}
          controller={datePickerController}
          value={value.date}
          onValueChange={(next) => {
            const nextDate = typeof next === "string" ? next : null;
            setHasDateDraft(nextDate !== null);
            if (nextDate === null) {
              timeInputController.clear();
              setHasTimeDraft(false);
            }
            onChange({
              date: nextDate,
              time: nextDate ? (value.time ?? "00:00") : null,
            });
          }}
          className="min-w-0 flex-1"
        >
          <div
            className={`${controlClass} justify-between gap-1 pl-3 pr-1.5 ${dateInvalid ? "border-error-base" : ""} has-[[data-invalid]]:border-error-base`}
          >
            <DatePickerInput
              ref={dateInputRef}
              id={id}
              aria-label={label}
              aria-invalid={dateInvalid ? true : undefined}
              aria-describedby={error ? `${hintId} ${errorId}` : hintId}
              placeholder={datePlaceholder}
              onChange={(event) => {
                setHasDateDraft(event.currentTarget.value.trim().length > 0);
                onInputActivity?.();
              }}
              className="min-w-0 flex-1 bg-transparent py-1 text-base text-text-strong-950 outline-none placeholder:text-text-sub-600 sm:pointer-fine:text-paragraph-xs"
            />
            <DatePickerTrigger
              aria-label={`Open calendar for ${label.toLowerCase()}`}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-sub-600 outline-none hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-stroke-strong-950/35"
            >
              <RiCalendarLine aria-hidden="true" className="size-4" />
            </DatePickerTrigger>
          </div>
          <DatePickerHint id={hintId} className="sr-only" />
          <DateTimeCalendarContent />
        </DatePicker>
        <TimeInput
          ref={timeGroupRef}
          locale={effectiveLocale}
          hourCycle={24}
          disabled={disabled}
          aria-label={`${label} time`}
          aria-invalid={timeInvalid ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          controller={timeInputController}
          value={value.time}
          onValueChange={(nextTime) => {
            setHasTimeDraft(nextTime !== null);
            onChange({ ...value, time: nextTime });
          }}
          onBeforeInputCapture={() => {
            onInputActivity?.();
            queueMicrotask(() => setHasTimeDraft(hasFilledTimeSegment(timeGroupRef.current)));
          }}
          onPasteCapture={() => {
            onInputActivity?.();
            queueMicrotask(() => setHasTimeDraft(hasFilledTimeSegment(timeGroupRef.current)));
          }}
          onKeyDownCapture={(event) => {
            if (!isTimeEditKey(event.key)) return;
            onInputActivity?.();
            queueMicrotask(() => setHasTimeDraft(hasFilledTimeSegment(timeGroupRef.current)));
          }}
          className={`${controlClass} shrink-0 px-2.5 ${timeInvalid ? "border-error-base" : ""}`}
        >
          {({ segments }) =>
            segments.map((segment) => (
              <TimeInputSegment
                key={segment.key}
                segment={segment}
                aria-invalid={segment.editable && timeInvalid ? true : undefined}
                aria-describedby={segment.editable && error ? errorId : undefined}
                className={
                  segment.editable
                    ? "w-[2.4ch] rounded px-0.5 text-center tabular-nums outline-none focus:bg-primary-alpha-10 focus:text-text-strong-950 data-empty:text-text-sub-600 data-[type=dayPeriod]:w-[3.4ch]"
                    : "px-0.5 text-text-sub-600 select-none"
                }
              />
            ))
          }
        </TimeInput>
        {optional && hasValue && (
          <AlignButton.Root
            size="xsmall"
            variant="neutral"
            mode="ghost"
            iconOnly
            disabled={disabled}
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              datePickerController.clear();
              timeInputController.clear();
              setHasDateDraft(false);
              setHasTimeDraft(false);
              onChange(EMPTY_DATE_TIME_PARTS);
              onInputActivity?.();
            }}
          >
            <RiCloseLine aria-hidden="true" className="size-4" />
          </AlignButton.Root>
        )}
      </div>
      {error && (
        <Typography variant="caption" color="danger" id={errorId} className="mt-1.5">
          {error}
        </Typography>
      )}
    </FieldSet>
  );
}
