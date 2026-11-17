import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createIsomorphicFn } from "@tanstack/react-start";
import type { QueryClient } from "@tanstack/react-query";
import type { Auth } from "@g13/auth/server";
import { loadAdminIdentity } from "../server/identity";

export const authClient = createAuthClient({ plugins: [inferAdditionalFields<Auth>()] });

export const getAdminIdentity = createIsomorphicFn()
  .server(async (_queryClient: QueryClient) => loadAdminIdentity())
  .client(async (queryClient: QueryClient) =>
    queryClient.fetchQuery({
      queryKey: ["auth", "identity"],
      staleTime: 0,
      gcTime: 0,
      retry: false,
      queryFn: async () => {
        const result = await authClient.getSession({ query: { disableCookieCache: true } });
        if (result.error) throw new Error("Unable to verify authentication session");
        const user = result.data?.user;
        return user ? { id: user.id, name: user.name, role: user.role } : null;
      },
    }),
  );
