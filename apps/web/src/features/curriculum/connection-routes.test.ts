import { expect, test } from "bun:test";
import type { Edge, XYPosition } from "@xyflow/react";
import { getCurriculum, getRelations, listCurricula } from "@g13/curriculum";
import { buildMap } from "./map-layout";
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
      expect(
        Math.abs(a.x - b.x),
        `${a.id} and ${b.id} share a vertical lane`,
      ).toBeGreaterThanOrEqual(6);
    }
  return routes;
}

for (const { id } of listCurricula()) {
  test(`${id}: overview and every optional hover keep orthogonal, obstacle-free, separate vertical lanes`, () => {
    const data = getCurriculum(id);
    const map = buildMap(data, data.all, getRelations(id), null, () => {});
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
      const map = buildMap(data, data.all, relations, selected, () => {});
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

test("Jaringan Komputer reaches its practicum through a row gap without detouring above the column", () => {
  const data = getCurriculum("2026");
  const map = buildMap(data, data.all, getRelations("2026"), null, () => {});
  const nodes = routingNodes(map.nodes.filter((node) => node.type === "course"));
  const source = nodes.find((node) => node.id === "PACS262202")!;
  const target = nodes.find((node) => node.id === "PACS262418")!;
  const route = connectionRoutes(nodes, mapConnections(map.edges, null, null)).get(
    `${source.id}->${target.id}`,
  )!;
  const length = route.points.slice(1).reduce((total, point, index) => {
    const previous = route.points[index];
    return total + Math.abs(point[0] - previous[0]) + Math.abs(point[1] - previous[1]);
  }, 0);
  expect(length).toBe(
    Math.abs(target.target.x - source.source.x) + Math.abs(target.target.y - source.source.y),
  );
});
