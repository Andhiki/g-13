import { expect, test } from "bun:test";
import { getConnectionRoutes, routingRequest } from "./routing-cache";

test("routing ignores visual edge changes and shares in-flight and completed work", async () => {
  const edges = [{ id: "a->b", source: "a", target: "b", data: { optional: false } }];
  const request = routingRequest([], edges);
  const highlighted = routingRequest(
    [],
    [{ ...edges[0], style: { stroke: "red" }, data: { optional: false, visible: true } }],
  );
  expect(highlighted).toEqual(request);
  const key = JSON.stringify(request);
  const first = getConnectionRoutes(key, request);
  expect(getConnectionRoutes(key, highlighted)).toBe(first);
  expect(await first).toEqual(new Map());
  expect(getConnectionRoutes(key, request)).toBe(first);
});
