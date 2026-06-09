import { createAchievementApi } from "./features/achievements";
import { setupAvatarPet } from "./features/avatar";
import { runBootSequence, setupTabs } from "./features/boot";
import { setupHiddenSignal } from "./features/hidden-signal";
import { setupOverlays } from "./features/overlays";
import { loadSteamGames } from "./features/steam";
import { setupTerminal } from "./features/terminal";
import { setupToast } from "./features/toast";
import {
  handleReturnVisitor,
  setupEndReaderButton,
  setupObserverTimer,
} from "./features/visitor";
import { applyI18n } from "./i18n/apply";
import { initLocale, onLocaleChange } from "./i18n";
import { setupLocaleSwitcher } from "./i18n/locale-switcher";
import { createAppContext } from "./lib/app-context";
import { getElements } from "./lib/elements";
import { loadState } from "./lib/state";

export function initApp() {
  initLocale();
  const els = getElements();
  applyI18n(els);
  setupLocaleSwitcher();

  const state = loadState();
  const ctx = createAppContext(els, state);
  const toast = setupToast(els);
  const achievements = createAchievementApi(ctx, toast);
  const overlays = setupOverlays(ctx, achievements);

  onLocaleChange(() => {
    applyI18n(els);
    achievements.renderAchievements();
    loadSteamGames();
  });

  runBootSequence(els);
  setupEndReaderButton(ctx, achievements);
  setupAvatarPet(ctx, achievements);
  setupObserverTimer(ctx, achievements);
  setupTerminal(ctx, achievements, overlays);
  setupHiddenSignal(els);
  setupTabs(els);
  loadSteamGames();
  achievements.renderAchievements();
  handleReturnVisitor(ctx, toast);
  achievements.unlockAchievement("first-contact", { silent: true });
  achievements.checkAllAchievementsUnlocked();
}
