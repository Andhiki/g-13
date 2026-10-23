import { getRouteApi, Link } from "@tanstack/react-router";
import { ThemeSwitch } from "./ui/theme-switch";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowDownSLine, RiSearchLine } from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  dropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { tv } from "tailwind-variants";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  curricula,
  deriveRelations,
  type Course,
  type Curriculum,
  type CurriculumId,
  type Relation,
} from "./data";

type CourseNodeData = {
  kind: "course";
  course: Course;
  selected: boolean;
  related: boolean;
  incoming: string[];
  outgoing: string[];
  choose: (id: string) => void;
};
type LaneNodeData = {
  kind: "lane";
  title: string;
  subtitle: string;
  count: number;
  active: boolean;
};
type MapNode = Node<CourseNodeData, "course"> | Node<LaneNodeData, "lane">;
type Scope = "all" | "choices" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

const semesterOption = tv({
  base: "h-9 min-w-8 shrink-0 cursor-pointer rounded-lg border border-transparent bg-transparent px-2 text-label-sm text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-base max-[650px]:h-11 max-[650px]:px-1.5",
  variants: {
    active: {
      true: "border-stroke-soft-200 bg-bg-white-0 font-medium text-text-strong-950 shadow-regular-xs",
    },
    wide: { true: "px-2.5 max-[650px]:px-2" },
  },
});

const LANE_X = 48;
const LANE_STEP = 300;
const LANE_WIDTH = 270;
const CHOICE_COLUMNS = 3;
const ROW_STEP = 112;
const COURSE_X_OFFSET = 12;
const COURSE_Y_START = 180;

function isCore(course: Course) {
  return course.placements.some((placement) => placement.section === "core");
}

function coreSemesters(course: Course) {
  return [
    ...new Set(
      course.placements
        .filter((placement) => placement.section === "core")
        .map((placement) => placement.semester)
        .filter((value): value is number => value !== null),
    ),
  ].sort((a, b) => a - b);
}

function assignedCoreSemester(course: Course) {
  return coreSemesters(course)[0] ?? null;
}

function creditsFor(course: Course) {
  return course.placements.find((placement) => placement.credits !== null)?.credits ?? null;
}

function courseLabels(course: Course) {
  return [...new Set(course.placements.map((placement) => placement.label).filter(Boolean))];
}

function semesterLabel(course: Course) {
  const terms = [
    ...new Set(course.placements.map((placement) => placement.semesterLabel).filter(Boolean)),
  ];
  return terms.length ? "Semester " + terms.join(" / ") : "Semester tidak dinyatakan";
}

function requirementText(course: Course) {
  return [
    ...new Set(
      course.placements
        .map((placement) => placement.prerequisiteRaw)
        .filter((item) => item && item !== "-"),
    ),
  ];
}

function sourceLocation(course: Course) {
  const locations = new Set<string>();
  for (const placement of course.placements) {
    if (placement.printedPage && placement.pdfPage)
      locations.add("Cetak hlm. " + placement.printedPage + " · PDF hlm. " + placement.pdfPage);
    else if (placement.printedPage) locations.add("Cetak hlm. " + placement.printedPage);
    else if (placement.pdfPage) locations.add("PDF hlm. " + placement.pdfPage);
  }
  return [...locations];
}

function roleClass(label: string) {
  if (label.includes("minat")) return label.includes("Wajib") ? "tag gold" : "tag green";
  if (label.includes("pilihan") || label.includes("Slot")) return "tag sand";
  return "tag wine";
}

function matches(course: Course, query: string) {
  const text = [
    course.title,
    course.englishTitle,
    course.code,
    ...course.placements.map((item) => item.group),
    ...course.placements.map((item) => item.prerequisiteRaw),
  ]
    .join(" ")
    .toLocaleLowerCase("id");
  return text.includes(query.trim().toLocaleLowerCase("id"));
}

const route = getRouteApi("/");

function CourseNode({ data }: NodeProps<Node<CourseNodeData, "course">>) {
  const course = data.course;
  const credit = creditsFor(course);
  const choiceGroup = course.placements.find((item) => item.section !== "core")?.group;
  return (
    <div
      className={
        "course-node" +
        (data.selected ? " selected" : "") +
        (data.related ? "" : " dimmed") +
        (isCore(course) ? " core" : " choice")
      }
    >
      {data.incoming.map((id, index) => (
        <Handle
          key={id}
          id={"in:" + id}
          type="target"
          position={Position.Left}
          style={{ top: `${((index + 1) / (data.incoming.length + 1)) * 100}%` }}
        />
      ))}
      <button
        type="button"
        onClick={() => data.choose(course.id)}
        aria-label={"Buka detail " + course.title}
        aria-pressed={data.selected}
      >
        <span className="course-node-top">
          <i>{course.code || "Slot pilihan"}</i>
          <i>{credit === null ? "—" : credit + " SKS"}</i>
        </span>
        <strong>{course.title}</strong>
        <small>{choiceGroup || semesterLabel(course)}</small>
      </button>
      {data.outgoing.map((id, index) => (
        <Handle
          key={id}
          id={"out:" + id}
          type="source"
          position={Position.Right}
          style={{ top: `${((index + 1) / (data.outgoing.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}

function LaneNode({ data }: NodeProps<Node<LaneNodeData, "lane">>) {
  return (
    <div className={"map-lane" + (data.active ? " active" : "")}>
      <div className="map-lane-heading">
        <strong>{data.title}</strong>
        <span>{data.count} mata kuliah</span>
      </div>
      <small>{data.subtitle}</small>
    </div>
  );
}

const nodeTypes: NodeTypes = { course: CourseNode, lane: LaneNode };

function allowedByGroup(course: Course, group: string) {
  if (isCore(course) || group === "__all__") return true;
  return course.placements.some(
    (placement) => placement.section !== "core" && placement.group === group,
  );
}

function coursesForScope(data: Curriculum, relations: Relation[], group: string, scope: Scope) {
  const eligible = data.all.filter((course) => allowedByGroup(course, group));
  if (scope === "all") return eligible;

  const seeds = new Set(
    eligible
      .filter((course) => {
        if (scope === "choices") return !isCore(course);
        return assignedCoreSemester(course) === Number(scope);
      })
      .map((course) => course.id),
  );
  const visible = new Set(seeds);
  for (const relation of relations) {
    if (seeds.has(relation.source) || seeds.has(relation.target)) {
      if (eligible.some((course) => course.id === relation.source)) visible.add(relation.source);
      if (eligible.some((course) => course.id === relation.target)) visible.add(relation.target);
    }
  }
  return eligible.filter((course) => visible.has(course.id));
}

function buildMap(
  data: Curriculum,
  visible: Course[],
  relations: Relation[],
  selectedId: string | null,
  scope: Scope,
  choose: (id: string) => void,
): {
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
  relationCount: number;
} {
  const visibleIds = new Set(visible.map((course) => course.id));
  const choiceStartX = LANE_X + 8 * LANE_STEP;
  const layoutCore = new Map<number, Course[]>();
  for (let term = 1; term <= 8; term += 1) {
    const courses = data.all
      .filter((course) => assignedCoreSemester(course) === term)
      .sort((a, b) => a.title.localeCompare(b.title, "id"));
    layoutCore.set(term, courses);
  }
  const choices = data.all
    .filter((course) => !isCore(course))
    .sort((a, b) => {
      const aGroup = a.placements.find((item) => item.section !== "core")?.group ?? "";
      const bGroup = b.placements.find((item) => item.section !== "core")?.group ?? "";
      return aGroup.localeCompare(bGroup, "id") || a.title.localeCompare(b.title, "id");
    });

  const nodes: MapNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  for (let term = 1; term <= 8; term += 1) {
    const courses = layoutCore.get(term) ?? [];
    const inView = courses.filter((course) => visibleIds.has(course.id)).length;
    const height = Math.max(680, 180 + courses.length * ROW_STEP);
    nodes.push({
      id: "lane-semester-" + term,
      type: "lane",
      position: { x: LANE_X + (term - 1) * LANE_STEP, y: 100 },
      style: { width: LANE_WIDTH, height, zIndex: -1 },
      data: {
        kind: "lane",
        title: "Semester " + term,
        subtitle: "Mata kuliah wajib",
        count: inView,
        active: scope === String(term),
      },
      selectable: false,
      draggable: false,
      connectable: false,
    });
    courses.forEach((course, index) => {
      if (!visibleIds.has(course.id)) return;
      const position = {
        x: LANE_X + (term - 1) * LANE_STEP + COURSE_X_OFFSET,
        y: COURSE_Y_START + index * ROW_STEP,
      };
      positions.set(course.id, position);
    });
  }

  const choiceHeight = Math.max(680, 180 + Math.ceil(choices.length / CHOICE_COLUMNS) * ROW_STEP);
  nodes.push({
    id: "lane-choices",
    type: "lane",
    position: { x: choiceStartX, y: 100 },
    style: {
      width: CHOICE_COLUMNS * LANE_WIDTH + (CHOICE_COLUMNS - 1) * (LANE_STEP - LANE_WIDTH),
      height: choiceHeight,
      zIndex: -1,
    },
    data: {
      kind: "lane",
      title: "Pilihan",
      subtitle: "Mata kuliah minat dan pilihan",
      count: choices.filter((course) => visibleIds.has(course.id)).length,
      active: scope === "choices",
    },
    selectable: false,
    draggable: false,
    connectable: false,
  });
  choices.forEach((course, index) => {
    if (!visibleIds.has(course.id)) return;
    const column = index % CHOICE_COLUMNS;
    const row = Math.floor(index / CHOICE_COLUMNS);
    const position = {
      x: choiceStartX + COURSE_X_OFFSET + column * LANE_STEP,
      y: COURSE_Y_START + row * ROW_STEP,
    };
    positions.set(course.id, position);
  });

  const availableRelations = relations.filter(
    (relation) => visibleIds.has(relation.source) && visibleIds.has(relation.target),
  );
  const focusedRelations = selectedId
    ? availableRelations.filter(
        (relation) => relation.source === selectedId || relation.target === selectedId,
      )
    : [];
  const relatedIds = new Set(
    focusedRelations.flatMap((relation) => [relation.source, relation.target]),
  );
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const relation of focusedRelations) {
    outgoing.set(relation.source, [...(outgoing.get(relation.source) ?? []), relation.target]);
    incoming.set(relation.target, [...(incoming.get(relation.target) ?? []), relation.source]);
  }
  const byVerticalPosition = (left: string, right: string) =>
    (positions.get(left)?.y ?? 0) - (positions.get(right)?.y ?? 0);
  for (const course of visible) {
    const position = positions.get(course.id);
    if (!position) continue;
    nodes.push({
      id: course.id,
      type: "course",
      position,
      data: {
        kind: "course",
        course,
        selected: course.id === selectedId,
        related: !selectedId || relatedIds.has(course.id),
        incoming: (incoming.get(course.id) ?? []).sort(byVerticalPosition),
        outgoing: (outgoing.get(course.id) ?? []).sort(byVerticalPosition),
        choose,
      },
      zIndex: 2,
    });
  }

  const edges: Edge[] = focusedRelations.map((relation) => {
    const isPrerequisite = relation.target === selectedId;
    const color = isPrerequisite ? "#8f3e4c" : "#718679";
    return {
      id: relation.source + "->" + relation.target,
      source: relation.source,
      sourceHandle: "out:" + relation.target,
      target: relation.target,
      targetHandle: "in:" + relation.source,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: isPrerequisite ? "#a64e5c" : "#829789", strokeWidth: 1.8, opacity: 0.9 },
    };
  });
  return { nodes, edges, positions, relationCount: availableRelations.length };
}

function ViewportFocus({
  focusKey,
  focusTarget,
  scope,
  group,
  selectedId,
  positions,
}: {
  focusKey: string;
  focusTarget: CurriculumId;
  scope: Scope;
  group: string;
  selectedId: string | null;
  positions: Map<string, { x: number; y: number }>;
}) {
  const { setCenter } = useReactFlow();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedId) {
        const position = positions.get(selectedId);
        if (position) {
          const zoom = 0.88;
          const stageHeight =
            document.querySelector(".map-stage")?.getBoundingClientRect().height ??
            window.innerHeight;
          const phoneOffset = window.matchMedia("(max-width: 650px)").matches
            ? Math.max(-120, (stageHeight / 2 - 140) / zoom)
            : 0;
          setCenter(position.x + 124, position.y + 48 + phoneOffset, { zoom, duration: 350 });
        }
        return;
      }
      if (scope === "choices" || group !== "__all__") {
        setCenter(LANE_X + 8 * LANE_STEP + 430, 350, { zoom: 0.58, duration: 350 });
        return;
      }
      if (scope !== "all") {
        const term = Number(scope);
        setCenter(LANE_X + (term - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: 350,
        });
        return;
      }
      const phone = window.matchMedia("(max-width: 650px)").matches;
      setCenter(phone ? 250 : 900, 360, {
        zoom: phone ? 0.64 : focusTarget === "2021" ? 0.58 : 0.68,
        duration: 350,
      });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [focusKey, focusTarget, scope, group, selectedId, positions, setCenter]);
  return null;
}

function CourseDetails({
  course,
  data,
  relations,
  select,
  close,
}: {
  course: Course;
  data: Curriculum;
  relations: Relation[];
  select: (id: string) => void;
  close: () => void;
}) {
  const byId = useMemo(() => new Map(data.all.map((item) => [item.id, item])), [data]);
  const prereqs = relations
    .filter((item) => item.target === course.id)
    .map((item) => byId.get(item.source))
    .filter((item): item is Course => Boolean(item));
  const next = relations
    .filter((item) => item.source === course.id)
    .map((item) => byId.get(item.target))
    .filter((item): item is Course => Boolean(item));
  const labels = courseLabels(course);
  const requirements = requirementText(course);
  const locations = sourceLocation(course);
  const credit = creditsFor(course);
  return (
    <aside className="detail-drawer" aria-label={"Detail " + course.title}>
      <div className="drawer-top">
        <div>
          <small>
            Kurikulum {data.id} · {data.edition}
          </small>
          <span className="drawer-state">
            <i />
            Terpilih di peta
          </span>
        </div>
        <button className="close" onClick={close} aria-label="Tutup detail" type="button">
          ×
        </button>
      </div>
      <div className="drawer-content">
        <span className="detail-code">{course.code || "Mata kuliah pilihan"}</span>
        <h2>{course.title}</h2>
        {course.englishTitle && <p className="english">{course.englishTitle}</p>}
        <div className="tags">
          {labels.map((label) => (
            <span className={roleClass(label)} key={label}>
              {label}
            </span>
          ))}
        </div>
        <div className="facts">
          <div>
            <small>Semester panduan</small>
            <strong>{semesterLabel(course).replace("Semester ", "")}</strong>
          </div>
          <div>
            <small>Beban</small>
            <strong>{credit === null ? "—" : credit + " SKS"}</strong>
          </div>
        </div>
        <section className="detail-section">
          <h3>Prasyarat pada sumber</h3>
          {requirements.length ? (
            <ul className="raw-list">
              {requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Tabel sumber tidak mencantumkan prasyarat mata kuliah untuk baris ini.
            </p>
          )}
          <p className="micro">
            Teks sumber dipertahankan apa adanya. Peta ini tidak menghitung kelayakan KRS pribadi.
          </p>
        </section>
        {(prereqs.length > 0 || next.length > 0) && (
          <section className="detail-section">
            <h3>Relasi nama yang cocok</h3>
            {prereqs.length > 0 && (
              <div className="related">
                <small>Prasyarat</small>
                {prereqs.map((item) => (
                  <button type="button" onClick={() => select(item.id)} key={item.id}>
                    <span>{item.title}</span>
                    <i>↗</i>
                  </button>
                ))}
              </div>
            )}
            {next.length > 0 && (
              <div className="related">
                <small>Dirujuk sebagai prasyarat oleh</small>
                {next.map((item) => (
                  <button type="button" onClick={() => select(item.id)} key={item.id}>
                    <span>{item.title}</span>
                    <i>↗</i>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
        <section className="detail-section source-detail">
          <h3>Lokasi sumber</h3>
          <p>{data.sourceTitle}</p>
          {locations.length ? (
            <ul>
              {locations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Lokasi baris belum dipetakan.</p>
          )}
        </section>
        <details className="reading-notes">
          <summary>Cara membaca kurikulum {data.id}</summary>
          {data.readingNotes.map((note, index) => (
            <p key={index}>{note}</p>
          ))}
        </details>
      </div>
    </aside>
  );
}

export default function App() {
  const { kurikulum: curriculum, mk } = route.useSearch();
  const courseId = mk ?? null;
  const navigate = route.useNavigate();
  const updateUrl = useCallback(
    (version: CurriculumId, id: string | null) => {
      void navigate({ search: { kurikulum: version, mk: id ?? undefined }, replace: true });
    },
    [navigate],
  );
  const [group, setGroup] = useState("__all__");
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const data = curricula[curriculum];
  const relations = useMemo(() => deriveRelations(data), [data]);
  const visible = useMemo(
    () => coursesForScope(data, relations, group, scope),
    [data, relations, group, scope],
  );
  const visibleIds = useMemo(() => new Set(visible.map((course) => course.id)), [visible]);
  const selected =
    courseId && visibleIds.has(courseId)
      ? (data.all.find((course) => course.id === courseId) ?? null)
      : null;
  const searchResults = query.trim()
    ? data.all.filter((course) => matches(course, query)).slice(0, 8)
    : [];
  const selectedGroup = group;

  useEffect(() => {
    if (courseId && !visibleIds.has(courseId)) {
      updateUrl(curriculum, null);
    }
  }, [courseId, visibleIds, curriculum, updateUrl]);

  const selectCourse = useCallback(
    (id: string) => {
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );

  const navigateToCourse = (id: string) => {
    setGroup("__all__");
    setScope("all");
    updateUrl(curriculum, id);
  };

  const changeVersion = (value: string) => {
    const version: CurriculumId = value === "2021" ? "2021" : "2026";
    setGroup("__all__");
    setScope("all");
    setQuery("");
    updateUrl(version, null);
  };

  const chooseSearchResult = (course: Course) => {
    setQuery("");
    navigateToCourse(course.id);
  };

  const changeGroup = (value: string) => setGroup(value);
  const closeDetails = () => {
    updateUrl(curriculum, null);
  };

  const map = useMemo(
    () => buildMap(data, visible, relations, selected?.id ?? null, scope, selectCourse),
    [data, visible, relations, selected?.id, scope, selectCourse],
  );
  const visibleEdges = map.edges.length;
  const focusKey = [curriculum, scope, selectedGroup, selected?.id ?? ""].join(":");
  const sourceLink = data.sourceUrl ? (
    <a href={data.sourceUrl} target="_blank" rel="noreferrer">
      Sumber ↗
    </a>
  ) : (
    <span>Sumber: {data.sourceTitle}</span>
  );

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg-white-0">
      <header className="z-10 flex shrink-0 basis-16 items-center justify-between gap-5 border-b border-stroke-soft-200 bg-bg-white-0 px-[25px] text-text-strong-950 max-[1050px]:px-[17px] max-[700px]:relative max-[700px]:min-h-28 max-[700px]:basis-auto max-[700px]:flex-wrap max-[700px]:gap-2 max-[700px]:px-4 max-[700px]:py-3">
        <Link
          className="inline-flex items-center gap-3 text-text-strong-950 no-underline max-[700px]:gap-2.5"
          to="/"
          search={{ kurikulum: "2026" }}
          aria-label="Peta kurikulum Ilmu Komputer UGM"
        >
          <span className="grid size-9 place-items-center rounded-lg border border-primary-light bg-primary-lighter text-sm font-medium text-primary-base">
            IK
          </span>
          <span className="flex flex-col gap-0.5">
            <h1 className="m-0 text-label-sm">Peta Kurikulum</h1>
            <small className="text-paragraph-xs text-text-sub-600">Ilmu Komputer · UGM</small>
          </span>
        </Link>
        <div className="flex items-center gap-2.5 max-[700px]:w-full max-[700px]:justify-between max-[700px]:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={dropdownMenuTrigger({ mobile: true })}
              aria-label={`Versi kurikulum: ${curriculum === "2021" ? "2021, Revisi 2023" : "2026"}`}
            >
              <span>Kurikulum {curriculum === "2021" ? "2021 · Revisi 2023" : "2026"}</span>
              <RiArrowDownSLine aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" aria-label="Pilih versi kurikulum">
              <DropdownMenuRadioGroup value={curriculum} onValueChange={changeVersion}>
                <DropdownMenuRadioItem value="2021">
                  <span>2021 · Revisi 2023</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="2026">
                  <span>2026</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeSwitch />
        </div>
      </header>

      <section
        className="z-[8] grid min-h-[77px] shrink-0 grid-cols-[minmax(230px,300px)_minmax(205px,250px)_minmax(350px,1fr)] items-center gap-3.5 border-b border-stroke-soft-200 bg-bg-weak-25 px-6 py-2.5 text-text-strong-950 max-[1050px]:min-h-[105px] max-[1050px]:grid-cols-[minmax(190px,1fr)_minmax(175px,0.9fr)] max-[1050px]:gap-x-3 max-[1050px]:gap-y-[9px] max-[1050px]:px-[17px] max-[650px]:min-h-[111px] max-[650px]:grid-cols-2 max-[650px]:gap-2 max-[650px]:px-[11px] max-[650px]:pt-2 max-[650px]:pb-[7px]"
        aria-label="Filter peta kurikulum"
      >
        <div className="relative flex min-w-0 flex-col gap-[5px]">
          <label
            className="text-label-xs font-medium leading-4 text-text-sub-600"
            htmlFor="course-search"
          >
            Cari mata kuliah
          </label>
          <div className="relative flex h-10 items-center rounded-lg border border-stroke-soft-200 bg-bg-white-0 shadow-regular-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-base max-[650px]:min-h-11">
            <RiSearchLine
              className="mx-[9px] ml-[11px] size-[18px] shrink-0 text-text-sub-600"
              aria-hidden="true"
            />
            <input
              className="h-[38px] min-w-0 w-full border-0 bg-transparent py-0 pr-10 pl-0 text-paragraph-sm text-text-strong-950 outline-none placeholder:text-text-soft-400 focus-visible:outline-none max-[650px]:h-[42px] max-[650px]:text-paragraph-xs"
              id="course-search"
              type="search"
              role="combobox"
              aria-autocomplete="list"
              placeholder="Nama, kode, prasyarat…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveSearchIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("");
                  setActiveSearchIndex(0);
                  return;
                }
                if (!searchResults.length) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSearchIndex((index) => (index + 1) % searchResults.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSearchIndex(
                    (index) => (index - 1 + searchResults.length) % searchResults.length,
                  );
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  chooseSearchResult(searchResults[activeSearchIndex]);
                }
              }}
              autoComplete="off"
              aria-expanded={Boolean(query) && searchResults.length > 0}
              aria-haspopup="listbox"
              aria-controls={
                query && searchResults.length > 0 ? "course-search-results" : undefined
              }
              aria-activedescendant={
                query && searchResults.length > 0
                  ? `course-search-option-${activeSearchIndex}`
                  : undefined
              }
            />
            {query && (
              <button
                className="absolute right-1 grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-lg text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
            {query && (
              <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 max-h-[min(360px,55vh)] overflow-auto rounded-[10px] border border-stroke-soft-200 bg-bg-white-0 shadow-regular-md">
                {searchResults.length > 0 ? (
                  <div
                    id="course-search-results"
                    role="listbox"
                    aria-label="Hasil pencarian mata kuliah"
                  >
                    {searchResults.map((course, index) => (
                      <div
                        className="grid min-h-[52px] w-full cursor-pointer grid-cols-[90px_1fr] items-center gap-x-[9px] gap-y-1 border-x-0 border-t-0 border-b border-stroke-soft-200 bg-transparent px-[11px] py-[9px] text-left hover:bg-bg-weak-50 aria-selected:bg-bg-weak-50"
                        id={`course-search-option-${index}`}
                        role="option"
                        aria-selected={index === activeSearchIndex}
                        key={course.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveSearchIndex(index)}
                        onClick={() => chooseSearchResult(course)}
                      >
                        <i className="overflow-hidden text-ellipsis whitespace-nowrap text-label-xs not-italic text-text-sub-600">
                          {course.code || "Pilihan"}
                        </i>
                        <span className="text-paragraph-sm text-text-strong-950">
                          {course.title}
                        </span>
                        <small className="col-start-2 text-label-xs text-text-sub-600">
                          {semesterLabel(course)}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 p-3.5 text-paragraph-sm text-text-sub-600" role="status">
                    Tidak ada mata kuliah yang cocok.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="relative flex min-w-0 flex-col gap-[5px]">
          <span className="text-label-xs font-medium leading-4 text-text-sub-600">
            Kelompok pilihan
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={dropdownMenuTrigger({ full: true, touch: true })}
              aria-label={`Kelompok pilihan: ${group === "__all__" ? "Semua mata kuliah" : group}`}
            >
              <span>{group === "__all__" ? "Semua mata kuliah" : group}</span>
              <RiArrowDownSLine aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              aria-label="Pilih kelompok mata kuliah"
              className="max-h-[min(360px,calc(100dvh-32px))] overflow-y-auto"
            >
              <DropdownMenuRadioGroup value={group} onValueChange={changeGroup}>
                <DropdownMenuRadioItem value="__all__">
                  <span>Semua mata kuliah</span>
                </DropdownMenuRadioItem>
                {data.groups.map((item) => (
                  <DropdownMenuRadioItem value={item.name} key={item.name}>
                    <span>
                      {item.name} ({item.count})
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex min-w-0 items-center gap-2.5 max-[1050px]:col-span-full max-[650px]:gap-[7px]">
          <span className="shrink-0 text-label-xs font-medium leading-4 text-text-sub-600">
            Fokus
          </span>
          <div
            className="flex min-w-0 w-full items-center gap-[3px] overflow-x-auto p-[3px] [scrollbar-width:thin] max-[650px]:gap-px max-[650px]:p-px"
            role="group"
            aria-label="Fokus semester"
          >
            <button
              className={semesterOption({ active: scope === "all", wide: true })}
              aria-pressed={scope === "all"}
              onClick={() => setScope("all")}
              type="button"
            >
              Semua
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
              <button
                className={semesterOption({ active: scope === String(value) })}
                aria-pressed={scope === String(value)}
                key={value}
                onClick={() => setScope(String(value) as Scope)}
                type="button"
              >
                {value}
              </button>
            ))}
            <button
              className={semesterOption({ active: scope === "choices", wide: true })}
              aria-pressed={scope === "choices"}
              onClick={() => setScope("choices")}
              type="button"
            >
              Pilihan
            </button>
          </div>
        </div>
      </section>

      <main className="map-stage scheme-light text-[var(--ink)]">
        <ReactFlow<MapNode, Edge>
          key={curriculum}
          nodes={map.nodes}
          edges={map.edges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 10, y: 0, zoom: 0.68 }}
          minZoom={0.18}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          fitView={false}
          aria-label="Peta kurikulum Ilmu Komputer UGM"
        >
          <ViewportFocus
            focusKey={focusKey}
            focusTarget={curriculum}
            scope={scope}
            group={group}
            selectedId={selected?.id ?? null}
            positions={map.positions}
          />
          <Background variant={BackgroundVariant.Dots} color="#cbd3c8" gap={24} size={1.2} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) =>
              node.type === "lane"
                ? "#dfe5db"
                : (node.data as CourseNodeData).selected
                  ? "#923f4d"
                  : "#849688"
            }
            maskColor="rgba(33, 48, 41, 0.08)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>

        <div className="canvas-caption">
          <div>
            <strong>
              {scope === "all"
                ? "Peta kurikulum lengkap"
                : scope === "choices"
                  ? "Mata kuliah pilihan"
                  : "Semester " + scope}
            </strong>
            <span>
              {visible.length} mata kuliah ·{" "}
              {selected
                ? visibleEdges + " garis untuk " + selected.title
                : map.relationCount + " relasi tersedia"}
            </span>
          </div>
          <span className="canvas-hint">
            Geser untuk menjelajah · pilih mata kuliah untuk melihat garisnya
          </span>
        </div>
        <div className="canvas-footer">
          <span>
            <i className="legend-edge" />
            Prasyarat menuju mata kuliah berikutnya
          </span>
          <span>{sourceLink}</span>
          <small>{data.summary} · Semester panduan, bukan jadwal penawaran.</small>
        </div>

        {selected && (
          <CourseDetails
            course={selected}
            data={data}
            relations={relations}
            select={navigateToCourse}
            close={closeDetails}
          />
        )}
      </main>
    </div>
  );
}
