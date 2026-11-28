import englishEntries from "@dsojevic/profanity-list/en.json";

export type ReviewScreeningResult = "clear" | "flagged" | "unscorable";

export type ReviewScreeningInput = {
  body: string;
  displayName?: string;
};

export type ReviewModerationProvider = (
  input: ReviewScreeningInput,
) => Promise<ReviewScreeningResult>;

type ModerationResult = { categories: Record<string, unknown> };
type ModerationFetcher = (input: string, init?: RequestInit) => Promise<Response>;

const scopedCategories = ["harassment", "harassment/threatening", "hate", "hate/threatening"];
const urlOrEmail = /\b(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i;
const standaloneComputingDegree =
  /(?<![\p{L}\p{N}.-])s\.kom(?![\p{L}\p{N}/?#-]|\.[\p{L}\p{N}]|:\d)/giu;
const bareDomain =
  /(?<![\p{L}\p{N}-])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(?:\p{L}{2,63}|xn--[a-z0-9-]{2,59})(?![\p{L}\p{N}-])/iu;
const indonesianPhone =
  /(?<![\p{L}\p{N}])(?:0|\+?62)[ .-]*[2-9](?:[ .()-]*\d){7,11}(?![ .()-]*\d)/u;

const englishWords = englishEntries
  .filter((entry) => entry.tags?.includes("general") && entry.severity >= 2)
  .flatMap((entry) => entry.match.replaceAll("*", "").split("|"));

const indonesian: typeof import("indonesian-badwords") = require("indonesian-badwords");
const profanity = new indonesian.Badwords({
  dictionary: [...indonesian.dictionary, ...englishWords],
  mode: "word",
});

function hasContactDetails({ body, displayName }: ReviewScreeningInput): boolean {
  return [body, displayName ?? ""].some(
    (text) =>
      urlOrEmail.test(text) ||
      bareDomain.test(text.replace(standaloneComputingDegree, " ")) ||
      indonesianPhone.test(text),
  );
}

function hasProfanity({ body, displayName }: ReviewScreeningInput): boolean {
  return [body, displayName ?? ""].some((text) => profanity.flag(text));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModerationResults(value: unknown, expected: number): ModerationResult[] | null {
  if (!isRecord(value) || !Array.isArray(value.results) || value.results.length !== expected) {
    return null;
  }

  const parsed: ModerationResult[] = [];
  for (const result of value.results) {
    if (!isRecord(result)) return null;
    const { categories } = result;
    if (!isRecord(categories)) return null;
    if (!scopedCategories.every((category) => typeof categories[category] === "boolean")) {
      return null;
    }
    parsed.push({ categories });
  }
  return parsed;
}

export function createOmniModerationProvider(
  apiKey: string,
  fetcher: ModerationFetcher = fetch,
): ReviewModerationProvider {
  return async ({ body, displayName }) => {
    if (!apiKey) return "unscorable";

    const texts = [body, ...(displayName ? [displayName] : [])];
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
  };
}

export async function screenReviewText(
  input: ReviewScreeningInput,
  provider: ReviewModerationProvider,
): Promise<ReviewScreeningResult> {
  if (hasContactDetails(input)) return "flagged";

  let moderation: ReviewScreeningResult;
  try {
    moderation = await provider(input);
  } catch {
    return "unscorable";
  }

  if (moderation !== "clear") return moderation;
  return hasProfanity(input) ? "flagged" : "clear";
}
