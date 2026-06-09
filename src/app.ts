import { createAchievementApi } from "./features/achievements";
import { setupAvatarPet } from "./features/avatar";
import { runBootSequence, setupTabs } from "./features/boot";
import { setupOverlays } from "./features/overlays";
import { loadSteamGames } from "./features/steam";
import { setupTerminal } from "./features/terminal";
import { setupToast } from "./features/toast";
import {
  handleReturnVisitor,
  setupEndReaderButton,
  setupObservedTimer,
} from "./features/visitor";
import { createAppContext } from "./lib/app-context";
import { getElements } from "./lib/elements";
import { loadState } from "./lib/state";

export function initApp() {
  const els = getElements();
  const state = loadState();
  const ctx = createAppContext(els, state);
  const toast = setupToast(els);
  const achievements = createAchievementApi(ctx, toast);
  const overlays = setupOverlays(ctx, achievements);

  runBootSequence(els);
  setupEndReaderButton(ctx, achievements);
  setupAvatarPet(ctx, achievements);
  setupObservedTimer(ctx, achievements);
  setupTerminal(ctx, achievements, overlays);
  setupTabs(els);
  loadSteamGames();
  achievements.renderAchievements();
  handleReturnVisitor(ctx, toast);
  achievements.unlockAchievement("first-contact", { silent: true });
  achievements.checkAllAchievementsUnlocked();
}
