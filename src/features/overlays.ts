import type { AppContext } from "../lib/app-context";
import type { AchievementApi } from "./achievements";

export function setupOverlays(ctx: AppContext, achievements: AchievementApi) {
  ctx.els.closeHidden.addEventListener("click", () => {
    ctx.els.hiddenProfile.hidden = true;
    document.body.style.overflow = "";
  });

  if (ctx.els.closeThankYouVrc) {
    ctx.els.closeThankYouVrc.addEventListener("click", () => {
      if (ctx.els.thankYouVrc) ctx.els.thankYouVrc.hidden = true;
      document.body.style.overflow = "";
    });
  }

  function showHiddenProfile() {
    ctx.els.hiddenProfile.hidden = false;
    document.body.style.overflow = "hidden";
    achievements.unlockAchievement("deep-diver");
    ctx.els.hiddenProfile.scrollTop = 0;
  }

  function showThankYouVrc() {
    if (!ctx.els.thankYouVrc) return;

    ctx.els.thankYouVrc.hidden = false;
    document.body.style.overflow = "hidden";
    ctx.els.thankYouVrc.scrollTop = 0;
  }

  return { showHiddenProfile, showThankYouVrc };
}

export type OverlayApi = ReturnType<typeof setupOverlays>;
