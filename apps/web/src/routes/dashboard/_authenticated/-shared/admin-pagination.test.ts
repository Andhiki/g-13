import { expect, test } from "bun:test";
import {
  ADMIN_PAGE_SIZE,
  getNextAdminPageOffset,
  getPreviousAdminPageOffset,
  hasNextAdminPage,
} from "./admin-pagination";

test("admin pagination navigates from the exact total", () => {
  expect(getPreviousAdminPageOffset(0)).toBe(0);
  expect(getPreviousAdminPageOffset(ADMIN_PAGE_SIZE)).toBe(0);
  expect(getNextAdminPageOffset(0)).toBe(ADMIN_PAGE_SIZE);
  expect(hasNextAdminPage(0, ADMIN_PAGE_SIZE)).toBe(false);
  expect(hasNextAdminPage(0, ADMIN_PAGE_SIZE + 1)).toBe(true);
  expect(hasNextAdminPage(ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZE + 1)).toBe(false);
});
