import { expect, it } from "bun:test";
import { resourceMutationErrorMessage } from "../-shared/errors";
import {
  RESOURCE_FIELD_LIMITS,
  resourceFieldsSchema,
  type ResourceFieldsInput,
} from "../-shared/schemas";
import { ResourceValidationError, validateResourceInput } from "./validation";

const validFields: ResourceFieldsInput = {
  titleId: "Arsip ujian HIMAKOM",
  titleEn: "HIMAKOM exam archive",
  descriptionId: "Arsip ujian dari HIMAKOM.",
  descriptionEn: "Exam archive from HIMAKOM.",
  url: "https://example.com/resources",
};

const validate = validateResourceInput(resourceFieldsSchema);

function expectValidationError(input: Parameters<typeof validate>[0], message: string) {
  try {
    validate(input);
  } catch (error) {
    if (!(error instanceof ResourceValidationError)) throw error;
    expect(error.status).toBe(400);
    expect(error.message).toBe(message);
    return;
  }
  throw new Error(`Expected validation to reject: ${message}`);
}

it("accepts values exactly at the limit", () => {
  const atLimitUrl = `https://example.com/${"a".repeat(
    RESOURCE_FIELD_LIMITS.url - "https://example.com/".length,
  )}`;
  expect(atLimitUrl.length).toBe(RESOURCE_FIELD_LIMITS.url);

  expect(() =>
    validate({
      ...validFields,
      titleId: "a".repeat(RESOURCE_FIELD_LIMITS.title),
      titleEn: "a".repeat(RESOURCE_FIELD_LIMITS.title),
      descriptionId: "a".repeat(RESOURCE_FIELD_LIMITS.description),
      descriptionEn: "a".repeat(RESOURCE_FIELD_LIMITS.description),
      url: atLimitUrl,
    }),
  ).not.toThrow();
});

it("rejects over-limit fields with a readable 400 message", () => {
  expectValidationError(
    { ...validFields, titleId: "a".repeat(RESOURCE_FIELD_LIMITS.title + 1) },
    `The Indonesian title must be ${RESOURCE_FIELD_LIMITS.title} characters or fewer.`,
  );
  expectValidationError(
    { ...validFields, titleEn: "a".repeat(RESOURCE_FIELD_LIMITS.title + 1) },
    `The English title must be ${RESOURCE_FIELD_LIMITS.title} characters or fewer.`,
  );
  expectValidationError(
    { ...validFields, descriptionId: "a".repeat(RESOURCE_FIELD_LIMITS.description + 1) },
    `The Indonesian description must be ${RESOURCE_FIELD_LIMITS.description} characters or fewer.`,
  );
  expectValidationError(
    { ...validFields, descriptionEn: "a".repeat(RESOURCE_FIELD_LIMITS.description + 1) },
    `The English description must be ${RESOURCE_FIELD_LIMITS.description} characters or fewer.`,
  );
  expectValidationError(
    { ...validFields, url: `https://example.com/${"a".repeat(RESOURCE_FIELD_LIMITS.url)}` },
    `The link must be ${RESOURCE_FIELD_LIMITS.url} characters or fewer.`,
  );
});

it("shows validation messages but hides known server error codes", () => {
  const validationMessage = `The English title must be ${RESOURCE_FIELD_LIMITS.title} characters or fewer.`;
  expect(resourceMutationErrorMessage(new Error(validationMessage))).toBe(validationMessage);
  expect(resourceMutationErrorMessage(new Error("FORBIDDEN"))).toBeUndefined();
  expect(resourceMutationErrorMessage(new Error("RESOURCE_ACTION_UNAVAILABLE"))).toBeUndefined();
  expect(resourceMutationErrorMessage(new Error("INTERNAL_ERROR"))).toBeUndefined();
  expect(resourceMutationErrorMessage(new Error("   "))).toBeUndefined();
  expect(resourceMutationErrorMessage("not an error")).toBeUndefined();
});
