import { expect, test } from "bun:test";
import { buildRoadmap } from "./planner.test-support";
import { validateRoadmapSearch } from "./search";
import { buildRoadmapGraph, getRoadmapGraph } from "./graph-layout";
import { electiveOptions } from "./options";

const text = (key: string) => key;
const choose = () => {};

for (const kurikulum of ["2021", "2026"] as const) {
  test(`${kurikulum}: the rendered roadmap includes activities and courses beyond the graduation target`, () => {
    const answers = validateRoadmapSearch({
      kurikulum,
      minat: kurikulum === "2021" ? "Lab Sistem Cerdas" : "Analisis Data",
      iup: "ya",
      paparan: "double",
      semesterPaparan: 6,
      magang: "tidak",
      lulus: 7,
    });
    const plan = buildRoadmap(answers);
    const graph = buildRoadmapGraph({
      plan,
      target: 7,
      summary: "My plan",
      selectedId: null,
      choose,
      text,
    });
    const courses = graph.nodes.filter((node) => node.type === "course");
    expect(courses.map((node) => node.id).sort()).toEqual(
      plan.courses.map((item) => item.course.id).sort(),
    );
    expect(graph.nodes.find((node) => node.id === "roadmap-title")?.data).toEqual({
      title: "Roadmap kuliah",
      summary: "My plan",
    });
    expect(graph.nodes.some((node) => node.id === "graduation-7")).toBe(true);
    for (const semester of [6, 7, 8]) {
      expect(graph.nodes.some((node) => node.id === `exposure-${semester}`)).toBe(true);
    }
    for (const node of graph.nodes.filter((node) => node.type === "activity")) {
      const semesterCourses = courses.filter((course) => course.position.x === node.position.x);
      expect(node.position.y).toBeGreaterThan(
        Math.max(0, ...semesterCourses.map((course) => course.position.y + 82)),
      );
    }
    const semesters = new Map(plan.courses.map((item) => [item.course.id, item.semester]));
    for (const edge of graph.edges) {
      expect(semesters.has(edge.source) && semesters.has(edge.target)).toBe(true);
      expect(semesters.get(edge.source)).not.toBe(semesters.get(edge.target));
    }
  });
}

test("elective replacement and course selection are reflected in the production graph", () => {
  const answers = validateRoadmapSearch({
    kurikulum: "2026",
    minat: "Analisis Data",
    iup: "tidak",
    magang: "tidak",
    lulus: 8,
  });
  const original = buildRoadmap(answers);
  const slot = original.courses.find((item) => item.kind === "elective")!;
  const replacement = electiveOptions("2026").find(
    (course) =>
      !original.courses.some((item) => item.course.id === course.id) &&
      !course.placements.some(
        (placement) => placement.section === "interest" && placement.group === answers.minat,
      ),
  )!;
  const plan = buildRoadmap({ ...answers, ganti: { [slot.originalId]: replacement.id } });
  const chosen: string[] = [];
  const graph = buildRoadmapGraph({
    plan,
    target: 8,
    summary: "",
    selectedId: replacement.id,
    choose: (id) => chosen.push(id),
    text,
  });
  expect(graph.nodes.some((node) => node.id === slot.course.id)).toBe(false);
  const node = graph.nodes.find((node) => node.id === replacement.id && node.type === "course");
  if (!node || node.type !== "course") throw new Error("Replacement course missing from graph");
  expect(node.data.state).toBe("selected");
  node.data.choose(node.id);
  expect(chosen).toEqual([replacement.id]);
  expect(graph.nodes.find((node) => node.id === "roadmap-title")?.hidden).toBe(true);
});

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

test("roadmap graph preparation is reused across visits and separated by locale and target", () => {
  const graph = getRoadmapGraph(input, "id");
  expect(getRoadmapGraph({ ...input }, "id")).toBe(graph);
  expect(getRoadmapGraph(input, "en")).not.toBe(graph);
  expect(getRoadmapGraph({ ...input, target: 7 }, "id")).not.toBe(graph);
});
