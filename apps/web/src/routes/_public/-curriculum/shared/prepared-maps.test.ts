import { expect, test } from "bun:test";
import { getCurriculum, getRelations } from "@g13/curriculum";
import { getPreparedMap } from "./prepared-maps";

for (const curriculum of ["2021", "2026"] as const) {
  test(`${curriculum} reuses overview and focused maps without modifying cached positions`, () => {
    const overview = getPreparedMap(curriculum, null);
    const id = getCurriculum(curriculum).core[0].id;
    const focused = getPreparedMap(curriculum, id);
    const before = structuredClone(focused.positions);
    for (const course of getCurriculum(curriculum).all) getPreparedMap(curriculum, course.id);
    expect(getPreparedMap(curriculum, null)).toBe(overview);
    expect(getPreparedMap(curriculum, id)).toBe(focused);
    expect(focused.positions).toEqual(before);
    expect(getRelations(curriculum)).toBe(getRelations(curriculum));
  });
}
