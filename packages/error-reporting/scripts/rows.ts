import { z } from "zod";
import { EVENT_SCHEMA_VERSION } from "../src/events";
export type ServiceIdentity = { service: string; environment: string };

const common = {
  schemaVersion: z.literal(EVENT_SCHEMA_VERSION).nullish(),
  service: z.string().nullish(),
  environment: z.string().nullish(),
  timestamp: z.iso.datetime({ offset: true }),
  requestId: z.string().nullish(),
  method: z.string(),
  path: z.string(),
};
const logRow = z.discriminatedUnion("event", [
  z.object({
    ...common,
    event: z.literal("server_error"),
    errorName: z.string(),
    message: z.string(),
    stack: z.string(),
  }),
  z.object({
    ...common,
    event: z.literal("server_response"),
    status: z.coerce.number().int().min(500).max(599),
  }),
]);
export type LogRow = z.infer<typeof logRow>;

export function parseLogRows(value: unknown, identity: ServiceIdentity): LogRow[] {
  return z
    .array(logRow)
    .parse(value)
    .map((row) => {
      const legacy = row.schemaVersion == null && row.service == null && row.environment == null;
      if (
        !legacy &&
        (row.schemaVersion !== EVENT_SCHEMA_VERSION ||
          row.service !== identity.service ||
          row.environment !== identity.environment)
      ) {
        throw new Error("Event identity does not match log source");
      }
      return { ...row, ...identity, schemaVersion: EVENT_SCHEMA_VERSION };
    });
}
