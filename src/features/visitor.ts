import { SESSION_KEY, RETURN_MESSAGES, OBSERVED_MS } from "../config/constants";
import { saveState } from "../lib/state";
import type { AppContext } from "../lib/app-context";
import type { AchievementApi } from "./achievements";
import type { ToastApi } from "./toast";

export function handleReturnVisitor(ctx: AppContext, toast: ToastApi) {
  const isNewSession = !sessionStorage.getItem(SESSION_KEY);
  if (!isNewSession) return;
  sessionStorage.setItem(SESSION_KEY, "1");

  ctx.state.visits = (ctx.state.visits || 0) + 1;
  ctx.state.lastVisitAt = Date.now();
  saveState(ctx.state);

  const msg = RETURN_MESSAGES[ctx.state.visits];
  if (!msg) return;

  window.setTimeout(() => {
    toast.showFloatingMessage(ctx.els.returnMessage, msg, 3500);
  }, 2800);
}

export function setupObserverTimer(ctx: AppContext, achievements: AchievementApi) {
  if (ctx.state.achievements.includes("observer")) return;

  const timer = window.setTimeout(() => {
    achievements.unlockAchievement("observer");
  }, OBSERVED_MS);

  window.addEventListener("beforeunload", () => clearTimeout(timer), { once: true });
}

export function setupEndReaderButton(ctx: AppContext, achievements: AchievementApi) {
  if (!ctx.els.endReaderBtn) return;

  ctx.els.endReaderBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!ctx.state.achievements.includes("explorer")) {
      achievements.unlockAchievement("explorer");
    }
  });
}
