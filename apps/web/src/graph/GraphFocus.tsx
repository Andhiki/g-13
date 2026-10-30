import { useEffect, useEffectEvent, useRef } from "react";
import { useReactFlow } from "@xyflow/react";

export function GraphFocus({
  selectedId,
  navigation,
  resetKey,
  onOverview,
  onSemester,
}: {
  selectedId: string | null;
  navigation: { semester: number } | null;
  resetKey: string;
  onOverview: () => void;
  onSemester: (semester: number) => void;
}) {
  const { viewportInitialized } = useReactFlow();
  const previous = useRef({ navigation, resetKey, initialized: false });
  const apply = useEffectEvent(() => {
    if (selectedId !== null) return;
    if (navigation) onSemester(navigation.semester);
    else onOverview();
  });

  useEffect(() => {
    if (!viewportInitialized) return;
    const changed =
      !previous.current.initialized ||
      previous.current.navigation !== navigation ||
      previous.current.resetKey !== resetKey;
    if (selectedId !== null) {
      if (!previous.current.initialized)
        previous.current = { navigation, resetKey, initialized: true };
      return;
    }
    previous.current = { navigation, resetKey, initialized: true };
    if (!changed) return;
    const timer = window.setTimeout(apply, 30);
    return () => window.clearTimeout(timer);
  }, [selectedId, navigation, resetKey, viewportInitialized]);

  return null;
}
