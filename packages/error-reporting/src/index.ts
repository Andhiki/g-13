import {
  EVENT_SCHEMA_VERSION,
  MAX_MESSAGE_LENGTH,
  MAX_STACK_LENGTH,
  type ErrorReportingEvent,
  type EventContext,
  type ServerErrorEvent,
  type ServerResponseEvent,
} from "./events.ts";

export { EVENT_SCHEMA_VERSION } from "./events.ts";
export type { ErrorReportingEvent, ServerErrorEvent, ServerResponseEvent } from "./events.ts";

export const REQUEST_ID_HEADER = "x-g13-request-id";
const opaqueSegment =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|[0-9a-f]{16,}|[a-z0-9]{24,})$/i;

export function normalizeRequestPath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] ?? "";
  const segments = path.split("/").filter(Boolean);
  return `/${segments.map((segment) => (opaqueSegment.test(segment) ? ":id" : segment)).join("/")}`;
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const marker = "...[truncated]";
  return value.slice(0, limit - marker.length) + marker;
}

function describeThrownValue(value: unknown): string {
  try {
    return String(value);
  } catch {
    return "Unprintable thrown value";
  }
}

export type ErrorReporterOptions = {
  service: string;
  environment: string;
  normalizePath?: (pathname: string) => string;
  log?: (event: ErrorReportingEvent) => void;
};

export function createErrorReporter({
  service,
  environment,
  normalizePath = normalizeRequestPath,
  log = (event) => console.error(event),
}: ErrorReporterOptions) {
  function requestContext(request: Request | null): EventContext {
    return {
      schemaVersion: EVENT_SCHEMA_VERSION,
      service,
      environment,
      requestId: request?.headers.get(REQUEST_ID_HEADER) ?? null,
      method: request?.method ?? "UNKNOWN",
      path: request ? normalizePath(new URL(request.url).pathname) : "/",
    };
  }

  function buildServerErrorEvent(error: unknown, request: Request | null): ServerErrorEvent {
    return {
      event: "server_error",
      ...requestContext(request),
      errorName: error instanceof Error ? error.name || "Error" : "UnknownError",
      message: truncate(
        error instanceof Error ? error.message : describeThrownValue(error),
        MAX_MESSAGE_LENGTH,
      ),
      stack: truncate(error instanceof Error ? (error.stack ?? "") : "", MAX_STACK_LENGTH),
    };
  }

  function buildServerResponseEvent(request: Request, status: number): ServerResponseEvent {
    return { event: "server_response", ...requestContext(request), status };
  }

  function reportError(error: unknown, request: Request | null): void {
    log(buildServerErrorEvent(error, request));
  }

  async function withServerErrorReporting(
    request: Request,
    handle: (request: Request) => Response | Promise<Response>,
  ): Promise<Response> {
    const headers = new Headers(request.headers);
    headers.set(REQUEST_ID_HEADER, crypto.randomUUID());
    const tracedRequest = new Request(request, { headers });
    let response: Response;
    try {
      response = await handle(tracedRequest);
    } catch (error) {
      reportError(error, tracedRequest);
      response = new Response("Internal Server Error", {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (response.status >= 500) log(buildServerResponseEvent(tracedRequest, response.status));
    return response;
  }

  return { buildServerErrorEvent, buildServerResponseEvent, reportError, withServerErrorReporting };
}
