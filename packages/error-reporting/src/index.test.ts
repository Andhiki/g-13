import { expect, test } from "bun:test";
import { createErrorReporter, REQUEST_ID_HEADER, type ErrorReportingEvent } from "./index";

test("a service can customize its logger and route normalization", async () => {
  const events: ErrorReportingEvent[] = [];
  const reporter = createErrorReporter({
    service: "inventory",
    environment: "staging",
    normalizePath: (path) => (path.startsWith("/items/") ? "/items/:sku" : path),
    log: (event) => events.push(event),
  });
  const request = new Request("https://example.test/items/test-sku?debug=private", {
    headers: { [REQUEST_ID_HEADER]: "untrusted" },
  });
  const response = await reporter.withServerErrorReporting(request, (tracedRequest) => {
    reporter.reportError(new Error("Synthetic failure"), tracedRequest);
    return new Response(null, { status: 503 });
  });

  expect(response.status).toBe(503);
  expect(events).toHaveLength(2);
  expect(events[0]).toMatchObject({
    schemaVersion: 1,
    service: "inventory",
    environment: "staging",
    event: "server_error",
    path: "/items/:sku",
  });
  const requestId = events[0]?.requestId;
  expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  expect(events[1]).toMatchObject({ event: "server_response", requestId });
});
