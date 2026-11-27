export const ADMIN_PAGE_SIZE = 50;

export function getPreviousAdminPageOffset(offset: number): number {
  return Math.max(0, offset - ADMIN_PAGE_SIZE);
}

export function getNextAdminPageOffset(offset: number): number {
  return offset + ADMIN_PAGE_SIZE;
}

export function hasNextAdminPage(offset: number, total: number): boolean {
  return offset + ADMIN_PAGE_SIZE < total;
}
