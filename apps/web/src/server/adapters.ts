import { reviewClientIp } from "@/server/request-identity";
import { verifyTurnstileToken } from "@/routes/_public/lecturers/-server/turnstile";
import {
  createOmniModerationProvider,
  type ReviewModerationProvider,
} from "@/routes/_public/lecturers/-server/review-screening";
import { fetchAlumniPages, strapiToken } from "@/routes/_public/alumni/-server/upstream";
import type { StrapiAlumniResponse } from "@/routes/_public/alumni/-shared/directory";
import { e2eAdapters } from "@/test/adapters";

/** Everything the server reaches outside the Worker, chosen once per build. */
export type ServerAdapters = {
  /** The requester's IP for rate limits, or null when unknown. */
  clientIp(request: Request): string | null;
  /** Fails closed: any verifier error counts as unverified. */
  verifyCaptcha(input: {
    secret: string;
    token: string;
    remoteip?: string | null;
  }): Promise<boolean>;
  reviewModeration(apiKey: string): ReviewModerationProvider;
  alumni: {
    /** The upstream token, or undefined when the directory is not configured. */
    token(): string | undefined;
    fetchPages(token: string): Promise<StrapiAlumniResponse[]>;
    /** Whether the directory page should render its outage state for this request. */
    outage(request: Request): boolean;
  };
};

const productionAdapters: ServerAdapters = {
  clientIp: reviewClientIp,
  verifyCaptcha: verifyTurnstileToken,
  reviewModeration: createOmniModerationProvider,
  alumni: { token: strapiToken, fetchPages: fetchAlumniPages, outage: () => false },
};

// The only place a build mode picks a stand-in. Production builds fold the
// comparison to false and drop the e2e adapters.
export const serverAdapters: ServerAdapters =
  import.meta.env.MODE === "local-e2e" ? e2eAdapters : productionAdapters;
