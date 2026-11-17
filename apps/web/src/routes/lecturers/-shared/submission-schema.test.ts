import { expect, it } from "bun:test";
import { submissionInputSchema } from "./submission-schema";

const rawInput = {
  lecturerId: "p",
  courseId: "c",
  termLabel: "2026/2027 Ganjil",
  anonymous: false,
  authorName: " Student ",
  clarity: 5,
  support: 3,
  organization: 1,
  body: " Helpful examples ",
};

it("validates required fields, integer ratings, limits and anonymous names", () => {
  expect(submissionInputSchema.parse(rawInput)).toEqual({
    ...rawInput,
    authorName: "Student",
    body: "Helpful examples",
  });
  for (const authorName of ["Remembered display name", 42, null]) {
    expect(submissionInputSchema.parse({ ...rawInput, anonymous: true, authorName })).toMatchObject(
      { anonymous: true, authorName: "" },
    );
  }
  for (const patch of [
    { clarity: 0 },
    { support: 6 },
    { organization: 1.5 },
    { clarity: "5" },
    { body: " " },
    { body: "x".repeat(1001) },
    { termLabel: "" },
    { authorName: "" },
    { authorName: "   " },
    { authorName: "x".repeat(81) },
    { anonymous: "true" },
  ]) {
    expect(submissionInputSchema.safeParse({ ...rawInput, ...patch }).success).toBe(false);
  }
  expect(submissionInputSchema.safeParse(null).success).toBe(false);
});
