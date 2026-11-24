import { createFileRoute } from "@tanstack/react-router";
import { requestAuth, requestAuthConfig } from "@/server/auth";
import { finalizeAuthResponse, prepareAuthRequest } from "@/server/auth-request";

async function handleAuthRequest(request: Request) {
  const config = requestAuthConfig();
  const prepared = prepareAuthRequest(request, config.BETTER_AUTH_ALLOWED_HOSTS);
  const response = await requestAuth().handler(prepared.request);
  return finalizeAuthResponse(request, response, prepared.origin);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
