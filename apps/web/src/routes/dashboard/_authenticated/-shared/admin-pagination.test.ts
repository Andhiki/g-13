import { expect, test } from "bun:test";
import {
  ADMIN_PAGE_SIZE,
  getAdminPageRows,
  getNextAdminPageOffset,
  getPreviousAdminPageOffset,
  hasNextAdminPage,
} from "./admin-pagination";

test("admin pagination slices one page and navigates from the exact total", () => {
  const rows = Array.from({ length: ADMIN_PAGE_SIZE + 1 }, (_, index) => index);

  expect(getAdminPageRows(rows)).toEqual(rows.slice(0, ADMIN_PAGE_SIZE));
  expect(getPreviousAdminPageOffset(0)).toBe(0);
  expect(getPreviousAdminPageOffset(ADMIN_PAGE_SIZE)).toBe(0);
  expect(getNextAdminPageOffset(0)).toBe(ADMIN_PAGE_SIZE);
  expect(hasNextAdminPage(0, ADMIN_PAGE_SIZE)).toBe(false);
  expect(hasNextAdminPage(0, ADMIN_PAGE_SIZE + 1)).toBe(true);
  expect(hasNextAdminPage(ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZE + 1)).toBe(false);
});
