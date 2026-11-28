import { z } from "zod";

export const adminSearchMaxLength = 512;
export const adminPageSchema = z.object({
  offset: z.number().int().min(0),
  query: z.string().trim().max(adminSearchMaxLength).optional(),
});

/** URL search for dashboard lists; `q` holds the committed (debounced) search. */
export const adminListSearchSchema = z.object({
  q: z.string().trim().max(adminSearchMaxLength).optional().catch(undefined),
});

export type AdminSearchSegment = { text: string; match: boolean };

// Mirrors SQLite's lower(): ASCII-only folding keeps highlights in step with
// the server's instr(lower(...)) match and preserves string length.
function foldAscii(value: string) {
  return value.replace(/[A-Z]/g, (char) => char.toLowerCase());
}

export function adminSearchSegments(text: string, needle: string): AdminSearchSegment[] {
  const target = foldAscii(needle.trim());
  if (!text) return [];
  if (!target) return [{ text, match: false }];
  const haystack = foldAscii(text);
  const segments: AdminSearchSegment[] = [];
  let cursor = 0;
  for (let at = haystack.indexOf(target); at !== -1; at = haystack.indexOf(target, cursor)) {
    if (at > cursor) segments.push({ text: text.slice(cursor, at), match: false });
    cursor = at + target.length;
    segments.push({ text: text.slice(at, cursor), match: true });
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments;
}
