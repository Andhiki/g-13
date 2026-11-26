export type ReviewScreeningResult = "clear" | "flagged" | "unscorable";

export type ReviewScreeningInput = {
  body: string;
  displayName?: string;
};

type ModerationResult = { categories: Record<string, unknown> };
type ModerationFetcher = (input: string, init?: RequestInit) => Promise<Response>;

const scopedCategories = ["harassment", "harassment/threatening", "hate", "hate/threatening"];
const urlOrEmail = /(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i;
const bareDomain =
  /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|id|io|co|me|ly|ee|gg|link|site|online|xyz|app|dev|info|biz|tv|cc|ru|cn)\b/i;
const phoneCandidate = /(?:\+\d{1,3}|62|0)[\d\s().-]{7,14}\d/g;

function containsPhoneNumber(text: string): boolean {
  for (const match of text.matchAll(phoneCandidate)) {
    const digits = match[0].replace(/\D/gu, "");
    if (digits.length >= 9 && digits.length <= 16) return true;
  }
  return false;
}

/** Links, email, phone numbers, and messaging channels are held for moderator review. */
export function containsContactDetails(text: string): boolean {
  return urlOrEmail.test(text) || bareDomain.test(text) || containsPhoneNumber(text);
}

function parseModerationResults(value: unknown, expected: number): ModerationResult[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !Array.isArray((value as { results?: unknown }).results)
  )
    return null;
  const results = (value as { results: unknown[] }).results;
  if (results.length !== expected) return null;
  const parsed: ModerationResult[] = [];
  for (const result of results) {
    if (typeof result !== "object" || result === null) return null;
    const categories = (result as { categories?: unknown }).categories;
    if (typeof categories !== "object" || categories === null) return null;
    if (
      !scopedCategories.every(
        (category) => typeof (categories as Record<string, unknown>)[category] === "boolean",
      )
    )
      return null;
    parsed.push({ categories: categories as Record<string, unknown> });
  }
  return parsed;
}

export async function classifyReviewText(
  input: ReviewScreeningInput,
  apiKey: string,
  fetcher: ModerationFetcher = fetch,
): Promise<ReviewScreeningResult> {
  const texts = [input.body, ...(input.displayName ? [input.displayName] : [])];
  if (texts.some(containsContactDetails)) return "flagged";
  if (!apiKey) return "unscorable";

  try {
    const response = await fetcher("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: texts }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return "unscorable";
    const results = parseModerationResults(await response.json(), texts.length);
    if (!results) return "unscorable";
    return results.some((result) =>
      scopedCategories.some((category) => result.categories[category] === true),
    )
      ? "flagged"
      : "clear";
  } catch {
    return "unscorable";
  }
}
