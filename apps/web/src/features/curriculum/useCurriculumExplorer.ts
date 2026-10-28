import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { getCurriculum, getRelations, isCurriculumId, type CurriculumId } from "@g13/curriculum";
import { buildMap } from "./map-layout";

const route = getRouteApi("/");

export function useCurriculumExplorer() {
  const { kurikulum: curriculum, mk: courseId } = route.useSearch();
  const navigate = route.useNavigate();
  const [view, setView] = useState<"map" | "list">("map");
  const data = getCurriculum(curriculum);
  const relations = useMemo(() => getRelations(data.id), [data]);
  const selected = data.all.find((course) => course.id === courseId) ?? null;
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

  const selectCourse = useCallback(
    (id: string) => {
      anchor.current = positions.current.get(id);
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );
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
  const map = useMemo(
    () => buildMap(data, data.all, relations, selected?.id ?? null, selectCourse, anchor.current),
    [data, relations, selected?.id, selectCourse],
  );

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
