export type ReviewScreeningResult = "clear" | "flagged" | "unscorable";

export type ReviewScreeningInput = {
  body: string;
  displayName?: string;
};

type ModerationResult = { categories: Record<string, unknown> };
type ModerationFetcher = (input: string, init?: RequestInit) => Promise<Response>;

const scopedCategories = ["harassment", "harassment/threatening", "hate", "hate/threatening"];
const urlOrEmail = /\b(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i;
const standaloneComputingDegree =
  /(?<![\p{L}\p{N}.-])s\.kom(?![\p{L}\p{N}/?#-]|\.[\p{L}\p{N}]|:\d)/giu;
const bareDomain =
  /(?<![\p{L}\p{N}-])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(?:\p{L}{2,63}|xn--[a-z0-9-]{2,59})(?![\p{L}\p{N}-])/iu;
// Require an Indonesian dialing prefix and enough digits to exclude ordinary dates and grades.
const indonesianPhone =
  /(?<![\p{L}\p{N}])(?:0|\+?62)[ .-]*[2-9](?:[ .()-]*\d){7,11}(?![ .()-]*\d)/u;

export function hasReviewContactDetails({ body, displayName }: ReviewScreeningInput): boolean {
  return [body, displayName ?? ""].some(
    (text) =>
      urlOrEmail.test(text) ||
      bareDomain.test(text.replace(standaloneComputingDegree, " ")) ||
      indonesianPhone.test(text),
  );
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
  if (hasReviewContactDetails(input)) return "flagged";
  if (!apiKey) return "unscorable";

  const texts = [input.body, ...(input.displayName ? [input.displayName] : [])];
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
