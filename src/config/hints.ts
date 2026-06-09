import { getMessages } from "../i18n";
import type { AchievementId } from "./achievements";

export function getHintAchievementIds(): AchievementId[] {
  return getMessages().hints.achievementIds as AchievementId[];
}

export function getHintDetails(): readonly string[] {
  return getMessages().hints.details;
}
