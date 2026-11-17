import { setResponseStatus } from "@tanstack/react-start/server";

export function rejectServerFunction(status: number, code: string): never {
  setResponseStatus(status);
  throw new Error(code);
}

export async function runServerOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    console.error("Unexpected server operation failure", error);
    return rejectServerFunction(500, "INTERNAL_ERROR");
  }
}
