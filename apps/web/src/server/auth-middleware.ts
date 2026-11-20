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

type AdminPermission = Parameters<(typeof import("./auth"))["requireAdminSession"]>[1];

/**
 * Gates a server function behind an admin permission. Resolves the session
 * from the request headers and shares it with the handler as `context.session`.
 */
export function authorize(permission: AdminPermission) {
  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    const [{ getRequestHeaders }, { requireAdminSession }] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("./auth"),
    ]);
    const session = await requireAdminSession(getRequestHeaders(), permission);
    return next({ context: { session } });
  });
}
