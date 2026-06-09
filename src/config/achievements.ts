import { getMessages } from "../i18n";
import type { AchievementId } from "../i18n/types";

export type { AchievementId };

export const COMPLETION_ID = "full-signal" as const satisfies AchievementId;
export const POST_COMPLETION_IDS = ["deep-diver", "wafu"] as const satisfies readonly AchievementId[];
export const GHOST_ACHIEVEMENT_IDS = ["wafu"] as const satisfies readonly AchievementId[];

export type AchievementMeta = {
  title: string;
  emoji: string;
};

export function getAchievementMeta(id: AchievementId): AchievementMeta {
  const { title, emoji } = getMessages().achievements.entries[id];
  return { title, emoji };
}

export function getAchievementDesc(id: AchievementId): string {
  return getMessages().achievements.entries[id].desc;
}

export function isAchievementId(value: string): value is AchievementId {
  return Object.prototype.hasOwnProperty.call(getMessages().achievements.entries, value);
}

/** @deprecated Use getAchievementMeta() for locale-aware access */
export const ACHIEVEMENTS = new Proxy({} as Record<AchievementId, AchievementMeta>, {
  get(_target, prop: string) {
    if (!isAchievementId(prop)) return undefined;
    return getAchievementMeta(prop);
  },
  ownKeys() {
    return getMessages().achievements.order;
  },
  getOwnPropertyDescriptor(_target, prop) {
    if (typeof prop !== "string" || !isAchievementId(prop)) return undefined;
    return { configurable: true, enumerable: true, value: getAchievementMeta(prop) };
  },
});
