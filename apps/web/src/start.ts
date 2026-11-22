import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { cachePolicy } from "./cache-policy";

const cacheHeaders = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  result.response.headers.set("Cache-Control", cachePolicy(request, result.response));
  if (import.meta.env.MODE === "staging" || import.meta.env.MODE === "staging-e2e") {
    result.response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (import.meta.env.MODE === "staging-e2e") {
    result.response.headers.set("Cache-Control", "no-store");
    result.response.headers.delete("CDN-Cache-Control");
    result.response.headers.set("X-E2E-Revision", import.meta.env.VITE_E2E_REVISION ?? "local");
  }
  return result;
});

const csrf = createCsrfMiddleware({ filter: (context) => context.handlerType === "serverFn" });

export const startInstance = createStart(() => ({ requestMiddleware: [cacheHeaders, csrf] }));
