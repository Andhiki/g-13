import { useEffect, useRef, useState } from "react";

export type AnnouncementCountdownUnit = "day" | "hour" | "minute" | "second";
export type AnnouncementCountdownPart = { unit: AnnouncementCountdownUnit; value: number };

export type AnnouncementCountdownReading =
  | { state: "happening-now" }
  | {
      state: "countdown";
      parts: AnnouncementCountdownPart[];
      summary: AnnouncementCountdownPart | "less-than-minute";
    };

const second = 1_000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

export function resolveAnnouncementCountdown(
  countdownAt: number,
  now: number,
): AnnouncementCountdownReading {
  const remaining = countdownAt - now;
  if (remaining <= 0) return { state: "happening-now" };

  if (remaining >= day) {
    const days = Math.floor(remaining / day);
    const hours = Math.floor((remaining % day) / hour);
    return {
      state: "countdown",
      parts: [
        { unit: "day", value: days },
        ...(hours > 0 ? [{ unit: "hour" as const, value: hours }] : []),
      ],
      summary: { unit: "day", value: days },
    };
  }

  if (remaining >= hour) {
    const hours = Math.floor(remaining / hour);
    const minutes = Math.floor((remaining % hour) / minute);
    return {
      state: "countdown",
      parts: [
        { unit: "hour", value: hours },
        ...(minutes > 0 ? [{ unit: "minute" as const, value: minutes }] : []),
      ],
      summary: { unit: "hour", value: hours },
    };
  }

  if (remaining >= minute) {
    const minutes = Math.floor(remaining / minute);
    const part = { unit: "minute" as const, value: minutes };
    return { state: "countdown", parts: [part], summary: part };
  }

  return {
    state: "countdown",
    parts: [{ unit: "second", value: Math.ceil(remaining / second) }],
    summary: "less-than-minute",
  };
}

export function useAnnouncementClock(targets: readonly (number | null)[]): number | null {
  const targetKey = targets
    .filter((target): target is number => target !== null)
    .sort((left, right) => left - right)
    .join(",");
  const targetsRef = useRef(targets);
  const [now, setNow] = useState<number | null>(null);
  targetsRef.current = targets;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    if (!targetsRef.current.some((target) => target !== null && target > Date.now())) return;

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (!targetsRef.current.some((target) => target !== null && target > current)) {
        window.clearInterval(timer);
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [targetKey]);

  return now;
}

export function AnnouncementCountdown({
  countdownAt,
  now,
  text,
}: {
  countdownAt: number;
  now: number | null;
  text: (key: string) => string;
}) {
  if (now === null) return null;
  const reading = resolveAnnouncementCountdown(countdownAt, now);
  if (reading.state === "happening-now") {
    return <span>{text("Happening now")}</span>;
  }

  const prefix = text("Starts in");
  const summary =
    reading.summary === "less-than-minute"
      ? `${prefix} ${text("less than a minute")}`
      : `${prefix} ${reading.summary.value} ${text(longUnit(reading.summary.unit, reading.summary.value))}`;
  const compactParts = reading.parts.map(({ unit, value }) => `${value}${text(shortUnit(unit))}`);

  return (
    <span className="ml-2 inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className="text-static-white/75">
        {prefix}
      </span>
      <span aria-hidden="true" className="font-semibold tabular-nums">
        {compactParts.join(" ")}
      </span>
      <span className="sr-only">{summary}</span>
    </span>
  );
}

function longUnit(unit: AnnouncementCountdownUnit, value: number): string {
  const singular = value === 1;
  switch (unit) {
    case "day":
      return singular ? "day" : "days";
    case "hour":
      return singular ? "hour" : "hours";
    case "minute":
      return singular ? "minute" : "minutes";
    case "second":
      return singular ? "second" : "seconds";
  }
}

function shortUnit(unit: AnnouncementCountdownUnit): string {
  switch (unit) {
    case "day":
      return "day short";
    case "hour":
      return "hour short";
    case "minute":
      return "minute short";
    case "second":
      return "second short";
  }
}
