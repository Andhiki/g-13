export type ReviewScreeningResult = "clear" | "flagged" | "unscorable";

export type ReviewScreeningInput = {
  body: string;
  displayName?: string;
};

type ModerationResult = { categories: Record<string, unknown> };
type ModerationFetcher = (input: string, init?: RequestInit) => Promise<Response>;

const scopedCategories = ["harassment", "harassment/threatening", "hate", "hate/threatening"];
const promotion =
  /\b(promo|promotion|discount|diskon|sale|jual beli|jasa|investasi|investment|loan|pinjaman|crypto|cryptocurrency|giveaway|undian|free trial|kursus online|online course|gift card|kartu hadiah)\b/i;
const solicitation =
  /\b(order now|buy now|beli sekarang|pesan sekarang|register now|daftar sekarang|sign up now|shop now|invest now|claim (your|this) (offer|discount|gift|profit)|use (my|our) (code|link)|gunakan kode|limited[ -]time offer|guaranteed returns?|hubungi (kami|saya) untuk (membeli|memesan|mendaftar)|contact (me|us) to (buy|order|register)|dm me (to|for) (buying|purchase|prices|orders|registration)|message me (to|for) (buying|purchase|prices|orders|registration)|join (my|our) (paid|crypto|investment) (group|channel|course)|follow (me|us) for (offers|discounts|promotions))\b/i;
const contactDetails =
  /(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|(?:\+?\d[\d .()-]{7,}\d)/i;

/** Conservative local checks: links or contact details alone never count as spam. */
export function isObviousReviewSpam(text: string): boolean {
  return promotion.test(text) && solicitation.test(text) && contactDetails.test(text);
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
  if (texts.some(isObviousReviewSpam)) return "flagged";
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
