import { expect, test } from "bun:test";
import type { Edge, XYPosition } from "@xyflow/react";
import { getCurriculum, getRelations, listCurricula } from "@g13/curriculum";
import { buildMap, createMapLayout } from "./map-layout";
import { mapConnections } from "./map-connections";
import { connectionRoutes, type RoutingNode } from "./connection-routes";
import { buildRoadmap } from "../roadmap/planner.test-support";
import { buildRoadmapGraph } from "../roadmap/graph-layout";
import { validateRoadmapSearch } from "../roadmap/search";

function routingNodes(nodes: { id: string; position: XYPosition; type?: string }[]): RoutingNode[] {
  return nodes.map((node) => {
    // Dimensions stand in for browser measurements; positions come from graph construction.
    const width = node.type === "title" ? 540 : 246;
    const height = node.type === "title" ? 180 : node.type === "activity" ? 160 : 82;
    return {
      ...node,
      measured: { width, height },
      source: { x: node.position.x + width, y: node.position.y + height / 2 },
      target: { x: node.position.x, y: node.position.y + height / 2 },
    };
  });
}

function verifyRoutes(nodes: RoutingNode[], edges: Edge[]) {
  const visible = edges.filter((edge) => !edge.hidden && edge.data?.visible !== false);
  const routes = connectionRoutes(nodes, edges);
  expect(routes.size).toBe(visible.length);
  const vertical: { id: string; x: number; top: number; bottom: number }[] = [];
  for (const edge of visible) {
    const route = routes.get(edge.id)!;
    expect(route.path).not.toContain("NaN");
    expect(route.points[0][1]).toBe(route.points[1][1]);
    expect(route.points.at(-1)![1]).toBe(route.points.at(-2)![1]);
    for (let index = 1; index < route.points.length; index++) {
      const a = route.points[index - 1];
      const b = route.points[index];
      expect(a[0] === b[0] || a[1] === b[1], `${edge.id}: diagonal segment`).toBe(true);
      for (const node of nodes) {
        if (node.id === edge.source || node.id === edge.target) continue;
        const hit =
          Math.max(a[0], b[0]) > node.position.x &&
          Math.min(a[0], b[0]) < node.position.x + node.measured.width &&
          Math.max(a[1], b[1]) > node.position.y &&
          Math.min(a[1], b[1]) < node.position.y + node.measured.height;
        expect(hit, `${edge.id} crosses ${node.id}`).toBe(false);
      }
      if (a[0] === b[0] && a[1] !== b[1])
        vertical.push({
          id: edge.id,
          x: a[0],
          top: Math.min(a[1], b[1]),
          bottom: Math.max(a[1], b[1]),
        });
    }
  }
  for (let i = 0; i < vertical.length; i++)
    for (let j = i + 1; j < vertical.length; j++) {
      const a = vertical[i],
        b = vertical[j];
      if (a.id === b.id || a.top >= b.bottom || b.top >= a.bottom) continue;
      const edgeA = edges.find((edge) => edge.id === a.id)!;
      const edgeB = edges.find((edge) => edge.id === b.id)!;
      if (a.x === b.x && (edgeA.source === edgeB.source || edgeA.target === edgeB.target)) continue;
      expect(
        Math.abs(a.x - b.x),
        `${a.id} and ${b.id} share a vertical lane`,
      ).toBeGreaterThanOrEqual(4);
    }
  return routes;
}

for (const { id } of listCurricula()) {
  test(`${id}: overview and every optional hover keep orthogonal, obstacle-free, spaced or converging vertical lanes`, () => {
    const data = getCurriculum(id);
    const map = buildMap(createMapLayout(data, getRelations(id)), data.all, null, () => {});
    const nodes = routingNodes(map.nodes.filter((node) => node.type === "course"));
    const overview = verifyRoutes(nodes, mapConnections(map.edges, null, null));
    const optionalEndpoints = new Set(
      map.edges.filter((edge) => edge.data?.optional).flatMap((edge) => [edge.source, edge.target]),
    );
    for (const hovered of optionalEndpoints) {
      const revealed = verifyRoutes(nodes, mapConnections(map.edges, null, hovered));
      for (const [id, route] of overview) expect(revealed.get(id)?.path).toBe(route.path);
    }
  }, 15_000);

  test(`${id}: every focused course keeps clean routes`, () => {
    const data = getCurriculum(id);
    const relations = getRelations(id);
    for (const selected of new Set(
      relations.flatMap((relation) => [relation.source, relation.target]),
    )) {
      const map = buildMap(createMapLayout(data, relations), data.all, selected, () => {});
      verifyRoutes(
        routingNodes(map.nodes.filter((node) => node.type === "course")),
        mapConnections(map.edges, selected, null),
      );
    }
  });

  for (const withActivities of [false, true]) {
    test(`${id}: seven- and eight-semester roadmap routing, activities=${withActivities}`, () => {
      for (const lulus of [7, 8]) {
        const plan = buildRoadmap(
          validateRoadmapSearch({
            kurikulum: id,
            minat: id === "2021" ? "Lab Sistem Cerdas" : "Analisis Data",
            iup: withActivities ? "ya" : "tidak",
            paparan: withActivities ? "double" : undefined,
            magang: withActivities ? "ya" : "tidak",
            lulus,
          }),
        );
        const { nodes: graphNodes, edges } = buildRoadmapGraph({
          plan,
          target: lulus,
          summary: "Roadmap routing test",
          selectedId: null,
          choose: () => {},
          text: (key) => key,
        });
        const nodes = routingNodes(
          graphNodes.filter((node) => node.type !== "lane" && !node.hidden),
        );
        const semesters = new Map(plan.courses.map((item) => [item.course.id, item.semester]));
        for (const edge of edges)
          expect(semesters.get(edge.source)).not.toBe(semesters.get(edge.target));
        verifyRoutes(nodes, mapConnections(edges, null, null));
      }
    });
  }
}

test("connections cross an intervening column through a row gap without detouring above it", () => {
  const nodes = routingNodes([
    { id: "source", position: { x: 0, y: 0 } },
    { id: "middle-top", position: { x: 360, y: 0 } },
    { id: "middle-center", position: { x: 360, y: 120 } },
    { id: "middle-bottom", position: { x: 360, y: 240 } },
    { id: "target", position: { x: 720, y: 240 } },
  ]);
  const source = nodes[0];
  const target = nodes[4];
  const route = connectionRoutes(nodes, [
    { id: "source-target", source: source.id, target: target.id },
  ]).get("source-target")!;
  const length = route.points.slice(1).reduce((total, point, index) => {
    const previous = route.points[index];
    return total + Math.abs(point[0] - previous[0]) + Math.abs(point[1] - previous[1]);
  }, 0);
  expect(length).toBe(
    Math.abs(target.target.x - source.source.x) + Math.abs(target.target.y - source.source.y),
  );
});

test("pre-routing optional connections preserves base routes and includes every unrevealed edge", () => {
  const data = getCurriculum("2026");
  const map = buildMap(createMapLayout(data, getRelations("2026")), data.all, null, () => {});
  const nodes = routingNodes(map.nodes.filter((node) => node.type === "course"));
  const edges = mapConnections(map.edges, null, null);
  const visible = connectionRoutes(nodes, edges);
  const prepared = connectionRoutes(nodes, edges, { includeUnrevealed: true });
  expect(prepared.size).toBe(edges.filter((edge) => !edge.hidden).length);
  expect(prepared.size).toBeGreaterThan(visible.size);
  for (const [id, route] of visible) expect(prepared.get(id)?.path).toBe(route.path);
});

test("aligned prerequisites converge symmetrically at the center of the gap", () => {
  const nodes = routingNodes([
    { id: "upper", position: { x: 0, y: 0 } },
    { id: "lower", position: { x: 0, y: 240 } },
    { id: "target", position: { x: 360, y: 120 } },
  ]);
  const edges = [
    { id: "upper-target", source: "upper", target: "target" },
    { id: "lower-target", source: "lower", target: "target" },
  ];
  const routes = verifyRoutes(nodes, edges);
  expect(routes.get("upper-target")!.points).toEqual([
    [246, 41],
    [303, 41],
    [303, 161],
    [360, 161],
  ]);
  expect(routes.get("lower-target")!.points).toEqual([
    [246, 281],
    [303, 281],
    [303, 161],
    [360, 161],
  ]);
});
