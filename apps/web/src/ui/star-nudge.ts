export const STAR_NUDGE_STORAGE_KEY = "g13-star-nudge";
export const STAR_NUDGE_THRESHOLD = 5;
export const STAR_NUDGE_COOLDOWN_MS = 60 * 60 * 1000;
export const GITHUB_REPOSITORY_URL = "https://github.com/Andhiki/g-13";

export type StarNudgeState = {
  starred: boolean;
  courses: string[];
  lastShownAt: number | null;
};

const emptyState: StarNudgeState = { starred: false, courses: [], lastShownAt: null };
let fallbackState = emptyState;

export function parseStarNudgeState(raw: string | null): StarNudgeState {
  if (!raw) return emptyState;
  try {
    const value = JSON.parse(raw) as {
      starred?: unknown;
      courses?: unknown;
      lastShownAt?: unknown;
    };
    return {
      starred: value.starred === true,
      courses: Array.isArray(value.courses)
        ? [...new Set(value.courses.filter((id): id is string => typeof id === "string"))]
        : [],
      lastShownAt:
        typeof value.lastShownAt === "number" && Number.isFinite(value.lastShownAt)
          ? value.lastShownAt
          : null,
    };
  } catch {
    return emptyState;
  }
}

function coolingDown(state: StarNudgeState, now: number): boolean {
  return state.lastShownAt !== null && now < state.lastShownAt + STAR_NUDGE_COOLDOWN_MS;
}

export function afterCourseOpen(
  state: StarNudgeState,
  courseId: string,
  now: number,
): { state: StarNudgeState; show: boolean } {
  if (state.starred || state.courses.includes(courseId)) return { state, show: false };
  const courses = [...state.courses, courseId];
  if (courses.length < STAR_NUDGE_THRESHOLD || coolingDown(state, now)) {
    return { state: { ...state, courses }, show: false };
  }
  return { state: { ...state, courses: [], lastShownAt: now }, show: true };
}

export function afterRoadmapCreated(
  state: StarNudgeState,
  now: number,
): { state: StarNudgeState; show: boolean } {
  if (state.starred) return { state, show: false };
  return { state: { ...state, courses: [], lastShownAt: now }, show: true };
}

export function afterStarGiven(state: StarNudgeState): StarNudgeState {
  return state.starred ? state : { ...state, starred: true };
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
export function noteCourseOpen(courseId: string, now = Date.now()): boolean {
  const current = readStarNudgeState();
  const next = afterCourseOpen(current, courseId, now);
  if (next.state !== current) writeStarNudgeState(next.state);
  return next.show;
}

/** Records a roadmap creation and returns true when the star nudge should appear. */
export function noteRoadmapCreated(now = Date.now()): boolean {
  const current = readStarNudgeState();
  const next = afterRoadmapCreated(current, now);
  if (next.state !== current) writeStarNudgeState(next.state);
  return next.show;
}

export function markStarGiven(): void {
  const current = readStarNudgeState();
  const next = afterStarGiven(current);
  if (next !== current) writeStarNudgeState(next);
}
