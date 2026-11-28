import { createDatabase } from "@g13/db/client";
import { rejectServerFunction, runServerOperation } from "@/server/server-function-error";

export type AdminDatabase = ReturnType<typeof createDatabase>;

export type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
};

export type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  role: string | null | undefined;
  image: string | null | undefined;
};

export type AdminOperationResult<T, E extends string> =
  { data: T; error: null } | { data: null; error: E };

export type AdminErrorRejector<E extends string> = (status: number, error: E) => never;

export type AdminOperationOptions<E extends string> = {
  reject?: AdminErrorRejector<E>;
  getDatabase?: () => Promise<AdminDatabase> | AdminDatabase;
};

async function defaultDatabase(): Promise<AdminDatabase> {
  const { env } = await import("cloudflare:workers");
  return createDatabase(env.DB);
}

/** Projects the authenticated session user onto the shape returned by dashboard loaders. */
export function projectAdminIdentity(user: AdminSessionUser): AdminIdentity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  };
}

function isAdminError<T, E extends string>(
  result: AdminOperationResult<T, E>,
): result is { data: null; error: E } {
  return result.error !== null;
}

/** Returns a successful result's data or rejects using the feature's error-to-status map. */
export function unwrapAdminResult<T, E extends string>(
  result: AdminOperationResult<T, E>,
  statuses: Record<E, number>,
  reject: AdminErrorRejector<E> = rejectServerFunction,
): T {
  if (isAdminError(result)) return reject(statuses[result.error], result.error);
  return result.data;
}

type ResultData<R> = Extract<R, { error: null }> extends { data: infer T } ? T : never;

/**
 * Runs a dashboard server operation with DB provisioning, unexpected-error
 * trapping, and domain error-to-HTTP status mapping.
 */
export async function runAdminOperation<
  E extends string,
  R extends AdminOperationResult<unknown, E>,
>(
  statuses: Record<E, number>,
  operation: (db: AdminDatabase) => Promise<R>,
  options: AdminOperationOptions<NoInfer<E>> = {},
): Promise<ResultData<R>> {
  const getDatabase = options.getDatabase ?? defaultDatabase;
  const result = await runServerOperation(async () => operation(await getDatabase()));
  return unwrapAdminResult(result, statuses, options.reject) as ResultData<R>;
}

/** Runs a dashboard loader operation and attaches the projected session identity. */
export async function loadAdminPage<E extends string, R extends AdminOperationResult<object, E>>(
  user: AdminSessionUser,
  statuses: Record<E, number>,
  operation: (db: AdminDatabase) => Promise<R>,
  options: AdminOperationOptions<NoInfer<E>> = {},
): Promise<ResultData<R> & { identity: AdminIdentity }> {
  const data = await runAdminOperation(statuses, operation, options);
  return Object.assign({}, data, { identity: projectAdminIdentity(user) });
}
