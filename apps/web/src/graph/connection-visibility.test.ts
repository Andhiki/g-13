import { expect, test } from "bun:test";
import { connectionVisibility } from "./connection-visibility";

test("only courses whose visible handles change receive notifications", () => {
  const visibility = connectionVisibility();
  const changes: string[] = [];
  for (const id of ["a", "b", "c"]) visibility.subscribe(id, () => changes.push(id));
  const required = { id: "a-b", source: "a", target: "b", data: { visible: true } };
  const optional = { id: "a-c", source: "a", target: "c", data: { visible: false } };
  visibility.update([required, optional]);
  expect(changes).toEqual(["a", "b"]);
  expect(visibility.outgoing("a")).toBe(true);
  expect(visibility.incoming("b")).toBe(true);
  expect(visibility.incoming("c")).toBe(false);
  changes.length = 0;
  visibility.update([{ ...required, style: { stroke: "red" } }, optional]);
  expect(changes).toEqual([]);
  visibility.update([required, { ...optional, data: { visible: true } }]);
  expect(changes).toEqual(["c"]);
  expect(visibility.incoming("c")).toBe(true);
});

test("hiding and removing connections clear handles, and unsubscribing stops notifications", () => {
  const visibility = connectionVisibility();
  const edge = { id: "a-b", source: "a", target: "b", data: { visible: true } };
  visibility.update([edge]);
  let changes = 0;
  const unsubscribe = visibility.subscribe("a", () => changes++);
  visibility.update([{ ...edge, hidden: true }]);
  expect(visibility.outgoing("a")).toBe(false);
  expect(visibility.incoming("b")).toBe(false);
  expect(changes).toBe(1);
  visibility.update([edge]);
  expect(changes).toBe(2);
  unsubscribe();
  visibility.update([]);
  expect(visibility.outgoing("a")).toBe(false);
  expect(changes).toBe(2);
});
