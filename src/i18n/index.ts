import { enBundle } from "./bundles/en";
import { jaBundle } from "./bundles/ja";
import type { Locale, MessageBundle } from "./types";
import { DEFAULT_LOCALE, LOCALES } from "./types";

export type { AchievementId, Locale, MessageBundle } from "./types";
export { LOCALES, DEFAULT_LOCALE };

const LOCALE_KEY = "vrc-profile-locale";

const bundles: Record<Locale, MessageBundle> = {
  ja: jaBundle,
  en: enBundle,
};

type LocaleListener = (locale: Locale) => void;
const listeners = new Set<LocaleListener>();

let currentLocale: Locale = readStoredLocale() ?? DEFAULT_LOCALE;

function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    return stored && LOCALES.includes(stored as Locale) ? (stored as Locale) : null;
  } catch {
    return null;
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getMessages(): MessageBundle {
  return bundles[currentLocale];
}

export function setLocale(locale: Locale): void {
  if (!LOCALES.includes(locale) || locale === currentLocale) return;

  currentLocale = locale;
  document.documentElement.lang = locale;

  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // ignore storage errors
  }

  listeners.forEach((listener) => listener(locale));
}

export function onLocaleChange(listener: LocaleListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initLocale(): void {
  document.documentElement.lang = currentLocale;
}
