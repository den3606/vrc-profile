import { STORAGE_KEY } from "../config/constants";
import type { AchievementId } from "../config/achievements";
import { isAchievementId } from "../config/achievements";

export interface ProfileState {
  visits: number;
  achievements: AchievementId[];
  lastVisitAt?: number;
}

export function createEmptyState(): ProfileState {
  return { visits: 0, achievements: [] };
}

export function migrateState(data: {
  visits?: unknown;
  achievements?: unknown;
  lastVisitAt?: unknown;
}): ProfileState {
  const state: ProfileState = {
    visits: typeof data.visits === "number" ? data.visits : 0,
    achievements: [],
    lastVisitAt: typeof data.lastVisitAt === "number" ? data.lastVisitAt : undefined,
  };

  if (Array.isArray(data.achievements)) {
    state.achievements = data.achievements
      .filter((id): id is AchievementId => typeof id === "string" && isAchievementId(id));
    state.achievements = [...new Set(state.achievements)];
  }

  return state;
}

export function loadState(): ProfileState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateState(JSON.parse(raw) as Record<string, unknown>) : createEmptyState();
  } catch {
    return createEmptyState();
  }
}

export function saveState(state: ProfileState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
