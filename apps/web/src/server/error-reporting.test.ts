import { expect, spyOn, test } from "bun:test";
import {
  buildServerErrorEvent,
  buildServerResponseEvent,
  normalizeRequestPath,
  REQUEST_ID_HEADER,
  withServerErrorReporting,
} from "./error-reporting";

const request = (path: string, init?: RequestInit) =>
  new Request(`https://example.test${path}`, init);

function captureConsoleErrors() {
  const errors: unknown[] = [];
  const spy = spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args[0]);
  });
  return { errors, restore: () => spy.mockRestore() };
}

test("normalizes dynamic and opaque path segments", () => {
  expect(normalizeRequestPath("/")).toBe("/");
  expect(normalizeRequestPath("/lecturers")).toBe("/lecturers");
  expect(normalizeRequestPath("/lecturers/afiahayati")).toBe("/lecturers/:lecturerId");
  expect(normalizeRequestPath("/lecturers/afiahayati/")).toBe("/lecturers/:lecturerId");
  expect(normalizeRequestPath("/lecturers/afiahayati?course=CS101#reviews")).toBe(
    "/lecturers/:lecturerId",
  );
  expect(normalizeRequestPath("/lecturers/123e4567-e89b-12d3-a456-426614174000")).toBe(
    "/lecturers/:lecturerId",
  );
  expect(normalizeRequestPath("/dashboard/42")).toBe("/dashboard/:id");
  expect(normalizeRequestPath("/_serverFn/0123456789abcdef0123456789abcdef")).toBe(
    "/_serverFn/:serverFn",
  );
  expect(normalizeRequestPath("/exam/MII21-1201")).toBe("/exam/MII21-1201");
});

test("builds a bounded server error event", () => {
  const error = new TypeError("x".repeat(3_000));
  error.stack = "s".repeat(9_000);
  const req = request("/lecturers/afiahayati", {
    method: "POST",
    headers: { [REQUEST_ID_HEADER]: "request-1" },
  });

  const event = buildServerErrorEvent(error, req);

  expect(event).toMatchObject({
    event: "server_error",
    requestId: "request-1",
    method: "POST",
    path: "/lecturers/:lecturerId",
    errorName: "TypeError",
  });
  expect(event.message).toHaveLength(2_048);
  expect(event.message.endsWith("...[truncated]")).toBe(true);
  expect(event.stack).toHaveLength(8_192);
  expect(event.stack.endsWith("...[truncated]")).toBe(true);
});

test("falls back when the request or error is unavailable", () => {
  const event = buildServerErrorEvent("boom", null);
  expect(event).toMatchObject({
    event: "server_error",
    requestId: null,
    method: "UNKNOWN",
    path: "/",
    errorName: "UnknownError",
    message: "boom",
    stack: "",
  });
});

test("builds a response event without request details", () => {
  const event = buildServerResponseEvent(request("/dashboard"), 500);
  expect(event).toMatchObject({
    event: "server_response",
    requestId: null,
    method: "GET",
    path: "/dashboard",
    status: 500,
  });
});

test("logs 5xx responses and passes a request id to the handler", async () => {
  const capture = captureConsoleErrors();
  try {
    let receivedRequestId: string | null = null;
    const response = await withServerErrorReporting(
      request("/dashboard?tab=reviews"),
      async (req) => {
        receivedRequestId = req.headers.get(REQUEST_ID_HEADER);
        return new Response(null, { status: 503 });
      },
    );

    expect(response.status).toBe(503);
    expect(receivedRequestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(capture.errors).toHaveLength(1);
    expect(capture.errors[0]).toMatchObject({
      event: "server_response",
      method: "GET",
      path: "/dashboard",
      status: 503,
    });
  } finally {
    capture.restore();
  }
});

test("stays silent for 4xx responses", async () => {
  const capture = captureConsoleErrors();
  try {
    const response = await withServerErrorReporting(
      request("/missing"),
      async () => new Response(null, { status: 404 }),
    );

    expect(response.status).toBe(404);
    expect(capture.errors).toHaveLength(0);
  } finally {
    capture.restore();
  }
});

test("reports uncaught throws and returns a plain 500", async () => {
  const capture = captureConsoleErrors();
  try {
    const response = await withServerErrorReporting(request("/lecturers/afiahayati"), async () => {
      throw new TypeError("boom");
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("Internal Server Error");
    expect(capture.errors).toHaveLength(2);
    expect(capture.errors[0]).toMatchObject({
      event: "server_error",
      errorName: "TypeError",
      message: "boom",
      path: "/lecturers/:lecturerId",
    });
    expect(capture.errors[1]).toMatchObject({
      event: "server_response",
      status: 500,
      path: "/lecturers/:lecturerId",
    });
  } finally {
    capture.restore();
  }
});
