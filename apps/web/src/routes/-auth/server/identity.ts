import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { requestAuth } from "@/server/auth";

export const loadAdminIdentity = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requestAuth().api.getSession({
    headers: getRequestHeaders(),
    query: { disableCookieCache: true },
  });
  return session ? { id: session.user.id, name: session.user.name, role: session.user.role } : null;
});
