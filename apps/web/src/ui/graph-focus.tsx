import { useEffect, useEffectEvent, useRef } from "react";
import { useReactFlow, type Viewport } from "@xyflow/react";

export function GraphFocus({
  selectedId,
  navigation,
  resetKey,
  onOverview,
  onSemester,
  onCourse,
}: {
  selectedId: string | null;
  navigation: { semester: number } | null;
  resetKey: string;
  onOverview: () => void;
  onSemester: (semester: number) => void;
  onCourse?: () => void;
}) {
  const { getViewport, setViewport, viewportInitialized } = useReactFlow();
  const previous = useRef({ selectedId, navigation, resetKey });
  const overview = useRef<Viewport | null>(null);
  const apply = useEffectEvent((saved: Viewport | null) => {
    if (selectedId !== null) onCourse?.();
    else if (saved) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      void setViewport(saved, { duration: reducedMotion ? 0 : 150 });
    } else if (navigation) onSemester(navigation.semester);
    else onOverview();
  });

  useEffect(() => {
    if (!viewportInitialized) return;
    const invalidated =
      previous.current.navigation !== navigation || previous.current.resetKey !== resetKey;
    if (invalidated) overview.current = null;
    if (
      previous.current.selectedId === null &&
      selectedId !== null &&
      !invalidated &&
      overview.current === null
    ) {
      overview.current = getViewport();
    }
    const saved =
      previous.current.selectedId !== null && selectedId === null ? overview.current : null;
    previous.current = { selectedId, navigation, resetKey };
    // Let React Flow lay out the updated nodes before moving the viewport.
    const timer = window.setTimeout(() => {
      apply(saved);
      if (selectedId === null) overview.current = null;
    }, 30);
    return () => window.clearTimeout(timer);
  }, [selectedId, navigation, resetKey, viewportInitialized, getViewport]);

  return null;
}
