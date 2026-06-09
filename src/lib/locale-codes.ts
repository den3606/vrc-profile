import type { Locale } from "../i18n/types";
import { normalizeCode } from "./normalize-code";

const LOCALE_CODE_MAP: Record<string, Locale> = {
  ja: "ja",
  lang_ja: "ja",
  en: "en",
  lang_en: "en",
  zh: "zh",
  lang_zh: "zh",
  "zh-tw": "zh-TW",
  zh_tw: "zh-TW",
  tw: "zh-TW",
  lang_zh_tw: "zh-TW",
  "lang_zh-tw": "zh-TW",
  lang_tw: "zh-TW",
  kr: "kr",
  ko: "kr",
  lang_kr: "kr",
  lang_ko: "kr",
};

export function resolveLocaleFromInput(value: string): Locale | null {
  const raw = value.trim().toLowerCase();
  return LOCALE_CODE_MAP[normalizeCode(value)] ?? LOCALE_CODE_MAP[raw] ?? null;
}
