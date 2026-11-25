import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { buildServerErrorEvent } from "./error-reporting";

export function rejectServerFunction(status: number, code: string): never {
  setResponseStatus(status);
  throw new Error(code);
}

function currentRequest(): Request | null {
  try {
    return getRequest();
  } catch {
    return null;
  }
}

export async function runServerOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    console.error(buildServerErrorEvent(error, currentRequest()));
    return rejectServerFunction(500, "INTERNAL_ERROR");
  }
}
