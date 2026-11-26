import englishEntries from "@dsojevic/profanity-list/en.json";

// Bun unwraps the CommonJS default inside this version's ESM wrapper.
const indonesian: typeof import("indonesian-badwords") = require("indonesian-badwords");

const englishWords = englishEntries
  .filter((entry) => entry.tags?.includes("general") && entry.severity >= 2)
  // An asterisk permits repeats of the previous letter. Keep the literal spellings.
  .flatMap((entry) => entry.match.replaceAll("*", "").split("|"));

const profanity = new indonesian.Badwords({
  dictionary: [...indonesian.dictionary, ...englishWords],
  mode: "word",
});

export function hasReviewProfanity(text: string): boolean {
  return profanity.flag(text);
}
