import "@tanstack/react-start/server-only";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type VerifyTurnstileInput = {
  secret: string;
  token: string;
  remoteip?: string | null;
  timeoutMs?: number;
};

type SiteverifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

// Validates a Turnstile token with Cloudflare's Siteverify API. Tokens are
// single-use and expire after 300 seconds, so callers must verify on every
// submission. Any network failure, timeout, or malformed response is treated as
// a failed verification (fail closed) so a broken verifier never lets spam through.
export async function verifyTurnstileToken({
  secret,
  token,
  remoteip,
  timeoutMs = 10_000,
}: VerifyTurnstileInput): Promise<boolean> {
  const trimmedSecret = secret.trim();
  const trimmedToken = token.trim();
  if (!trimmedSecret || !trimmedToken) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new FormData();
    form.append("secret", trimmedSecret);
    form.append("response", trimmedToken);
    if (remoteip) form.append("remoteip", remoteip);

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as SiteverifyResponse;
    return result.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
