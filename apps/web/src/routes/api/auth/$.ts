import { createFileRoute } from "@tanstack/react-router";
import { requestAuth } from "../../../server/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => requestAuth().handler(request),
      POST: ({ request }) => requestAuth().handler(request),
    },
  },
});
