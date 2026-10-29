import { expect, test } from "bun:test";
import { buildRoadmapGraph } from "./graph-layout";
import { buildRoadmap } from "./planner.test-support";
import { validateRoadmapSearch } from "./search";

const plan = buildRoadmap(
  validateRoadmapSearch({
    kurikulum: "2026",
    minat: "Analisis Data",
    iup: "ya",
    paparan: "double",
    magang: "ya",
    lulus: 8,
  }),
);
const input = {
  plan,
  target: 8,
  summary: "My roadmap",
  selectedId: null,
  choose: () => {},
  text: (key: string) => key,
};

test("roadmap graph includes planned courses, activities, title, and graduation without changing the plan", () => {
  const before = structuredClone(plan);
  const graph = buildRoadmapGraph(input);
  expect(
    graph.nodes
      .filter((node) => node.type === "course")
      .map((node) => node.id)
      .sort(),
  ).toEqual(plan.courses.map((item) => item.course.id).sort());
  expect(graph.nodes.find((node) => node.type === "title")).toMatchObject({
    hidden: false,
    data: { summary: input.summary },
  });
  for (const activity of plan.activities) {
    expect(
      graph.nodes.find((node) => node.id === `${activity.id}-${activity.semester}`),
    ).toMatchObject({
      type: "activity",
      data: { activity },
    });
  }
  for (const semester of [5, 6, 7, 8]) {
    expect(graph.nodes.some((node) => node.id === `exposure-${semester}`)).toBe(true);
  }
  expect(graph.nodes.find((node) => node.id === "graduation-8")).toMatchObject({
    type: "activity",
    data: { activity: { semester: 8 } },
  });
  expect(graph.nodes.filter((node) => node.type === "lane")).toHaveLength(graph.semesters.length);
  expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(graph.nodes.length);
  expect(plan).toEqual(before);
});

test("selecting a course preserves placement and selection callbacks while highlighting its direct relations", () => {
  const overview = buildRoadmapGraph(input);
  const edge = overview.edges[0]!;
  const chosen: string[] = [];
  const graph = buildRoadmapGraph({
    ...input,
    selectedId: edge.source,
    choose: (id) => chosen.push(id),
  });
  expect(graph.nodes.map((node) => node.position)).toEqual(
    overview.nodes.map((node) => node.position),
  );
  expect(graph.nodes.find((node) => node.type === "title")?.hidden).toBe(true);
  for (const node of graph.nodes) {
    if (node.type !== "course") continue;
    if (node.id === edge.source) expect(node.data.state).toBe("selected");
    if (node.id === edge.target) expect(node.data.state).toBe("dependent");
    if (node.id === edge.target) node.data.choose(node.id);
  }
  expect(chosen).toEqual([edge.target]);
  expect(graph.edges.find((item) => item.id === edge.id)?.style).toMatchObject({
    stroke: "var(--color-primary-base)",
    strokeWidth: 2.2,
  });
});
