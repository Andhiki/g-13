export type MapCourseState = "selected" | "prerequisite" | "dependent" | "unrelated" | null;

export function mapCourseState(
  courseId: string,
  selectedId: string | null,
  incoming: string[],
  outgoing: string[],
): MapCourseState {
  if (!selectedId) return null;
  if (courseId === selectedId) return "selected";
  if (outgoing.includes(selectedId)) return "prerequisite";
  if (incoming.includes(selectedId)) return "dependent";
  return "unrelated";
}
