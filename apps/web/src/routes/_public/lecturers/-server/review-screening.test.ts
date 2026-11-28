import { expect, it } from "bun:test";
import { createOmniModerationProvider, screenReviewText } from "./review-screening";

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
])("holds a review body containing %s on its own", async (detail) => {
  let providerCalls = 0;
  expect(
    await screenReviewText({ body: `Contact detail: (${detail}).` }, async () => {
      providerCalls += 1;
      return "clear";
    }),
  ).toBe("flagged");
  expect(providerCalls).toBe(0);
});

it.each(["example.org", "office@example.edu", "62-812-3456-7890", "discord.gg/channel"])(
  "holds a review when the chosen display name contains %s",
  async (displayName) => {
    expect(
      await screenReviewText({ body: "The material was clear.", displayName }, async () => "clear"),
    ).toBe("flagged");
  },
);

it("treats standalone S.Kom. as an academic title in review text and display names", async () => {
  expect(
    await screenReviewText(
      { body: "Pak Budi, S.Kom., menjelaskan materi dengan jelas." },
      async () => "clear",
    ),
  ).toBe("clear");
  expect(
    await screenReviewText(
      { body: "The material was clear.", displayName: "Budi S.Kom" },
      async () => "clear",
    ),
  ).toBe("clear");
  expect(
    await screenReviewText(
      { body: "Pak Budi, S.Kom., shared the notes at example.edu." },
      async () => "clear",
    ),
  ).toBe("flagged");
});

it("preserves clean criticism with course codes, dates, and decimal grades", async () => {
  expect(
    await screenReviewText(
      { body: "Penjelasan CS101 tanggal 02-11-2026 kurang jelas. Nilai saya 3.75." },
      async () => "clear",
    ),
  ).toBe("clear");
});

it("flags a link in the chosen display name before making a provider request", async () => {
  let calls = 0;
  const result = await screenReviewText(
    {
      body: "The course materials were useful.",
      displayName: "example.com",
    },
    createOmniModerationProvider("test-key", async () => {
      calls += 1;
      return moderationResponse(clearCategories, clearCategories);
    }),
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
  expect(
    await screenReviewText(
      { body: "The course was difficult." },
      createOmniModerationProvider("test-key", fetcher),
    ),
  ).toBe("clear");
  const request: unknown = JSON.parse(String(calls[0]?.body));
  expect(request).toEqual({
    model: "omni-moderation-latest",
    input: ["The course was difficult."],
  });

  const bodyFlaggedFetcher: ModerationFetcher = async () =>
    moderationResponse({ ...clearCategories, harassment: true }, clearCategories);
  expect(
    await screenReviewText(
      { body: "A challenging class.", displayName: "Chosen Name" },
      createOmniModerationProvider("test-key", bodyFlaggedFetcher),
    ),
  ).toBe("flagged");

  const flaggedFetcher: ModerationFetcher = async () =>
    moderationResponse(clearCategories, { ...clearCategories, hate: true });
  expect(
    await screenReviewText(
      { body: "Helpful course notes.", displayName: "Chosen Name" },
      createOmniModerationProvider("test-key", flaggedFetcher),
    ),
  ).toBe("flagged");
});

it("returns unscorable for missing credentials, provider errors, and malformed responses", async () => {
  let calls = 0;
  const fetcher: ModerationFetcher = async () => {
    calls += 1;
    return new Response("{}", { status: 200 });
  };
  expect(await createOmniModerationProvider("", fetcher)({ body: "A review" })).toBe("unscorable");
  expect(calls).toBe(0);
  expect(await createOmniModerationProvider("test-key", fetcher)({ body: "A review" })).toBe(
    "unscorable",
  );
  expect(
    await createOmniModerationProvider(
      "test-key",
      async () => new Response("", { status: 503 }),
    )({
      body: "A review",
    }),
  ).toBe("unscorable");
  expect(
    await createOmniModerationProvider("test-key", async () => {
      throw new Error();
    })({ body: "A review" }),
  ).toBe("unscorable");
});

it("runs profanity screening after a clear provider result", async () => {
  expect(
    await screenReviewText({ body: "This lecturer is a fucking idiot." }, async () => "clear"),
  ).toBe("flagged");
});

it("maps a provider exception to unscorable", async () => {
  expect(
    await screenReviewText({ body: "A review without profanity." }, async () => {
      throw new Error("provider unavailable");
    }),
  ).toBe("unscorable");
});
