import { STORAGE_KEY } from "../config/constants";
import type { AchievementId } from "../config/achievements";
import { isAchievementId } from "../config/achievements";

const STATE_VERSION = 2;

export interface ProfileState {
  visits: number;
  achievements: AchievementId[];
  lastVisitAt?: number;
  v?: number;
}

export function createEmptyState(): ProfileState {
  return { visits: 0, achievements: [], v: STATE_VERSION };
}

function migrateAchievementId(id: string, legacy: boolean): string {
  if (id === "mirror-character") return "mirror-mirror";
  if (legacy && id === "observer") return "explorer";
  if (id === "observed") return "observer";
  return id;
}

export function migrateState(data: {
  visits?: unknown;
  achievements?: unknown;
  lastVisitAt?: unknown;
  v?: unknown;
}): ProfileState {
  const legacy = typeof data.v !== "number" || data.v < STATE_VERSION;

  const state: ProfileState = {
    visits: typeof data.visits === "number" ? data.visits : 0,
    achievements: [],
    lastVisitAt: typeof data.lastVisitAt === "number" ? data.lastVisitAt : undefined,
    v: STATE_VERSION,
  };

  if (Array.isArray(data.achievements)) {
    state.achievements = data.achievements
      .map((id) => (typeof id === "string" ? migrateAchievementId(id, legacy) : id))
      .filter((id): id is AchievementId => typeof id === "string" && isAchievementId(id));
    state.achievements = [...new Set(state.achievements)];
  }

  return state;
}

export function loadState(): ProfileState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyState();

    const data = JSON.parse(raw) as Record<string, unknown>;
    const state = migrateState(data);
    const needsPersist =
      data.v !== STATE_VERSION ||
      JSON.stringify(data.achievements) !== JSON.stringify(state.achievements);

    if (needsPersist) saveState(state);
    return state;
  } catch {
    return createEmptyState();
  }
}

export function saveState(state: ProfileState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, v: STATE_VERSION }));
}
