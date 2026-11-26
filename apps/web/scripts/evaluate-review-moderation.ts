import { syntheticModerationCases } from "./review-moderation-evaluation-fixtures";
import {
  evaluateSyntheticCases,
  GROQ_MODEL,
  summarizeEvaluation,
} from "./review-moderation-evaluation";

async function main() {
  const args: string[] = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "Usage: bun run evaluate:moderation [--live]\n\nDefault: run local exact, typo, and abbreviation checks only.\n--live: also send the synthetic review and optional chosen name to Groq using GROQ_API_KEY.",
    );
    return;
  }

  const unexpectedArgs = args.filter((argument) => argument !== "--live");
  if (unexpectedArgs.length > 0) {
    console.error(`Unknown argument: ${unexpectedArgs[0]}. Use --help for usage.`);
    process.exitCode = 2;
    return;
  }

  const live = args.includes("--live");
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (live && !apiKey) {
    console.error("Groq evaluation requested, but GROQ_API_KEY is unset. No request was sent.");
    process.exitCode = 2;
    return;
  }

  const records = await evaluateSyntheticCases(syntheticModerationCases, { apiKey });
  const report = {
    model: GROQ_MODEL,
    mode: live ? "synthetic_with_groq" : "synthetic_local_only",
    cases: records,
    summary: summarizeEvaluation(records),
  };
  console.log(JSON.stringify(report, null, 2));

  if (
    records.some(
      (record) =>
        record.modelStatus === "request_error" || record.modelStatus === "validation_error",
    )
  ) {
    process.exitCode = 1;
  }
}

if (import.meta.main) await main();
