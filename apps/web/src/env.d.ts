/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    LECTURER_REVIEWS_ENABLED?: string;
  }
}
