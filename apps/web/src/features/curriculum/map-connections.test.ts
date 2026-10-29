import { expect, test } from "bun:test";
import type { Edge } from "@xyflow/react";
import { mapConnections } from "./map-connections";

const edges: Edge[] = [
  { id: "a-b", source: "a", target: "b" },
  { id: "a-c", source: "a", target: "c", data: { optional: true } },
  { id: "d-e", source: "d", target: "e" },
];

test("core connections show by default and optional connections reveal on interaction", () => {
  expect(mapConnections(edges, null, null).map((edge) => edge.data.visible)).toEqual([
    true,
    false,
    true,
  ]);
  const hovered = mapConnections(edges, null, "a");
  expect(hovered.map((edge) => edge.data.visible)).toEqual([true, true, true]);
  expect(hovered.map((edge) => edge.data.charging)).toEqual([true, true, false]);
  expect(mapConnections(edges, null, null).every((edge) => !edge.data.charging)).toBe(true);
  expect(hovered[0].style.strokeWidth).toBe(2.4);
  expect(hovered[0].style.opacity).toBe(1);
  expect(hovered[1].style.opacity).toBe(0.65);
  expect(hovered[2].style.opacity).toBe(0.18);
  expect(mapConnections(edges, "c", null)[1].data.visible).toBe(true);
  expect(mapConnections(edges, "c", null)[1].style.opacity).toBe(0.65);
  expect(mapConnections(edges, null, null)[1].data.visible).toBe(false);
});

test("optional edges remain mounted so hover can fade them out", () => {
  const resting = mapConnections(edges, null, null);
  const hovered = mapConnections(edges, null, "a");
  expect(resting.every((edge) => !edge.hidden)).toBe(true);
  expect(hovered.every((edge) => !edge.hidden)).toBe(true);
  expect(resting.map((edge) => edge.id)).toEqual(hovered.map((edge) => edge.id));
});
