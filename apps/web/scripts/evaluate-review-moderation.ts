import { syntheticModerationCases } from "./review-moderation-evaluation-fixtures";
import {
  evaluateSyntheticCases,
  GROQ_MODEL,
  summarizeEvaluation,
  type GroqFetcher,
} from "./review-moderation-evaluation";

export type CliOptions = {
  apiKey?: string;
  fetcher?: GroqFetcher;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
};

export async function runEvaluationCli(args: string[], options: CliOptions = {}): Promise<number> {
  const stdout = options.stdout ?? console.log;
  const stderr = options.stderr ?? console.error;

  if (args.includes("--help")) {
    stdout(
      "Usage: bun run evaluate:moderation [--live]\n\nDefault: run local exact, typo, and abbreviation checks only.\n--live: also send the synthetic review and optional chosen name to Groq using GROQ_API_KEY.",
    );
    return 0;
  }

  const unexpectedArgs = args.filter((argument) => argument !== "--live");
  if (unexpectedArgs.length > 0) {
    stderr(`Unknown argument: ${unexpectedArgs[0]}. Use --help for usage.`);
    return 2;
  }

  const runLiveGroq = args.includes("--live");
  const apiKey = runLiveGroq ? options.apiKey?.trim() : undefined;
  if (runLiveGroq && !apiKey) {
    stderr("Groq evaluation requested, but GROQ_API_KEY is unset. No request was sent.");
    return 2;
  }

  const records = await evaluateSyntheticCases(syntheticModerationCases, {
    runLiveGroq,
    apiKey,
    fetcher: options.fetcher,
  });
  const report = {
    model: GROQ_MODEL,
    mode: runLiveGroq ? "synthetic_with_groq" : "synthetic_local_only",
    cases: records,
    summary: summarizeEvaluation(records),
  };
  stdout(JSON.stringify(report, null, 2));

  if (
    records.some(
      (record) =>
        record.modelStatus === "request_error" || record.modelStatus === "validation_error",
    )
  ) {
    return 1;
  }

  return 0;
}

if (import.meta.main) {
  const exitCode = await runEvaluationCli(process.argv.slice(2), {
    apiKey: process.env.GROQ_API_KEY,
  });
  if (exitCode !== 0) process.exitCode = exitCode;
}
