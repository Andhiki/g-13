import { expect, it } from "bun:test";
import { classifyReviewText, hasReviewContactDetails } from "./review-moderation";

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

it.each([
  "https://example.edu/course",
  "www.example.edu/course",
  "example.com",
  "example.link/path",
  "office@example.edu",
  "081234567890",
  "+62 812 3456 7890",
  "62-812-3456-7890",
  "t.me/channel",
  "wa.me/channel",
  "chat.whatsapp.com/channel",
  "discord.gg/channel",
  "linktr.ee/channel",
  "s.kom.id",
  "s.kom/course",
  "https://s.kom",
])("holds a review body containing %s on its own", (detail) => {
  expect(hasReviewContactDetails({ body: `Contact detail: (${detail}).` })).toBe(true);
});

it.each(["example.org", "office@example.edu", "62-812-3456-7890", "discord.gg/channel"])(
  "holds a review when the chosen display name contains %s",
  (displayName) => {
    expect(hasReviewContactDetails({ body: "The material was clear.", displayName })).toBe(true);
  },
);

it("treats standalone S.Kom. as an academic title in review text and display names", () => {
  expect(
    hasReviewContactDetails({ body: "Pak Budi, S.Kom., menjelaskan materi dengan jelas." }),
  ).toBe(false);
  expect(
    hasReviewContactDetails({ body: "The material was clear.", displayName: "Budi S.Kom" }),
  ).toBe(false);
  expect(
    hasReviewContactDetails({ body: "Pak Budi, S.Kom., shared the notes at example.edu." }),
  ).toBe(true);
});

it("preserves clean criticism with course codes, dates, and decimal grades", () => {
  expect(
    hasReviewContactDetails({
      body: "Penjelasan CS101 tanggal 02-11-2026 kurang jelas. Nilai saya 3.75.",
    }),
  ).toBe(false);
});

it("flags a link in the chosen display name before making a provider request", async () => {
  let calls = 0;
  const result = await classifyReviewText(
    {
      body: "The course materials were useful.",
      displayName: "example.com",
    },
    "test-key",
    async () => {
      calls += 1;
      return moderationResponse(clearCategories, clearCategories);
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
