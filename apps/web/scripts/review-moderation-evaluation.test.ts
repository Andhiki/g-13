import { expect, it } from "bun:test";
import { syntheticModerationCases } from "./review-moderation-evaluation-fixtures";
import {
  classifyWithGroq,
  evaluateSyntheticCases,
  GROQ_ENDPOINT,
  GROQ_MODEL,
  localChecks,
  makeEvaluationRecord,
  summarizeEvaluation,
  type ModelClassification,
} from "./review-moderation-evaluation";

function groqResponse(content: unknown) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
    { status: 200 },
  );
}

it("keeps synthetic held-out cases across languages and moderation edge cases", () => {
  expect(new Set(syntheticModerationCases.map((testCase) => testCase.language))).toEqual(
    new Set(["id", "en", "mixed"]),
  );
  const focus = syntheticModerationCases.flatMap((testCase) => testCase.focus);
  for (const expectedFocus of [
    "wordless-personal-attack",
    "typo",
    "abbreviation",
    "academic-literal-use",
    "reported-speech",
    "ordinary-criticism",
  ]) {
    expect(focus).toContain(expectedFocus);
  }
  expect(syntheticModerationCases.some((testCase) => testCase.chosenName === null)).toBe(true);
  expect(syntheticModerationCases.every((testCase) => testCase.id.length > 0)).toBe(true);
});

it("keeps typo and abbreviation matching narrow and reports each local matcher separately", () => {
  expect(localChecks("Dosen ini goblokk banget.")).toMatchObject({ typo: true, combined: true });
  expect(localChecks("Pak itu gblk.")).toMatchObject({ abbreviation: true, combined: true });
  expect(localChecks("Sistem ini berjalan dengan baik.")).toEqual({
    dictionary: false,
    typo: false,
    abbreviation: false,
    combined: false,
  });
  expect(localChecks("gblki bukan kata yang dicocokkan").abbreviation).toBe(false);
});

it("sends both fields separately in one strict JSON-schema Groq request", async () => {
  let calls = 0;
  const result = await classifyWithGroq(
    { body: "Kamu pengajar yang payah.", displayName: "DosenBobrok" },
    "fake-test-key",
    async (url, init) => {
      calls += 1;
      expect(url).toBe(GROQ_ENDPOINT);
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer fake-test-key");
      const request = JSON.parse(String(init?.body)) as {
        model: string;
        response_format: {
          json_schema: {
            strict: boolean;
            schema: { required: string[]; additionalProperties: boolean };
          };
        };
        messages: { role: string; content: string }[];
      };
      expect(request.model).toBe(GROQ_MODEL);
      expect(request.response_format.json_schema).toMatchObject({
        strict: true,
        schema: { required: ["review", "chosen_name"], additionalProperties: false },
      });
      expect(JSON.parse(request.messages[1]!.content)).toEqual({
        review: "Kamu pengajar yang payah.",
        chosen_display_name: "DosenBobrok",
      });
      return groqResponse({ review: "flag", chosen_name: "flag" });
    },
  );

  expect(calls).toBe(1);
  expect(result).toEqual({ status: "ok", review: "flag", chosenName: "flag" });
});

it("accepts uncertainty as a model decision and null for an absent chosen name", async () => {
  const result = await classifyWithGroq(
    { body: "Review with an ambiguous quotation." },
    "fake-test-key",
    async () => groqResponse({ review: "uncertain", chosen_name: null }),
  );
  expect(result).toEqual({ status: "ok", review: "uncertain", chosenName: null });
});

it("distinguishes request errors from invalid model output without exposing provider content", async () => {
  const failedHttp = await classifyWithGroq(
    { body: "A synthetic review" },
    "fake-test-key",
    async () => new Response("private provider detail", { status: 429 }),
  );
  expect(failedHttp).toEqual({
    status: "request_error",
    review: null,
    chosenName: null,
    errorCode: "http_429",
  });

  const invalidJson = await classifyWithGroq(
    { body: "A synthetic review" },
    "fake-test-key",
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }), {
        status: 200,
      }),
  );
  expect(invalidJson).toEqual({
    status: "validation_error",
    review: null,
    chosenName: null,
    errorCode: "invalid_model_json",
  });

  let calls = 0;
  const missingKey = await classifyWithGroq({ body: "A synthetic review" }, "", async () => {
    calls += 1;
    return groqResponse({ review: "clear", chosen_name: null });
  });
  expect(missingKey.status).toBe("request_error");
  expect(missingKey.errorCode).toBe("missing_api_key");
  expect(calls).toBe(0);
});

it("rejects non-decisions and inconsistent absent-name output", async () => {
  const invalidDecision = await classifyWithGroq(
    { body: "A synthetic review" },
    "fake-test-key",
    async () => groqResponse({ review: "maybe", chosen_name: null }),
  );
  expect(invalidDecision.status).toBe("validation_error");
  expect(invalidDecision.errorCode).toBe("invalid_decision");

  const unexpectedName = await classifyWithGroq(
    { body: "A synthetic review" },
    "fake-test-key",
    async () => groqResponse({ review: "clear", chosen_name: "flag" }),
  );
  expect(unexpectedName.status).toBe("validation_error");
  expect(unexpectedName.errorCode).toBe("name_presence_mismatch");
});

it("runs local synthetic evaluation without a provider request", async () => {
  let calls = 0;
  const records = await evaluateSyntheticCases(syntheticModerationCases, {
    fetcher: async () => {
      calls += 1;
      return groqResponse({ review: "clear", chosen_name: null });
    },
  });
  expect(calls).toBe(0);
  expect(records).toHaveLength(syntheticModerationCases.length);
  expect(records.every((record) => record.modelStatus === "not_run")).toBe(true);
  const summary = summarizeEvaluation(records);
  expect(summary.review.model.notRun).toBe(syntheticModerationCases.length);
  expect(summary.chosenName.model.total).toBe(
    syntheticModerationCases.filter((testCase) => testCase.chosenName).length,
  );
});

it("reports field-level uncertainty separately from request and validation failures", () => {
  const uncertain: ModelClassification = {
    status: "ok",
    review: "uncertain",
    chosenName: "clear",
  };
  const failed: ModelClassification = {
    status: "request_error",
    review: null,
    chosenName: null,
    errorCode: "http_503",
  };
  const records = [
    makeEvaluationRecord(syntheticModerationCases[0]!, uncertain),
    makeEvaluationRecord(syntheticModerationCases[1]!, failed),
    makeEvaluationRecord(syntheticModerationCases[2]!, {
      status: "validation_error",
      review: null,
      chosenName: null,
      errorCode: "invalid_decision",
    }),
  ];
  const summary = summarizeEvaluation(records);
  expect(summary.review.model).toMatchObject({
    uncertain: 1,
    requestErrors: 1,
    validationErrors: 1,
  });
  expect(summary.chosenName.model).toMatchObject({
    requestErrors: 1,
    validationErrors: 1,
  });
});
