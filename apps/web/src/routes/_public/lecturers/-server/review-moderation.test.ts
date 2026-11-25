import { expect, it } from "bun:test";
import { classifyReviewText, isObviousReviewSpam } from "./review-moderation";

type ModerationFetcher = (input: string, init?: RequestInit) => Promise<Response>;

const clearCategories = {
  harassment: false,
  "harassment/threatening": false,
  hate: false,
  "hate/threatening": false,
};

function moderationResponse(...categories: Record<string, unknown>[]) {
  return new Response(
    JSON.stringify({ results: categories.map((value) => ({ flagged: true, categories: value })) }),
    { status: 200 },
  );
}

it("flags explicit spam promotion while preserving criticism with contact details", () => {
  expect(
    isObviousReviewSpam(
      "Promo jasa kursus online, daftar sekarang di https://wa.me/628123456789",
    ),
  ).toBe(true);
  expect(
    isObviousReviewSpam("The lecturer ignored questions. I would not recommend this class."),
  ).toBe(false);
  expect(
    isObviousReviewSpam(
      "The investment material was taught too quickly. Contact the lecturer on WhatsApp at +62 812 3456 7890.",
    ),
  ).toBe(false);
  expect(
    isObviousReviewSpam(
      "Materi investasi dijelaskan terlalu cepat. Hubungi dosen lewat WhatsApp di +62 812 3456 7890.",
    ),
  ).toBe(false);
  expect(isObviousReviewSpam("Useful reading: https://example.com/course")).toBe(false);
  expect(isObviousReviewSpam("You can reach the lecturer at 081234567890.")).toBe(false);
});

it("flags obvious local spam before making a provider request", async () => {
  let calls = 0;
  const result = await classifyReviewText(
    {
      body: "Promo jasa kursus online, daftar sekarang di https://wa.me/628123456789",
    },
    "",
    async () => {
      calls += 1;
      throw new Error("The local spam rule should short-circuit the provider call");
    },
  );

  expect(result).toBe("flagged");
  expect(calls).toBe(0);
});

it("ignores unrelated Omni flags and reports only harassment or hate category flags", async () => {
  const calls: RequestInit[] = [];
  const fetcher: ModerationFetcher = async (_input, init) => {
    calls.push(init ?? {});
    return moderationResponse({
      ...clearCategories,
      violence: true,
      "self-harm": true,
    });
  };
  expect(await classifyReviewText({ body: "The course was difficult." }, "test-key", fetcher)).toBe(
    "clear",
  );
  const request = JSON.parse(String(calls[0]?.body)) as { model: string; input: string[] };
  expect(request).toEqual({
    model: "omni-moderation-latest",
    input: ["The course was difficult."],
  });

  const bodyFlaggedFetcher: ModerationFetcher = async () =>
    moderationResponse({ ...clearCategories, harassment: true }, clearCategories);
  expect(
    await classifyReviewText(
      { body: "A challenging class.", displayName: "Chosen Name" },
      "test-key",
      bodyFlaggedFetcher,
    ),
  ).toBe("flagged");

  const flaggedFetcher: ModerationFetcher = async () =>
    moderationResponse(clearCategories, { ...clearCategories, hate: true });
  expect(
    await classifyReviewText(
      { body: "Helpful course notes.", displayName: "Chosen Name" },
      "test-key",
      flaggedFetcher,
    ),
  ).toBe("flagged");
});

it("returns unscorable for missing credentials, provider errors, and malformed responses", async () => {
  let calls = 0;
  const fetcher: ModerationFetcher = async () => {
    calls += 1;
    return new Response("{}", { status: 200 });
  };
  expect(await classifyReviewText({ body: "A review" }, "", fetcher)).toBe("unscorable");
  expect(calls).toBe(0);
  expect(await classifyReviewText({ body: "A review" }, "test-key", fetcher)).toBe("unscorable");
  expect(
    await classifyReviewText(
      { body: "A review" },
      "test-key",
      async () => new Response("", { status: 503 }),
    ),
  ).toBe("unscorable");
  expect(
    await classifyReviewText({ body: "A review" }, "test-key", async () => {
      throw new Error();
    }),
  ).toBe("unscorable");
});
