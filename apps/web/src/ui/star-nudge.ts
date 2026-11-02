export const STAR_NUDGE_STORAGE_KEY = "g13-star-nudge";
export const STAR_NUDGE_THRESHOLD = 5;
export const GITHUB_REPOSITORY_URL = "https://github.com/Andhiki/g-13";

export type StarNudgeState = {
  courses: string[];
  dismissed: boolean;
};

const emptyState: StarNudgeState = { courses: [], dismissed: false };
let fallbackState = emptyState;

export function parseStarNudgeState(raw: string | null): StarNudgeState {
  if (!raw) return emptyState;
  try {
    const value = JSON.parse(raw) as { courses?: unknown; dismissed?: unknown };
    return {
      courses: Array.isArray(value.courses)
        ? [...new Set(value.courses.filter((id): id is string => typeof id === "string"))]
        : [],
      dismissed: value.dismissed === true,
    };
  } catch {
    return emptyState;
  }
}

export function recordCourseOpen(
  state: StarNudgeState,
  courseId: string,
): { state: StarNudgeState; show: boolean } {
  if (state.dismissed || state.courses.includes(courseId)) return { state, show: false };
  const courses = [...state.courses, courseId];
  if (courses.length < STAR_NUDGE_THRESHOLD) return { state: { ...state, courses }, show: false };
  return { state: { ...state, courses, dismissed: true }, show: true };
}

export function readStarNudgeState(): StarNudgeState {
  try {
    const raw = localStorage.getItem(STAR_NUDGE_STORAGE_KEY);
    return raw === null ? fallbackState : parseStarNudgeState(raw);
  } catch {
    return fallbackState;
  }
}

export function writeStarNudgeState(state: StarNudgeState): void {
  fallbackState = state;
  try {
    localStorage.setItem(STAR_NUDGE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep the state for this session when browser storage is unavailable.
  }
}

/** Records a course view and returns true when the star nudge should appear. */
export function noteCourseOpen(courseId: string): boolean {
  const current = readStarNudgeState();
  const next = recordCourseOpen(current, courseId);
  if (next.state !== current) writeStarNudgeState(next.state);
  return next.show;
}

export function dismissStarNudge(): void {
  const current = readStarNudgeState();
  if (!current.dismissed) writeStarNudgeState({ ...current, dismissed: true });
}
