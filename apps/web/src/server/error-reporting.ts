export const REQUEST_ID_HEADER = "x-g13-request-id";

const MAX_MESSAGE_LENGTH = 2_048;
const MAX_STACK_LENGTH = 8_192;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_PATTERN = /^\d+$/;
const HEX_PATTERN = /^[0-9a-f]{16,}$/i;
const COMPACT_ID_PATTERN = /^[A-Za-z0-9]{24,}$/;

export type ServerErrorEvent = {
  event: "server_error";
  requestId: string | null;
  method: string;
  path: string;
  errorName: string;
  message: string;
  stack: string;
};

export type ServerResponseEvent = {
  event: "server_response";
  requestId: string | null;
  method: string;
  path: string;
  status: number;
};

type ErrorDetails = {
  errorName: string;
  message: string;
  stack: string;
};

function isOpaqueSegment(segment: string): boolean {
  return (
    UUID_PATTERN.test(segment) ||
    NUMERIC_PATTERN.test(segment) ||
    HEX_PATTERN.test(segment) ||
    COMPACT_ID_PATTERN.test(segment)
  );
}

function replaceSegment(segment: string): string {
  return isOpaqueSegment(segment) ? ":id" : segment;
}

export function normalizeRequestPath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] || "/";
  const segments = path.split("/").filter(Boolean).map(replaceSegment);
  if (segments[0] === "lecturers" && segments.length === 2) segments[1] = ":lecturerId";
  if (segments[0] === "_serverFn" && segments.length === 2) segments[1] = ":serverFn";
  return `/${segments.join("/")}`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const marker = "...[truncated]";
  return `${value.slice(0, maxLength - marker.length)}${marker}`;
}

function describeError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    return {
      errorName: error.name || "Error",
      message: truncate(error.message, MAX_MESSAGE_LENGTH),
      stack: truncate(error.stack ?? "", MAX_STACK_LENGTH),
    };
  }
  return {
    errorName: "UnknownError",
    message: truncate(String(error), MAX_MESSAGE_LENGTH),
    stack: "",
  };
}

function requestContext(request: Request | null) {
  if (!request) return { requestId: null, method: "UNKNOWN", path: "/" };
  return {
    requestId: request.headers.get(REQUEST_ID_HEADER),
    method: request.method,
    path: normalizeRequestPath(new URL(request.url).pathname),
  };
}

export function buildServerErrorEvent(error: unknown, request: Request | null): ServerErrorEvent {
  return {
    event: "server_error",
    ...requestContext(request),
    ...describeError(error),
  };
}

export function buildServerResponseEvent(request: Request, status: number): ServerResponseEvent {
  return {
    event: "server_response",
    ...requestContext(request),
    status,
  };
}

export async function withServerErrorReporting(
  request: Request,
  handle: (request: Request) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  const tracedRequest = new Request(request, { headers });

  try {
    const response = await handle(tracedRequest);
    if (response.status >= 500) {
      console.error(buildServerResponseEvent(tracedRequest, response.status));
    }
    return response;
  } catch (error) {
    console.error(buildServerErrorEvent(error, tracedRequest));
    console.error(buildServerResponseEvent(tracedRequest, 500));
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
