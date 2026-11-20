import { getSessionCookie } from "better-auth/cookies";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const hasDashboardSessionCookie = createIsomorphicFn()
  .server(() => Boolean(getSessionCookie(getRequestHeaders())))
  .client(() => undefined);
