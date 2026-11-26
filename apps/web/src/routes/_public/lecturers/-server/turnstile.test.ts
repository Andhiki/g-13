import { afterEach, describe, expect, it, mock } from "bun:test";
import { verifyTurnstileToken } from "./turnstile";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>,
) {
  globalThis.fetch = mock(handler) as unknown as typeof fetch;
}

describe("verifyTurnstileToken", () => {
  it("posts the token to Siteverify and returns true on success", async () => {
    const received: { url?: string; body?: FormData } = {};
    stubFetch(async (url, init) => {
      received.url = String(url);
      received.body = init?.body as FormData;
      return Response.json({ success: true });
    });

    const ok = await verifyTurnstileToken({
      secret: "secret-key",
      token: "token-value",
      remoteip: "2001:db8:0:1::7",
    });

    expect(ok).toBe(true);
    expect(received.url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(received.body?.get("secret")).toBe("secret-key");
    expect(received.body?.get("response")).toBe("token-value");
    expect(received.body?.get("remoteip")).toBe("2001:db8:0:1::7");
  });

  it("returns false when Siteverify reports failure", async () => {
    stubFetch(async () =>
      Response.json({ success: false, "error-codes": ["invalid-input-response"] }),
    );
    expect(await verifyTurnstileToken({ secret: "s", token: "t" })).toBe(false);
  });

  it("fails closed on empty secret or token without calling the network", async () => {
    let called = false;
    stubFetch(async () => {
      called = true;
      return Response.json({ success: true });
    });
    expect(await verifyTurnstileToken({ secret: "", token: "t" })).toBe(false);
    expect(await verifyTurnstileToken({ secret: "s", token: "   " })).toBe(false);
    expect(called).toBe(false);
  });

  it("fails closed on a non-ok response or a network error", async () => {
    stubFetch(async () => new Response("nope", { status: 500 }));
    expect(await verifyTurnstileToken({ secret: "s", token: "t" })).toBe(false);

    stubFetch(async () => {
      throw new Error("network down");
    });
    expect(await verifyTurnstileToken({ secret: "s", token: "t" })).toBe(false);
  });

  it("fails closed when the request times out", async () => {
    stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    expect(await verifyTurnstileToken({ secret: "s", token: "t", timeoutMs: 10 })).toBe(false);
  });
});
