import { useCallback, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { getCurriculum, getRelations, isCurriculumId, type CurriculumId } from "@g13/curriculum";
import { getPreparedMap } from "./prepared-maps";

const route = getRouteApi("/");

export function useCurriculumExplorer() {
  const { kurikulum: curriculum, mk: courseId } = route.useSearch();
  const navigate = route.useNavigate();
  const [view, setView] = useState<"map" | "list">("map");

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

  const data = getCurriculum(curriculum);
  const relations = getRelations(curriculum);
  const selectCourse = useCallback(
    (id: string) => {
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );
  const selected = data.all.find((course) => course.id === courseId) ?? null;
  const changeVersion = useCallback(
    (value: string) => {
      if (!isCurriculumId(value)) return;
      updateUrl(value, null);
    },
    [updateUrl],
  );
  const closeDetails = useCallback(() => updateUrl(curriculum, null), [curriculum, updateUrl]);
  const map = useMemo(() => {
    const prepared = getPreparedMap(curriculum, selected?.id ?? null);
    return {
      ...prepared,
      nodes: prepared.nodes.map((node) =>
        node.type === "course" ? { ...node, data: { ...node.data, choose: selectCourse } } : node,
      ),
    };
  }, [curriculum, selected?.id, selectCourse]);

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
    closeDetails,
  };
}
