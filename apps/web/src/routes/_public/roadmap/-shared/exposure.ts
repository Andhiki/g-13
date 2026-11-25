export const exposureValues = [
  "exchange",
  "internship",
  "course",
  "competition",
  "conference",
  "double",
  "undecided",
] as const;

export type Exposure = (typeof exposureValues)[number];
