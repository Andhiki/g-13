import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { curricula, deriveRelations, type CurriculumId } from "../../data";
import { coursesForScope, type Scope } from "./scope";
import { buildMap } from "./map-layout";

const route = getRouteApi("/");

export function useCurriculumExplorer() {
  const { kurikulum: curriculum, mk: courseId } = route.useSearch();
  const navigate = route.useNavigate();
  const [group, setGroup] = useState("__all__");
  const [scope, setScope] = useState<Scope>("all");
  const [view, setView] = useState<"map" | "list">("map");
  const data = curricula[curriculum];
  const relations = useMemo(() => deriveRelations(data), [data]);
  const visible = useMemo(
    () => coursesForScope(data, relations, group, scope),
    [data, relations, group, scope],
  );
  const selected = data.all.find((course) => course.id === courseId) ?? null;
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const anchor = useRef<{ x: number; y: number } | undefined>(undefined);

  const updateUrl = useCallback(
    (version: CurriculumId, id: string | null) => {
      void navigate({ search: { kurikulum: version, mk: id ?? undefined }, replace: true });
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
      setGroup("__all__");
      setScope("all");
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );
  const changeVersion = useCallback(
    (value: string) => {
      const version: CurriculumId = value === "2021" ? "2021" : "2026";
      anchor.current = undefined;
      setGroup("__all__");
      setScope("all");
      updateUrl(version, null);
    },
    [updateUrl],
  );
  const closeDetails = useCallback(() => updateUrl(curriculum, null), [curriculum, updateUrl]);
  const map = useMemo(
    () =>
      buildMap(data, visible, relations, selected?.id ?? null, scope, selectCourse, anchor.current),
    [data, visible, relations, selected?.id, scope, selectCourse],
  );

  useEffect(() => {
    positions.current = map.positions;
  }, [map.positions]);

  return {
    curriculum,
    data,
    relations,
    visible,
    selected,
    group,
    scope,
    view,
    map,
    setGroup: (value: string) => {
      setGroup(value);
      closeDetails();
    },
    setScope: (value: Scope) => {
      setScope(value);
      closeDetails();
    },
    setView,
    changeVersion,
    selectCourse,
    navigateToCourse,
    closeDetails,
  };
}
