export const EVENT_SCHEMA_VERSION = 1;
export const MAX_MESSAGE_LENGTH = 2_048;
export const MAX_STACK_LENGTH = 8_192;

export type EventContext = {
  schemaVersion: typeof EVENT_SCHEMA_VERSION;
  service: string;
  environment: string;
  requestId: string | null;
  method: string;
  path: string;
};

export type ServerErrorEvent = EventContext & {
  event: "server_error";
  errorName: string;
  message: string;
  stack: string;
};

export type ServerResponseEvent = EventContext & {
  event: "server_response";
  status: number;
};

export type ErrorReportingEvent = ServerErrorEvent | ServerResponseEvent;
