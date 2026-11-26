import type { z } from "zod";

/** A readable 400 for a rejected resource payload, instead of an unlabelled Zod 500. */
export class ResourceValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ResourceValidationError";
  }
}

/** Validates inside the server-function boundary so over-limit input gets a 400. */
export function validateResourceInput<T extends z.ZodType>(schema: T) {
  return (input: z.input<T>): z.output<T> => {
    const result = schema.safeParse(input);
    if (result.success) return result.data;
    throw new ResourceValidationError(
      result.error.issues[0]?.message ?? "Check the resource details and try again.",
    );
  };
}
