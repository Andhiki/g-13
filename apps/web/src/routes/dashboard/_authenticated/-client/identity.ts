import { useEffect } from "react";
import { skipToken, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { isMatch, useMatches } from "@tanstack/react-router";
import { isRole, type Role } from "@g13/auth";

export type DashboardIdentity = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  image: string | null;
};

export const dashboardIdentityQueryKey = ["dashboard", "identity"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function parseDashboardIdentity(value: unknown): DashboardIdentity | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string" || !isRole(value.role)) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    email: optionalString(value.email),
    role: value.role,
    image: optionalString(value.image),
  };
}

export function extractDashboardIdentity(data: unknown): DashboardIdentity | null {
  if (!isRecord(data)) return null;
  if ("identity" in data) return parseDashboardIdentity(data.identity);
  if (Array.isArray(data.pages) && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (isRecord(firstPage) && "identity" in firstPage) {
      return parseDashboardIdentity(firstPage.identity);
    }
  }
  return null;
}

function identitiesEqual(a: DashboardIdentity | undefined, b: DashboardIdentity): boolean {
  return (
    a !== undefined &&
    a.id === b.id &&
    a.name === b.name &&
    a.email === b.email &&
    a.role === b.role &&
    a.image === b.image
  );
}

function isIdentityQueryKey(queryKey: readonly unknown[]): boolean {
  return (
    queryKey.length === dashboardIdentityQueryKey.length &&
    queryKey[0] === dashboardIdentityQueryKey[0] &&
    queryKey[1] === dashboardIdentityQueryKey[1]
  );
}

export function clearDashboardIdentity(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: dashboardIdentityQueryKey });
}

function readMatchedIdentity(matches: ReturnType<typeof useMatches>): DashboardIdentity | null {
  const match = matches.find((item) => isMatch(item, "loaderData.identity"));
  return parseDashboardIdentity(match?.loaderData?.identity);
}

function findLatestCachedIdentity(queryClient: QueryClient): DashboardIdentity | null {
  let latest: { updatedAt: number; identity: DashboardIdentity } | null = null;
  for (const query of queryClient.getQueryCache().getAll()) {
    if (isIdentityQueryKey(query.queryKey)) continue;
    const identity = extractDashboardIdentity(query.state.data);
    if (!identity) continue;
    if (!latest || query.state.dataUpdatedAt > latest.updatedAt) {
      latest = { updatedAt: query.state.dataUpdatedAt, identity };
    }
  }
  return latest?.identity ?? null;
}

/**
 * Mirrors server-verified `identity` payloads from dashboard queries into a cache-only
 * entry without issuing any separate session requests.
 */
export function useSyncDashboardIdentity(): void {
  const queryClient = useQueryClient();
  const matchIdentity = readMatchedIdentity(useMatches());

  useEffect(() => {
    const latest = findLatestCachedIdentity(queryClient);
    if (latest && !queryClient.getQueryData(dashboardIdentityQueryKey)) {
      queryClient.setQueryData(dashboardIdentityQueryKey, latest);
    }

    return queryClient.getQueryCache().subscribe((event) => {
      if (isIdentityQueryKey(event.query.queryKey) || event.type !== "updated") return;
      if (event.action.type === "success") {
        const next = extractDashboardIdentity(event.query.state.data);
        if (!next) return;
        queryClient.setQueryData<DashboardIdentity>(dashboardIdentityQueryKey, (prev) =>
          identitiesEqual(prev, next) ? prev : next,
        );
        return;
      }
      if (
        event.action.type === "error" &&
        event.action.error instanceof Response &&
        event.action.error.status === 401
      ) {
        clearDashboardIdentity(queryClient);
      }
    });
  }, [queryClient]);

  useEffect(() => {
    if (matchIdentity && !queryClient.getQueryData(dashboardIdentityQueryKey)) {
      queryClient.setQueryData(dashboardIdentityQueryKey, matchIdentity);
    }
  }, [queryClient, matchIdentity]);
}

export function useDashboardIdentity(): DashboardIdentity | undefined {
  const { data: cachedIdentity } = useQuery<DashboardIdentity>({
    queryKey: dashboardIdentityQueryKey,
    queryFn: skipToken,
    staleTime: Infinity,
  });
  const matchIdentity = readMatchedIdentity(useMatches());
  return cachedIdentity ?? matchIdentity ?? undefined;
}
