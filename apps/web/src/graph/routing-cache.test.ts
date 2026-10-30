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

test("concurrent routing requests receive their own routes from the shared worker", async () => {
  const nodes = [0, 300, 600].map((x, index) => ({
    id: String(index),
    position: { x, y: 0 },
    measured: { width: 100, height: 80 },
    source: { x: x + 100, y: 40 },
    target: { x, y: 40 },
  }));
  const first = routingRequest(nodes, [{ id: "first", source: "0", target: "1" }]);
  const second = routingRequest(nodes, [{ id: "second", source: "1", target: "2" }]);
  const results = await Promise.all([
    getConnectionRoutes(JSON.stringify(first), first),
    getConnectionRoutes(JSON.stringify(second), second),
  ]);
  expect([...results[0].keys()]).toEqual(["first"]);
  expect([...results[1].keys()]).toEqual(["second"]);
  expect(results[0].get("first")?.path).toBe("M 100,40 L 300,40");
  expect(results[1].get("second")?.path).toBe("M 400,40 L 600,40");
});
