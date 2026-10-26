# Component structure

The curriculum page is organized as a feature under `src/features/curriculum/`.
Keep files under roughly 300 lines by default; larger files need a clear reason.

## Curriculum feature

- The `/` route renders `CurriculumPage` directly.
- `CurriculumPage` composes the page controls, map or list, and course detail drawer.
- `useCurriculumExplorer` owns URL-backed curriculum and selected-course state,
  plus shared filters and map/list view. Components receive values and callbacks
  through props.
- `Overlay` owns the fixed navigation and controls placement, including the
  responsive positioning of its children. It receives navigation and controls
  from the page and does not import curriculum controls.
- On desktop, equal flex regions leave the left side empty and center the semester
  button group. Theme and search sit at the top right, with search furthest right.
  A filter card below contains labeled curriculum version and choice group controls. Search and the card have equal widths. Map captions and explanatory
  footer text are omitted.
  Below 1100px, controls stack into separate rows to avoid overlap.
- `SemesterFilter`, `CourseSearch`, and the filters in `CourseFilters.tsx` own their UI.
  Search owns its query and dialog-open state; it is keyed by curriculum so a
  curriculum change clears an active search. Selecting a result resets filters
  and updates the selected course URL.
- `SemesterFilter` renders buttons 1–8. Selecting a semester applies the existing
  scope filter; selecting it again clears the filter. Highlights reflect selection,
  not the map viewport. Viewport-driven highlighting is deferred.
- `ViewSwitch` is one bottom-right button labeled "Switch View" that toggles
  between map and list. Its icon shows the destination view. The minimap and the former two-button view toggle are removed.
- `CourseDetails` owns the course detail drawer. `CourseList` groups required
  courses by semester and keeps electives in one separate section. `CourseTable` renders each section using shared AlignUI table
  primitives. `list-groups.ts` owns grouping and has coverage for both curricula,
  repeated placements, and missing semesters. The list uses document scrolling,
  with the overlay controls fixed above it. `CurriculumMap` owns React Flow setup
  and viewport focus; `MapNodes` renders course and semester lane nodes. Zoom-in,
  zoom-out, and fit-view buttons are omitted; map navigation uses gestures.
- `course-utils.ts`, `scope.ts`, `map-state.ts`, and `map-layout.ts` contain
  feature-local course helpers, filtering, relationship state, and graph layout.
  Filtering and real-data curriculum exploration have colocated tests. Relationship
  states are verified through exploration rather than isolated helper tests.

Keep page-specific headers, sidebars, overlays, and other components colocated
with their owning feature. A general component name does not imply global
ownership. Promote a feature component into a shared folder only when another
feature actually needs it. Retain the existing shared AlignUI controls in
`src/ui/`; do not create shared abstractions for hypothetical pages.

## Refactor constraints

Preserve the page appearance, interactions, URLs, and styling when reorganizing
components, state, and graph logic. Extract individual controls only when they
add meaningful behavior or repeated markup; otherwise use a shared UI component.

## Roadmap feature

The `/roadmap` route validates URL search through the roadmap feature's `search.ts`.
`RoadmapPage` composes the full-screen quiz or result. `quiz.ts` owns conditional
questions and answer invalidation. `options.ts` owns source-specific choices and the
shared elective eligibility filter.

`planner.ts` builds the selected course set and applies elective replacements.
`activities.ts`, `schedule.ts`, and `conflicts.ts` handle outside activities, semester
placements, and unresolved conditions. These functions operate on source data and
return a suggested plan, not academic eligibility.

`RoadmapGraph` reuses the curriculum's course and semester nodes on a full-screen canvas.
`RoadmapResult` composes the shared Overlay and SemesterFilter, sharing, and course drawer.
`RoadmapFilters` supplies AlignUI Select controls to the shared expandable filter panel.
`RoadmapNotes` keeps conflict notes and source assumptions in an AlignUI Drawer.
The drawer's optional footer hosts roadmap-specific actions without importing the
roadmap feature. `ElectiveReplacement` owns replacement selection and source preview.

`EdgeRouting` supplies both maps with measured React Flow nodes and rounded
orthogonal paths from `@tisoap/react-flow-smart-edge`. Course cards, activity
cards, and title nodes are obstacles; semester lane headers are excluded.
The shared edge renderer preserves arrowheads and the curriculum reveal animation.
