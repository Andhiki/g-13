import { getCurriculum, getRelations, type CurriculumId } from "@g13/curriculum";
import { buildMap, createMapLayout } from "./map-layout";

const layouts = new Map<CurriculumId, ReturnType<typeof createMapLayout>>();
const views = new Map<CurriculumId, Map<string | null, ReturnType<typeof buildMap>>>();
const choose = () => {};

export function getPreparedMap(curriculum: CurriculumId, selectedId: string | null) {
  let layout = layouts.get(curriculum);
  if (!layout) {
    layout = createMapLayout(getCurriculum(curriculum), getRelations(curriculum));
    layouts.set(curriculum, layout);
  }
  let prepared = views.get(curriculum);
  if (!prepared) {
    prepared = new Map();
    views.set(curriculum, prepared);
  }
  let map = prepared.get(selectedId);
  if (!map) {
    map = buildMap(layout, layout.data.all, selectedId, choose);
    prepared.set(selectedId, map);
  }
  return map;
}
