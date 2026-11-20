import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { cachePolicy } from "./cache-policy";

const cacheHeaders = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  result.response.headers.set("Cache-Control", cachePolicy(request, result.response));
  if (import.meta.env.MODE === "staging") {
    result.response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return result;
});

const csrf = createCsrfMiddleware({ filter: (context) => context.handlerType === "serverFn" });

export const startInstance = createStart(() => ({ requestMiddleware: [cacheHeaders, csrf] }));
