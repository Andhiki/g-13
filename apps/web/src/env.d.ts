/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ALUMNI: Fetcher;
    E2E_FIXTURE_TOKEN?: string;
    REVIEW_CLASSIFICATION_TEST_MODE?: string;
  }
}
