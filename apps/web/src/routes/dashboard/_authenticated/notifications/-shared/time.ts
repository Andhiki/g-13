export function formatRelativeTime(ms: number, locale: string, now = Date.now()): string {
  const diffSeconds = Math.round((ms - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const lang = locale === "en" ? "en" : "id";
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

  if (absSeconds < 60) {
    return rtf.format(0, "second");
  }
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "id-ID", {
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

export function formatAbsoluteTime(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}
