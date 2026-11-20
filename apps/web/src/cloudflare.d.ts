/// <reference types="@cloudflare/workers-types" />

declare module "cloudflare:workers" {
  export const env: {
    ALUMNI: { fetch: typeof globalThis.fetch };
  };
}
