import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { getCurriculum, getRelations, isCurriculumId, type CurriculumId } from "@g13/curriculum";
import { anchorMap } from "./map-layout";
import { getPreparedMap } from "./prepared-maps";

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

  const data = getCurriculum(curriculum);
  const relations = getRelations(curriculum);
  const selectCourse = useCallback(
    (id: string) => {
      anchor.current = positions.current.get(id);
      updateUrl(curriculum, id);
    },
    [curriculum, updateUrl],
  );
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
    const prepared = getPreparedMap(curriculum, selected?.id ?? null);
    const view = {
      ...prepared,
      nodes: prepared.nodes.map((node) =>
        node.type === "course" ? { ...node, data: { ...node.data, choose: selectCourse } } : node,
      ),
    };
    return selected && anchor.current ? anchorMap(view, selected.id, anchor.current) : view;
  }, [curriculum, selected?.id, selectCourse]);

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
