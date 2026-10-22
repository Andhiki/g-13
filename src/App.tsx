import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
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

type CourseNodeData = { kind: "course"; course: Course; selected: boolean; related: boolean; incoming: string[]; outgoing: string[]; choose: (id: string) => void };
type LaneNodeData = { kind: "lane"; title: string; subtitle: string; count: number; active: boolean };
type MapNode = Node<CourseNodeData, "course"> | Node<LaneNodeData, "lane">;
type Scope = "all" | "choices" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

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
  return [...new Set(course.placements.filter((placement) => placement.section === "core").map((placement) => placement.semester).filter((value): value is number => value !== null))].sort((a, b) => a - b);
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
  const terms = [...new Set(course.placements.map((placement) => placement.semesterLabel).filter(Boolean))];
  return terms.length ? "Semester " + terms.join(" / ") : "Semester tidak dinyatakan";
}

function requirementText(course: Course) {
  return [...new Set(course.placements.map((placement) => placement.prerequisiteRaw).filter((item) => item && item !== "-"))];
}

function sourceLocation(course: Course) {
  const locations = new Set<string>();
  for (const placement of course.placements) {
    if (placement.printedPage && placement.pdfPage) locations.add("Cetak hlm. " + placement.printedPage + " · PDF hlm. " + placement.pdfPage);
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
  const text = [course.title, course.englishTitle, course.code, ...course.placements.map((item) => item.group), ...course.placements.map((item) => item.prerequisiteRaw)].join(" ").toLocaleLowerCase("id");
  return text.includes(query.trim().toLocaleLowerCase("id"));
}

function initialState() {
  if (typeof window === "undefined") return { curriculum: "2026" as CurriculumId, courseId: null as string | null };
  const params = new URLSearchParams(window.location.search);
  const curriculum: CurriculumId = params.get("kurikulum") === "2021" ? "2021" : "2026";
  const requested = params.get("mk");
  const courseId = curricula[curriculum].all.some((item) => item.id === requested) ? requested : null;
  return { curriculum, courseId };
}

function updateUrl(curriculum: CurriculumId, courseId: string | null) {
  const params = new URLSearchParams(window.location.search);
  params.set("kurikulum", curriculum);
  if (courseId) params.set("mk", courseId);
  else params.delete("mk");
  window.history.replaceState({}, "", window.location.pathname + "?" + params.toString());
}

function CourseNode({ data }: NodeProps<Node<CourseNodeData, "course">>) {
  const course = data.course;
  const credit = creditsFor(course);
  const choiceGroup = course.placements.find((item) => item.section !== "core")?.group;
  return <div className={"course-node" + (data.selected ? " selected" : "") + (data.related ? "" : " dimmed") + (isCore(course) ? " core" : " choice")}>
    {data.incoming.map((id, index) => <Handle key={id} id={"in:" + id} type="target" position={Position.Left} style={{ top: `${((index + 1) / (data.incoming.length + 1)) * 100}%` }} />)}
    <button type="button" onClick={() => data.choose(course.id)} aria-label={"Buka detail " + course.title} aria-pressed={data.selected}>
      <span className="course-node-top"><i>{course.code || "Slot pilihan"}</i><i>{credit === null ? "—" : credit + " SKS"}</i></span>
      <strong>{course.title}</strong>
      <small>{choiceGroup || semesterLabel(course)}</small>
    </button>
    {data.outgoing.map((id, index) => <Handle key={id} id={"out:" + id} type="source" position={Position.Right} style={{ top: `${((index + 1) / (data.outgoing.length + 1)) * 100}%` }} />)}
  </div>;
}

function LaneNode({ data }: NodeProps<Node<LaneNodeData, "lane">>) {
  return <div className={"map-lane" + (data.active ? " active" : "")}>
    <div className="map-lane-heading"><strong>{data.title}</strong><span>{data.count} mata kuliah</span></div>
    <small>{data.subtitle}</small>
  </div>;
}

const nodeTypes: NodeTypes = { course: CourseNode, lane: LaneNode };

function allowedByGroup(course: Course, group: string) {
  if (isCore(course) || group === "__all__") return true;
  return course.placements.some((placement) => placement.section !== "core" && placement.group === group);
}

function coursesForScope(data: Curriculum, relations: Relation[], group: string, scope: Scope) {
  const eligible = data.all.filter((course) => allowedByGroup(course, group));
  if (scope === "all") return eligible;

  const seeds = new Set(eligible.filter((course) => {
    if (scope === "choices") return !isCore(course);
    return assignedCoreSemester(course) === Number(scope);
  }).map((course) => course.id));
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
): { nodes: MapNode[]; edges: Edge[]; positions: Map<string, { x: number; y: number }>; relationCount: number } {
  const visibleIds = new Set(visible.map((course) => course.id));
  const choiceStartX = LANE_X + 8 * LANE_STEP;
  const layoutCore = new Map<number, Course[]>();
  for (let term = 1; term <= 8; term += 1) {
    const courses = data.all.filter((course) => assignedCoreSemester(course) === term).sort((a, b) => a.title.localeCompare(b.title, "id"));
    layoutCore.set(term, courses);
  }
  const choices = data.all.filter((course) => !isCore(course)).sort((a, b) => {
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
      data: { kind: "lane", title: "Semester " + term, subtitle: "Mata kuliah wajib", count: inView, active: scope === String(term) },
      selectable: false,
      draggable: false,
      connectable: false,
    });
    courses.forEach((course, index) => {
      if (!visibleIds.has(course.id)) return;
      const position = { x: LANE_X + (term - 1) * LANE_STEP + COURSE_X_OFFSET, y: COURSE_Y_START + index * ROW_STEP };
      positions.set(course.id, position);
    });
  }

  const choiceHeight = Math.max(680, 180 + Math.ceil(choices.length / CHOICE_COLUMNS) * ROW_STEP);
  nodes.push({
    id: "lane-choices",
    type: "lane",
    position: { x: choiceStartX, y: 100 },
    style: { width: CHOICE_COLUMNS * LANE_WIDTH + (CHOICE_COLUMNS - 1) * (LANE_STEP - LANE_WIDTH), height: choiceHeight, zIndex: -1 },
    data: { kind: "lane", title: "Pilihan", subtitle: "Mata kuliah minat dan pilihan", count: choices.filter((course) => visibleIds.has(course.id)).length, active: scope === "choices" },
    selectable: false,
    draggable: false,
    connectable: false,
  });
  choices.forEach((course, index) => {
    if (!visibleIds.has(course.id)) return;
    const column = index % CHOICE_COLUMNS;
    const row = Math.floor(index / CHOICE_COLUMNS);
    const position = { x: choiceStartX + COURSE_X_OFFSET + column * LANE_STEP, y: COURSE_Y_START + row * ROW_STEP };
    positions.set(course.id, position);
  });

  const availableRelations = relations.filter((relation) => visibleIds.has(relation.source) && visibleIds.has(relation.target));
  const focusedRelations = selectedId ? availableRelations.filter((relation) => relation.source === selectedId || relation.target === selectedId) : [];
  const relatedIds = new Set(focusedRelations.flatMap((relation) => [relation.source, relation.target]));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const relation of focusedRelations) {
    outgoing.set(relation.source, [...(outgoing.get(relation.source) ?? []), relation.target]);
    incoming.set(relation.target, [...(incoming.get(relation.target) ?? []), relation.source]);
  }
  const byVerticalPosition = (left: string, right: string) => (positions.get(left)?.y ?? 0) - (positions.get(right)?.y ?? 0);
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

function ViewportFocus({ focusKey, focusTarget, scope, group, selectedId, positions }: { focusKey: string; focusTarget: CurriculumId; scope: Scope; group: string; selectedId: string | null; positions: Map<string, { x: number; y: number }> }) {
  const { setCenter } = useReactFlow();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedId) {
        const position = positions.get(selectedId);
        if (position) {
          const zoom = 0.88;
          const stageHeight = document.querySelector(".map-stage")?.getBoundingClientRect().height ?? window.innerHeight;
          const phoneOffset = window.matchMedia("(max-width: 650px)").matches ? Math.max(-120, (stageHeight / 2 - 140) / zoom) : 0;
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
        setCenter(LANE_X + (term - 1) * LANE_STEP + LANE_WIDTH / 2, 420, { zoom: 0.72, duration: 350 });
        return;
      }
      const phone = window.matchMedia("(max-width: 650px)").matches;
      setCenter(phone ? 250 : 900, 360, { zoom: phone ? 0.64 : focusTarget === "2021" ? 0.58 : 0.68, duration: 350 });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [focusKey, focusTarget, scope, group, selectedId, positions, setCenter]);
  return null;
}

function CourseDetails({ course, data, relations, select, close }: { course: Course; data: Curriculum; relations: Relation[]; select: (id: string) => void; close: () => void }) {
  const byId = useMemo(() => new Map(data.all.map((item) => [item.id, item])), [data]);
  const prereqs = relations.filter((item) => item.target === course.id).map((item) => byId.get(item.source)).filter((item): item is Course => Boolean(item));
  const next = relations.filter((item) => item.source === course.id).map((item) => byId.get(item.target)).filter((item): item is Course => Boolean(item));
  const labels = courseLabels(course);
  const requirements = requirementText(course);
  const locations = sourceLocation(course);
  const credit = creditsFor(course);
  return <aside className="detail-drawer" aria-label={"Detail " + course.title}>
    <div className="drawer-top"><div><small>Kurikulum {data.id} · {data.edition}</small><span className="drawer-state"><i />Terpilih di peta</span></div><button className="close" onClick={close} aria-label="Tutup detail" type="button">×</button></div>
    <div className="drawer-content">
      <span className="detail-code">{course.code || "Mata kuliah pilihan"}</span>
      <h2>{course.title}</h2>
      {course.englishTitle && <p className="english">{course.englishTitle}</p>}
      <div className="tags">{labels.map((label) => <span className={roleClass(label)} key={label}>{label}</span>)}</div>
      <div className="facts"><div><small>Semester panduan</small><strong>{semesterLabel(course).replace("Semester ", "")}</strong></div><div><small>Beban</small><strong>{credit === null ? "—" : credit + " SKS"}</strong></div></div>
      <section className="detail-section"><h3>Prasyarat pada sumber</h3>
        {requirements.length ? <ul className="raw-list">{requirements.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">Tabel sumber tidak mencantumkan prasyarat mata kuliah untuk baris ini.</p>}
        <p className="micro">Teks sumber dipertahankan apa adanya. Peta ini tidak menghitung kelayakan KRS pribadi.</p>
      </section>
      {(prereqs.length > 0 || next.length > 0) && <section className="detail-section"><h3>Relasi nama yang cocok</h3>
        {prereqs.length > 0 && <div className="related"><small>Prasyarat</small>{prereqs.map((item) => <button type="button" onClick={() => select(item.id)} key={item.id}><span>{item.title}</span><i>↗</i></button>)}</div>}
        {next.length > 0 && <div className="related"><small>Dirujuk sebagai prasyarat oleh</small>{next.map((item) => <button type="button" onClick={() => select(item.id)} key={item.id}><span>{item.title}</span><i>↗</i></button>)}</div>}
      </section>}
      <section className="detail-section source-detail"><h3>Lokasi sumber</h3><p>{data.sourceTitle}</p>
        {locations.length ? <ul>{locations.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">Lokasi baris belum dipetakan.</p>}
      </section>
      <details className="reading-notes"><summary>Cara membaca kurikulum {data.id}</summary>{data.readingNotes.map((note, index) => <p key={index}>{note}</p>)}</details>
    </div>
  </aside>;
}

export default function App() {
  const initial = useMemo(initialState, []);
  const [curriculum, setCurriculum] = useState<CurriculumId>(initial.curriculum);
  const [courseId, setCourseId] = useState<string | null>(initial.courseId);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initial.courseId));
  const [group, setGroup] = useState("__all__");
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");
  const data = curricula[curriculum];
  const relations = useMemo(() => deriveRelations(data), [data]);
  const visible = useMemo(() => coursesForScope(data, relations, group, scope), [data, relations, group, scope]);
  const visibleIds = useMemo(() => new Set(visible.map((course) => course.id)), [visible]);
  const selected = courseId && visibleIds.has(courseId) ? data.all.find((course) => course.id === courseId) ?? null : null;
  const searchResults = query.trim() ? data.all.filter((course) => matches(course, query)).slice(0, 8) : [];
  const selectedGroup = group;

  useEffect(() => {
    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const version: CurriculumId = params.get("kurikulum") === "2021" ? "2021" : "2026";
      const requested = params.get("mk");
      const found = requested && curricula[version].all.some((item) => item.id === requested) ? requested : null;
      setCurriculum(version);
      setCourseId(found);
      setDrawerOpen(Boolean(found));
      setGroup("__all__");
      setScope("all");
    };
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);

  useEffect(() => {
    if (courseId && !visibleIds.has(courseId)) {
      setCourseId(null);
      setDrawerOpen(false);
      updateUrl(curriculum, null);
    }
  }, [courseId, visibleIds, curriculum]);

  const selectCourse = useCallback((id: string) => {
    setCourseId(id);
    setDrawerOpen(true);
    updateUrl(curriculum, id);
  }, [curriculum]);

  const navigateToCourse = (id: string) => {
    setGroup("__all__");
    setScope("all");
    setCourseId(id);
    setDrawerOpen(true);
    updateUrl(curriculum, id);
  };

  const changeVersion = (event: ChangeEvent<HTMLSelectElement>) => {
    const version: CurriculumId = event.target.value === "2021" ? "2021" : "2026";
    setCurriculum(version);
    setCourseId(null);
    setDrawerOpen(false);
    setGroup("__all__");
    setScope("all");
    setQuery("");
    updateUrl(version, null);
  };

  const chooseSearchResult = (course: Course) => {
    setQuery("");
    navigateToCourse(course.id);
  };

  const changeGroup = (event: ChangeEvent<HTMLSelectElement>) => setGroup(event.target.value);
  const closeDetails = () => {
    setCourseId(null);
    setDrawerOpen(false);
    updateUrl(curriculum, null);
  };

  const map = useMemo(() => buildMap(data, visible, relations, selected?.id ?? null, scope, selectCourse), [data, visible, relations, selected?.id, scope, selectCourse]);
  const visibleEdges = map.edges.length;
  const focusKey = [curriculum, scope, selectedGroup, selected?.id ?? ""].join(":");
  const sourceLink = data.sourceUrl ? <a href={data.sourceUrl} target="_blank" rel="noreferrer">Sumber ↗</a> : <span>Sumber: {data.sourceTitle}</span>;

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Peta kurikulum Ilmu Komputer UGM"><span className="brand-mark">IK</span><span className="brand-copy"><b>Peta Kurikulum</b><small>Ilmu Komputer · UGM</small></span></a>
      <div className="topbar-right"><span className="community"><i />Proyek komunitas mahasiswa</span><label className="version-select"><span>Kurikulum</span><select value={curriculum} onChange={changeVersion}><option value="2021">2021 · Revisi 2023</option><option value="2026">2026</option></select></label></div>
    </header>

    <section className="map-toolbar" aria-label="Filter peta kurikulum">
      <div className="search-field"><label htmlFor="course-search">Cari mata kuliah</label><div className="search-wrap"><span aria-hidden="true">⌕</span><input id="course-search" type="search" placeholder="Nama, kode, prasyarat…" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" aria-controls="course-search-results" />{query && <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery("")}>×</button>}
        {query && <div className="search-results" id="course-search-results" role="listbox">{searchResults.length > 0 ? searchResults.map((course) => <button type="button" role="option" aria-selected={course.id === courseId} key={course.id} onClick={() => chooseSearchResult(course)}><i>{course.code || "Pilihan"}</i><span>{course.title}</span><small>{semesterLabel(course)}</small></button>) : <p className="search-empty">Tidak ada mata kuliah yang cocok.</p>}</div>}
      </div></div>
      <label className="field group-field"><span>Kelompok pilihan</span><select value={group} onChange={changeGroup}><option value="__all__">Semua mata kuliah</option>{data.groups.map((item) => <option value={item.name} key={item.name}>{item.name} ({item.count})</option>)}</select></label>
      <div className="semester-nav" aria-label="Fokus peta"><span>Fokus</span><div className="semester-options"><button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")} type="button">Semua</button>{[1, 2, 3, 4, 5, 6, 7, 8].map((value) => <button className={scope === String(value) ? "active" : ""} key={value} onClick={() => setScope(String(value) as Scope)} type="button">{value}</button>)}<button className={scope === "choices" ? "active" : ""} onClick={() => setScope("choices")} type="button">Pilihan</button></div></div>
    </section>

    <main className="map-stage">
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
        <ViewportFocus focusKey={focusKey} focusTarget={curriculum} scope={scope} group={group} selectedId={selected?.id ?? null} positions={map.positions} />
        <Background variant={BackgroundVariant.Dots} color="#cbd3c8" gap={24} size={1.2} />
        <MiniMap pannable zoomable nodeColor={(node) => node.type === "lane" ? "#dfe5db" : (node.data as CourseNodeData).selected ? "#923f4d" : "#849688"} maskColor="rgba(33, 48, 41, 0.08)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="canvas-caption"><div><strong>{scope === "all" ? "Peta kurikulum lengkap" : scope === "choices" ? "Mata kuliah pilihan" : "Semester " + scope}</strong><span>{visible.length} mata kuliah · {selected ? visibleEdges + " garis untuk " + selected.title : map.relationCount + " relasi tersedia"}</span></div><span className="canvas-hint">Geser untuk menjelajah · pilih mata kuliah untuk melihat garisnya</span></div>
      <div className="canvas-footer"><span><i className="legend-edge" />Prasyarat menuju mata kuliah berikutnya</span><span>{sourceLink}</span><small>{data.summary} · Semester panduan, bukan jadwal penawaran.</small></div>

      {drawerOpen && selected && <CourseDetails course={selected} data={data} relations={relations} select={navigateToCourse} close={closeDetails} />}
    </main>
  </div>;
}
