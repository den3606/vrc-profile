import type { jaBundle } from "./bundles/ja";

export const LOCALES = ["ja", "en", "zh", "zh-TW", "kr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export type MessageBundle = typeof jaBundle;
export type AchievementId = keyof MessageBundle["achievements"]["entries"] & string;
