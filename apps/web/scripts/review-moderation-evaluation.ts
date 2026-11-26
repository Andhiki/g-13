import { hasReviewProfanity } from "@/routes/_public/lecturers/-server/review-profanity";
import type { SyntheticModerationCase } from "./review-moderation-evaluation-fixtures";

export const GROQ_MODEL = "qwen/qwen3.8-27b";
export const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export type ModerationDecision = "clear" | "flag" | "uncertain";
export type ModelStatus = "ok" | "request_error" | "validation_error" | "not_run";
export type ModerationInput = { body: string; displayName?: string };

export type LocalChecks = {
  dictionary: boolean;
  typo: boolean;
  abbreviation: boolean;
  combined: boolean;
};

export type ModelClassification = {
  status: ModelStatus;
  review: ModerationDecision | null;
  chosenName: ModerationDecision | null;
  errorCode?: string;
};

export type EvaluatedField = {
  text: string;
  expected: "clear" | "flag";
  local: LocalChecks;
  model: ModerationDecision | null;
};

export type EvaluationRecord = {
  id: string;
  language: SyntheticModerationCase["language"];
  focus: string[];
  review: EvaluatedField;
  chosenName: EvaluatedField | null;
  modelStatus: ModelStatus;
  errorCode?: string;
};

type GroqFetcher = (input: string, init?: RequestInit) => Promise<Response>;
type GroqResponse = { choices?: { message?: { content?: unknown } }[] };

const decisions = ["clear", "flag", "uncertain"] as const;

const typoPatterns = [/(?<![\p{L}\p{N}])(?:anjng|anjingg|goblokk)(?![\p{L}\p{N}])/iu];
const abbreviationPatterns = [/(?<![\p{L}\p{N}])(?:gblk|bngst|bgst)(?![\p{L}\p{N}])/iu];

export const MODERATION_SYSTEM_PROMPT = `Classify lecturer-review content for personal abuse, not for disagreement or poor ratings.
Flag a field only when its text directly insults, degrades, threatens, or attacks a person. Ordinary criticism of teaching, grading, course organization, or pace is clear. A quoted personal attack remains flag even when reported as speech. A literal or academic mention of a taboo word is clear when the text is discussing the word rather than using it to attack someone.
Classify the review and chosen display name independently. If chosen_display_name is null, return null for chosen_name.
Return strict JSON with review and chosen_name only. Each present field must be clear, flag, or uncertain.

Examples:
Input: {"review":"Penilaian ini tidak adil dan materinya kurang terstruktur.","chosen_display_name":"Mahasiswa"}
Output: {"review":"clear","chosen_name":"clear"}
Input: {"review":"Kamu pengajar yang payah.","chosen_display_name":"DosenBobrok"}
Output: {"review":"flag","chosen_name":"flag"}
Input: {"review":"Kata 'anjing' muncul dalam kutipan kamus.","chosen_display_name":null}
Output: {"review":"clear","chosen_name":null}`;

const responseSchema = {
  type: "object",
  properties: {
    review: { type: "string", enum: decisions },
    chosen_name: { type: ["string", "null"], enum: [...decisions, null] },
  },
  required: ["review", "chosen_name"],
  additionalProperties: false,
};

export function localChecks(text: string): LocalChecks {
  const dictionary = hasReviewProfanity(text);
  const typo = typoPatterns.some((pattern) => pattern.test(text));
  const abbreviation = abbreviationPatterns.some((pattern) => pattern.test(text));
  return { dictionary, typo, abbreviation, combined: dictionary || typo || abbreviation };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDecision(value: unknown): value is ModerationDecision {
  return decisions.includes(value as ModerationDecision);
}

function invalidModelOutput(content: unknown, errorCode: string): ModelClassification {
  const output = isRecord(content) ? content : {};
  return {
    status: "validation_error",
    review: isDecision(output.review) ? output.review : null,
    chosenName: isDecision(output.chosen_name) ? output.chosen_name : null,
    errorCode,
  };
}

export async function classifyWithGroq(
  input: ModerationInput,
  apiKey: string,
  fetcher: GroqFetcher = fetch,
): Promise<ModelClassification> {
  if (!apiKey.trim()) {
    return {
      status: "request_error",
      review: null,
      chosenName: null,
      errorCode: "missing_api_key",
    };
  }

  let response: Response;
  try {
    response = await fetcher(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        max_completion_tokens: 100,
        messages: [
          { role: "system", content: MODERATION_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              review: input.body,
              chosen_display_name: input.displayName ?? null,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "lecturer_review_moderation", strict: true, schema: responseSchema },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { status: "request_error", review: null, chosenName: null, errorCode: "fetch_failed" };
  }

  if (!response.ok) {
    return {
      status: "request_error",
      review: null,
      chosenName: null,
      errorCode: `http_${response.status}`,
    };
  }

  let envelope: unknown;
  try {
    envelope = await response.json();
  } catch {
    return {
      status: "request_error",
      review: null,
      chosenName: null,
      errorCode: "invalid_provider_json",
    };
  }

  const message = isRecord(envelope) ? (envelope as GroqResponse).choices?.[0]?.message : null;
  if (!message || !("content" in message)) {
    return {
      status: "request_error",
      review: null,
      chosenName: null,
      errorCode: "missing_provider_content",
    };
  }

  let content: unknown;
  try {
    if (typeof message.content !== "string") throw new Error("Model content is not text");
    content = JSON.parse(message.content);
  } catch {
    return invalidModelOutput(null, "invalid_model_json");
  }

  if (!isRecord(content)) return invalidModelOutput(content, "model_output_not_object");
  if (
    Object.keys(content).length !== 2 ||
    !Object.hasOwn(content, "review") ||
    !Object.hasOwn(content, "chosen_name")
  ) {
    return invalidModelOutput(content, "invalid_model_fields");
  }

  const review = content.review;
  const chosenName = content.chosen_name;
  if (!isDecision(review) || (chosenName !== null && !isDecision(chosenName))) {
    return invalidModelOutput(content, "invalid_decision");
  }
  if ((input.displayName === undefined) !== (chosenName === null)) {
    return invalidModelOutput(content, "name_presence_mismatch");
  }

  return { status: "ok", review, chosenName };
}

export function makeEvaluationRecord(
  testCase: SyntheticModerationCase,
  model: ModelClassification,
): EvaluationRecord {
  return {
    id: testCase.id,
    language: testCase.language,
    focus: testCase.focus,
    review: {
      text: testCase.review.text,
      expected: testCase.review.expected,
      local: localChecks(testCase.review.text),
      model: model.review,
    },
    chosenName: testCase.chosenName
      ? {
          text: testCase.chosenName.text,
          expected: testCase.chosenName.expected,
          local: localChecks(testCase.chosenName.text),
          model: model.chosenName,
        }
      : null,
    modelStatus: model.status,
    ...(model.errorCode ? { errorCode: model.errorCode } : {}),
  };
}

type Counts = {
  total: number;
  evaluated: number;
  correct: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  uncertain: number;
  requestErrors: number;
  validationErrors: number;
  notRun: number;
};

function emptyCounts(): Counts {
  return {
    total: 0,
    evaluated: 0,
    correct: 0,
    truePositive: 0,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 0,
    uncertain: 0,
    requestErrors: 0,
    validationErrors: 0,
    notRun: 0,
  };
}

function addPrediction(
  counts: Counts,
  expected: "clear" | "flag",
  predicted: "clear" | "flag" | "uncertain" | null,
  status: ModelStatus,
): void {
  counts.total += 1;
  if (status === "not_run") {
    counts.notRun += 1;
    return;
  }
  if (status === "request_error") {
    counts.requestErrors += 1;
    return;
  }
  if (status === "validation_error") {
    counts.validationErrors += 1;
    return;
  }
  if (predicted === "uncertain") {
    counts.uncertain += 1;
    return;
  }
  if (predicted === null) {
    counts.validationErrors += 1;
    return;
  }

  counts.evaluated += 1;
  const actualFlag = expected === "flag";
  const predictedFlag = predicted === "flag";
  if (actualFlag && predictedFlag) counts.truePositive += 1;
  else if (!actualFlag && predictedFlag) counts.falsePositive += 1;
  else if (actualFlag) counts.falseNegative += 1;
  else counts.trueNegative += 1;
  if (predicted === expected) counts.correct += 1;
}

function metrics(counts: Counts) {
  const precisionDenominator = counts.truePositive + counts.falsePositive;
  const recallDenominator = counts.truePositive + counts.falseNegative;
  return {
    ...counts,
    accuracy: counts.evaluated ? counts.correct / counts.evaluated : null,
    precision: precisionDenominator ? counts.truePositive / precisionDenominator : null,
    recall: recallDenominator ? counts.truePositive / recallDenominator : null,
  };
}

export function summarizeEvaluation(records: EvaluationRecord[]) {
  const sources = ["model", "dictionary", "typo", "abbreviation", "combined"] as const;
  const fields = ["review", "chosenName"] as const;
  const summary = Object.fromEntries(
    fields.map((field) => {
      const counts = Object.fromEntries(sources.map((source) => [source, emptyCounts()])) as Record<
        (typeof sources)[number],
        Counts
      >;
      for (const record of records) {
        const evaluatedField = record[field];
        if (!evaluatedField) continue;
        const target = evaluatedField.expected;
        addPrediction(counts.model, target, evaluatedField.model, record.modelStatus);
        for (const source of ["dictionary", "typo", "abbreviation", "combined"] as const) {
          addPrediction(
            counts[source],
            target,
            evaluatedField.local[source] ? "flag" : "clear",
            "ok",
          );
        }
      }
      return [
        field,
        Object.fromEntries(sources.map((source) => [source, metrics(counts[source])])),
      ];
    }),
  );
  return summary as Record<string, Record<string, ReturnType<typeof metrics>>>;
}

export async function evaluateSyntheticCases(
  cases: SyntheticModerationCase[],
  options: { apiKey?: string; fetcher?: GroqFetcher } = {},
): Promise<EvaluationRecord[]> {
  const hasLiveCredentials = Boolean(options.apiKey?.trim());
  const records: EvaluationRecord[] = [];
  for (const testCase of cases) {
    const model = hasLiveCredentials
      ? await classifyWithGroq(
          {
            body: testCase.review.text,
            ...(testCase.chosenName ? { displayName: testCase.chosenName.text } : {}),
          },
          options.apiKey ?? "",
          options.fetcher,
        )
      : {
          status: "not_run" as const,
          review: null,
          chosenName: null,
        };
    records.push(makeEvaluationRecord(testCase, model));
  }
  return records;
}
