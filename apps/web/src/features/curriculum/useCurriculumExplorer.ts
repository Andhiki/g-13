import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  getCurriculum,
  getRelations,
  isCurriculumId,
  listCurricula,
  type CurriculumId,
} from "@g13/curriculum";
import { buildMap, createMapLayout, anchorMap } from "./map-layout";

const route = getRouteApi("/");

export function useCurriculumExplorer() {
  const { kurikulum: curriculum, mk: courseId } = route.useSearch();
  const navigate = route.useNavigate();
  const [view, setView] = useState<"map" | "list">("map");
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const anchor = useRef<{ x: number; y: number } | undefined>(undefined);

  const updateUrl = useCallback(
    (version: CurriculumId, id: string | null) => {
      void navigate({
        search: { kurikulum: version, mk: id ?? undefined },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  const [preparedMaps] = useState(
    () =>
      new Map(
        listCurricula().map(({ id }) => {
          const data = getCurriculum(id);
          const relations = getRelations(id);
          const layout = createMapLayout(data, relations);
          const choose = (courseId: string) => {
            anchor.current = positions.current.get(courseId);
            updateUrl(id, courseId);
          };
          const views = new Map<string | null, ReturnType<typeof buildMap>>();
          views.set(null, buildMap(layout, data.all, null, choose));
          for (const course of data.all)
            views.set(course.id, buildMap(layout, data.all, course.id, choose));
          return [id, { data, relations, choose, views }];
        }),
      ),
  );
  const prepared = preparedMaps.get(curriculum)!;
  const { data, relations, choose: selectCourse } = prepared;
  const selected = data.all.find((course) => course.id === courseId) ?? null;
  const navigateToCourse = useCallback(
    (id: string) => {
      anchor.current = undefined;
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );
  const changeVersion = useCallback(
    (value: string) => {
      if (!isCurriculumId(value)) return;
      anchor.current = undefined;
      updateUrl(value, null);
    },
    [updateUrl],
  );
  const closeDetails = useCallback(() => updateUrl(curriculum, null), [curriculum, updateUrl]);
  const map = useMemo(() => {
    const view = prepared.views.get(selected?.id ?? null)!;
    return selected && anchor.current ? anchorMap(view, selected.id, anchor.current) : view;
  }, [prepared, selected?.id]);

  useEffect(() => {
    positions.current = map.positions;
  }, [map.positions]);

  return {
    curriculum,
    data,
    relations,
    selected,
    view,
    map,
    setView,
    changeVersion,
    selectCourse,
    navigateToCourse,
    closeDetails,
  };
}
