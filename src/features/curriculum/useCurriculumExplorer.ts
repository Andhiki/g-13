import { useCallback, useEffect, useMemo, useState } from "react";
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
  const visibleIds = useMemo(() => new Set(visible.map((course) => course.id)), [visible]);
  const selected =
    courseId && visibleIds.has(courseId)
      ? (data.all.find((course) => course.id === courseId) ?? null)
      : null;

  const updateUrl = useCallback(
    (version: CurriculumId, id: string | null) => {
      void navigate({ search: { kurikulum: version, mk: id ?? undefined }, replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    if (courseId && !visibleIds.has(courseId)) updateUrl(curriculum, null);
  }, [courseId, visibleIds, curriculum, updateUrl]);

  const selectCourse = useCallback(
    (id: string) => updateUrl(curriculum, id),
    [curriculum, updateUrl],
  );
  const navigateToCourse = useCallback(
    (id: string) => {
      setGroup("__all__");
      setScope("all");
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );
  const changeVersion = useCallback(
    (value: string) => {
      const version: CurriculumId = value === "2021" ? "2021" : "2026";
      setGroup("__all__");
      setScope("all");
      updateUrl(version, null);
    },
    [updateUrl],
  );
  const closeDetails = useCallback(() => updateUrl(curriculum, null), [curriculum, updateUrl]);
  const map = useMemo(
    () => buildMap(data, visible, relations, selected?.id ?? null, scope, selectCourse),
    [data, visible, relations, selected?.id, scope, selectCourse],
  );

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
    setGroup,
    setScope,
    setView,
    changeVersion,
    selectCourse,
    navigateToCourse,
    closeDetails,
  };
}
