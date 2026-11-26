import { pendingReviewIdSchema } from "../-shared/schemas";

export function readPendingReviewIds(key: string): string[] {
  const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
  if (!Array.isArray(stored)) return [];
  return [
    ...new Set(stored.filter((id): id is string => pendingReviewIdSchema.safeParse(id).success)),
  ];
}

export function writePendingReviewIds(key: string, ids: string[]) {
  if (ids.length) localStorage.setItem(key, JSON.stringify(ids));
  else localStorage.removeItem(key);
}
