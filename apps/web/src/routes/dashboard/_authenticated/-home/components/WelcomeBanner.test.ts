import { expect, it } from "bun:test";
import { waitingSummary } from "./WelcomeBanner";

it("summarizes what is waiting with matching plurals", () => {
  expect(waitingSummary(0, 0)).toBe("Nothing is waiting for you.");
  expect(waitingSummary(1, 0)).toBe("1 review is waiting for you.");
  expect(waitingSummary(0, 1)).toBe("1 access request is waiting for you.");
  expect(waitingSummary(3, 0)).toBe("3 reviews are waiting for you.");
  expect(waitingSummary(1, 1)).toBe("1 review and 1 access request are waiting for you.");
});
