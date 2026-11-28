import { expect, it } from "bun:test";
import { runEvaluationCli } from "./evaluate-review-moderation";
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

function providerResponse(envelope: unknown) {
  return new Response(JSON.stringify(envelope), { status: 200 });
}

function groqResponse(content: unknown) {
  return providerResponse({ choices: [{ message: { content: JSON.stringify(content) } }] });
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
  expect(result).toEqual({
    status: "ok",
    reviewDecision: "flag",
    chosenNameDecision: "flag",
  });
});

it("accepts uncertainty as a model decision and null for an absent chosen name", async () => {
  const result = await classifyWithGroq(
    { body: "Review with an ambiguous quotation." },
    "fake-test-key",
    async () => groqResponse({ review: "uncertain", chosen_name: null }),
  );
  expect(result).toEqual({
    status: "ok",
    reviewDecision: "uncertain",
    chosenNameDecision: null,
  });
});

it("distinguishes request errors from invalid model output without exposing provider content", async () => {
  const failedHttp = await classifyWithGroq(
    { body: "A synthetic review" },
    "fake-test-key",
    async () => new Response("private provider detail", { status: 429 }),
  );
  expect(failedHttp).toEqual({
    status: "request_error",
    reviewDecision: null,
    chosenNameDecision: null,
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
    reviewDecision: null,
    chosenNameDecision: null,
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
    apiKey: "fake-test-key",
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
    reviewDecision: "uncertain",
    chosenNameDecision: "clear",
  };
  const failed: ModelClassification = {
    status: "request_error",
    reviewDecision: null,
    chosenNameDecision: null,
    errorCode: "http_503",
  };
  const records = [
    makeEvaluationRecord(syntheticModerationCases[0]!, uncertain),
    makeEvaluationRecord(syntheticModerationCases[1]!, failed),
    makeEvaluationRecord(syntheticModerationCases[2]!, {
      status: "validation_error",
      reviewDecision: null,
      chosenNameDecision: null,
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

it("validates malformed provider envelopes and continues with later fixtures", async () => {
  const malformedEnvelopes: [unknown, string][] = [
    [null, "provider_envelope_not_object"],
    [{ choices: "not-an-array" }, "invalid_provider_choices"],
    [{ choices: [] }, "invalid_provider_choices"],
    [{ choices: [null] }, "invalid_provider_choice"],
    [{ choices: [{ message: "unexpected" }] }, "invalid_provider_message"],
    [{ choices: [{ message: {} }] }, "missing_provider_content"],
    [{ choices: [{ message: { content: null } }] }, "invalid_model_content_type"],
  ];

  for (const [envelope, errorCode] of malformedEnvelopes) {
    const result = await classifyWithGroq(
      { body: "A synthetic review" },
      "fake-test-key",
      async () => providerResponse(envelope),
    );
    expect(result.status).toBe("validation_error");
    expect(result.errorCode).toBe(errorCode);
  }

  let calls = 0;
  const records = await evaluateSyntheticCases(syntheticModerationCases.slice(0, 2), {
    runLiveGroq: true,
    apiKey: "fake-test-key",
    fetcher: async () => {
      calls += 1;
      if (calls === 1) {
        return providerResponse({ choices: [{ message: "unexpected" }] });
      }
      return groqResponse({ review: "clear", chosen_name: "clear" });
    },
  });
  expect(calls).toBe(2);
  expect(records[0]?.modelStatus).toBe("validation_error");
  expect(records[0]?.errorCode).toBe("invalid_provider_message");
  expect(records[1]?.modelStatus).toBe("ok");

  const timedOut = await classifyWithGroq(
    { body: "A synthetic review" },
    "fake-test-key",
    async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    },
  );
  expect(timedOut).toEqual({
    status: "request_error",
    reviewDecision: null,
    chosenNameDecision: null,
    errorCode: "timeout",
  });
});

it("computes accuracy, precision, and recall across evaluated records", () => {
  const records = [
    makeEvaluationRecord(syntheticModerationCases[0]!, {
      status: "ok",
      reviewDecision: "flag",
      chosenNameDecision: "clear",
    }),
    makeEvaluationRecord(syntheticModerationCases[1]!, {
      status: "ok",
      reviewDecision: "clear",
      chosenNameDecision: "flag",
    }),
    makeEvaluationRecord(syntheticModerationCases[5]!, {
      status: "ok",
      reviewDecision: "clear",
      chosenNameDecision: "clear",
    }),
  ];
  const summary = summarizeEvaluation(records);
  expect(summary.review.model).toMatchObject({
    evaluated: 3,
    truePositive: 1,
    falsePositive: 0,
    falseNegative: 1,
    trueNegative: 1,
    accuracy: 2 / 3,
    precision: 1,
    recall: 0.5,
  });
  expect(summary.chosenName.model).toMatchObject({
    evaluated: 3,
    truePositive: 0,
    falsePositive: 1,
    falseNegative: 0,
    trueNegative: 2,
    accuracy: 2 / 3,
    precision: 0,
    recall: null,
  });
});

it("keeps CLI offline unless --live is passed even when GROQ_API_KEY is set", async () => {
  let calls = 0;
  let stdoutText = "";
  let stderrText = "";

  const offlineCode = await runEvaluationCli([], {
    apiKey: "should-be-ignored-without-live",
    fetcher: async () => {
      calls += 1;
      return groqResponse({ review: "clear", chosen_name: null });
    },
    stdout: (text) => {
      stdoutText += text;
    },
    stderr: (text) => {
      stderrText += text;
    },
  });

  expect(offlineCode).toBe(0);
  expect(calls).toBe(0);
  expect(stderrText).toBe("");
  const offlineReport = JSON.parse(stdoutText) as {
    mode: string;
    cases: { modelStatus: string }[];
  };
  expect(offlineReport.mode).toBe("synthetic_local_only");
  expect(offlineReport.cases.every((c) => c.modelStatus === "not_run")).toBe(true);

  let liveMissingKeyStderr = "";
  const missingKeyCode = await runEvaluationCli(["--live"], {
    apiKey: "   ",
    stderr: (text) => {
      liveMissingKeyStderr += text;
    },
  });
  expect(missingKeyCode).toBe(2);
  expect(liveMissingKeyStderr).toContain("GROQ_API_KEY is unset");

  let liveStdout = "";
  const liveCode = await runEvaluationCli(["--live"], {
    apiKey: "fake-live-key",
    fetcher: async (_url, init) => {
      const payload = JSON.parse(JSON.parse(String(init?.body)).messages[1].content) as {
        chosen_display_name: string | null;
      };
      return groqResponse({
        review: "clear",
        chosen_name: payload.chosen_display_name === null ? null : "clear",
      });
    },
    stdout: (text) => {
      liveStdout += text;
    },
  });
  expect(liveCode).toBe(0);
  const liveReport = JSON.parse(liveStdout) as { mode: string };
  expect(liveReport.mode).toBe("synthetic_with_groq");
});
