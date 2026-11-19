import { createMiddleware } from "@tanstack/react-start";

export const authenticatedMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const [{ getRequestHeaders }, { requireAuthenticatedSession }] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("./auth"),
    ]);
    const session = await requireAuthenticatedSession(getRequestHeaders());
    return next({ context: { session } });
  },
);

export const moderateMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const [{ getRequestHeaders }, { requireAdminSession }] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("./auth"),
    ]);
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    return next({ context: { session } });
  },
);

export const manageUsersMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const [{ getRequestHeaders }, { requireAdminSession }] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("./auth"),
    ]);
    const session = await requireAdminSession(getRequestHeaders(), "manage-users");
    return next({ context: { session } });
  },
);
