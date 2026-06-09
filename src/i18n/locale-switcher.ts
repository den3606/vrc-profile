import { getLocale, getMessages, onLocaleChange, setLocale } from "./index";
import type { Locale } from "./types";
import { LOCALES } from "./types";

function updateSwitcherState(container: HTMLElement) {
  const current = getLocale();
  container.querySelectorAll<HTMLButtonElement>("[data-locale]").forEach((btn) => {
    const active = btn.dataset.locale === current;
    btn.classList.toggle("locale-btn-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

export function setupLocaleSwitcher() {
  const container = document.getElementById("locale-switcher");
  if (!container) return;

  const { localeSwitcher } = getMessages().ui;
  container.setAttribute("aria-label", localeSwitcher.label);
  container.innerHTML = "";

  const labels: Record<Locale, string> = {
    ja: localeSwitcher.ja,
    en: localeSwitcher.en,
  };

  LOCALES.forEach((locale) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "locale-btn";
    btn.dataset.locale = locale;
    btn.textContent = labels[locale];
    btn.addEventListener("click", () => setLocale(locale));
    container.appendChild(btn);
  });

  updateSwitcherState(container);
  onLocaleChange(() => updateSwitcherState(container));
}
