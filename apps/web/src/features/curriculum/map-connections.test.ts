import { expect, test } from "bun:test";
import type { Edge } from "@xyflow/react";
import { mapConnections } from "./map-connections";

const edges: Edge[] = [
  { id: "a-b", source: "a", target: "b" },
  { id: "a-c", source: "a", target: "c", data: { optional: true } },
  { id: "d-e", source: "d", target: "e" },
];

test("core connections show by default and optional connections reveal on interaction", () => {
  expect(mapConnections(edges, null, null).map((edge) => edge.hidden)).toEqual([
    false,
    true,
    false,
  ]);
  const hovered = mapConnections(edges, null, "a");
  expect(hovered.map((edge) => edge.hidden)).toEqual([false, false, false]);
  expect(hovered.map((edge) => edge.data.charging)).toEqual([true, true, false]);
  expect(hovered[0].style.strokeWidth).toBe(2.4);
  expect(hovered[2].style.opacity).toBe(0.18);
  expect(mapConnections(edges, "c", null)[1].hidden).toBe(false);
  expect(mapConnections(edges, null, null)[1].hidden).toBe(true);
});
