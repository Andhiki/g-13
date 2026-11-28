import type { ServerAdapters } from "@/server/adapters";

// Stand-ins for the isolated local-e2e Worker. e2e/fixtures relies on these
// values: the fixed IP keys rate-limit rows, and the review form sends the
// verified or rejected captcha token.
export const e2eClientIp = "192.0.2.60";
export const e2eCaptcha = { secret: "isolated-e2e-verifier", verifiedToken: "e2e-verified" };
export const e2eAlumniOutageHeader = "x-e2e-alumni-failure";

export const e2eAdapters: ServerAdapters = {
  clientIp: () => e2eClientIp,
  verifyCaptcha: async ({ secret, token }) =>
    secret.trim() === e2eCaptcha.secret && token.trim() === e2eCaptcha.verifiedToken,
  reviewModeration: () => async () => "clear",
  alumni: {
    token: () => "isolated-e2e",
    fetchPages: async () => [
      {
        data: [
          { id: 1, name: "Alya Fixture", batch: 2020 },
          { id: 2, name: "Bima Fixture", batch: 2020 },
          { id: 3, name: "Citra Fixture", batch: 2021 },
        ],
        meta: { pagination: { page: 1, pageCount: 1, total: 3 } },
      },
    ],
    outage: (request) => request.headers.get(e2eAlumniOutageHeader) === "1",
  },
};
