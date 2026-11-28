import { lecturerOrders, type LecturerOrder } from "./review-order";

export const defaultLecturerOrder = "name" satisfies LecturerOrder;
type LecturerSearch = { sort?: LecturerOrder };

export function validateLecturerSearch({ sort }: Record<string, unknown>): LecturerSearch {
  const order = lecturerOrders.find((option) => option === sort);
  return order && order !== defaultLecturerOrder ? { sort: order } : {};
}
