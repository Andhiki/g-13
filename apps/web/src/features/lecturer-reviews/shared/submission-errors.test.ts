import { expect, it } from "bun:test";
import { getSubmissionErrors } from "./submission-errors";
import { submissionInputSchema } from "./submission-schema";

const input = submissionInputSchema.parse({
  lecturerId: "p",
  courseId: "c",
  termLabel: "2026/2027 Ganjil",
  anonymous: false,
  authorName: " Student ",
  clarity: 5,
  support: 3,
  organization: 1,
  body: " Helpful examples ",
});

it("reports field errors and enforces text boundaries", () => {
  expect(getSubmissionErrors({ ...input, clarity: 0, body: " " })).toEqual({
    clarity: "Choose a rating from 1 to 5.",
    body: "Describe your experience using 1–1,000 characters.",
  });
  const boundaries = {
    ...input,
    body: "a".repeat(1000),
    termLabel: "a".repeat(60),
    authorName: "a".repeat(80),
  };
  expect(getSubmissionErrors(boundaries)).toEqual({});
  for (const field of ["body", "termLabel", "authorName"] as const) {
    expect(
      getSubmissionErrors({ ...boundaries, [field]: boundaries[field] + "a" })[field],
    ).toBeDefined();
  }
});
