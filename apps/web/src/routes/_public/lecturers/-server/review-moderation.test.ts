import { expect, it } from "bun:test";
import { classifyReviewText, containsContactDetails } from "./review-moderation";

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

const campaignSample = `Guys, gue kaget banget hari ini!
Cobain spin gratis iseng-iseng, taunya dapet Rp900.000 — dan udah berhasil gue tarik ke rekening!
Mahjong Ways hari ini lagi gacor-gacornya, sumpah!
Nih gue kasih kode gratisnya: EY5T999
https://pkwgames.link/#/wheelspinevent?invitationCode=JWT067177
Oh iya, follow channel Telegram kami juga ya! Ada kode bonus GRATIS tiap hari, sayang kalau dilewatin!
https://t.me/PwKGames`;

it("holds links and contact details for moderator review", () => {
  expect(containsContactDetails(campaignSample)).toBe(true);
  expect(
    containsContactDetails(
      "Promo jasa kursus online, daftar sekarang di https://wa.me/628123456789",
    ),
  ).toBe(true);
  expect(
    containsContactDetails(
      "The investment material was taught too quickly. Contact +62 812 3456 7890.",
    ),
  ).toBe(true);
  expect(
    containsContactDetails("The lecturer's office-hours link is https://example.edu/office-hours."),
  ).toBe(true);
  expect(containsContactDetails("Useful reading: example.com/course")).toBe(true);
  expect(containsContactDetails("Course notes are on ocw.mit.edu.")).toBe(true);
  expect(containsContactDetails("Join the channel at t.me/PwKGames")).toBe(true);
  expect(containsContactDetails("Email me at student@example.com")).toBe(true);
  expect(containsContactDetails("You can reach the lecturer at 081234567890.")).toBe(true);
  expect(
    containsContactDetails("The lecturer ignored questions. I would not recommend this class."),
  ).toBe(false);
  expect(
    containsContactDetails(
      "The term ran from 2021-2022 and the cohort read about 1.000.000 words.",
    ),
  ).toBe(false);
  expect(containsContactDetails("Pak Budi, S.Kom., explains the material clearly.")).toBe(false);

  expect(containsContactDetails("Contact the lecturer at 62-812-3456-7890.")).toBe(true);
  expect(containsContactDetails("NIM 2023123456789")).toBe(false);
  expect(containsContactDetails("Biayanya Rp100.000.000.000")).toBe(false);
});

it("flags contact details before making a provider request", async () => {
  let calls = 0;
  const result = await classifyReviewText({ body: campaignSample }, "", async () => {
    calls += 1;
    throw new Error("The contact-detail gate should short-circuit the provider call");
  });

  expect(result).toBe("flagged");
  expect(calls).toBe(0);
});

it("holds a display name that contains a link", async () => {
  let calls = 0;
  const result = await classifyReviewText(
    { body: "The course was difficult.", displayName: "https://spam.example" },
    "",
    async () => {
      calls += 1;
      throw new Error("The contact-detail gate should short-circuit the provider call");
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
