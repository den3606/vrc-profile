import {
  ACHIEVEMENTS,
  COMPLETION_ID,
  GHOST_ACHIEVEMENT_IDS,
  POST_COMPLETION_IDS,
  type AchievementId,
} from "../config/achievements";
import { SESSION_KEY } from "../config/constants";
import { saveState } from "../lib/state";
import type { AppContext } from "../lib/app-context";
import type { ToastApi } from "./toast";

export function createAchievementApi(ctx: AppContext, toast: ToastApi) {
  function unlockAchievement(id: AchievementId, { silent = false } = {}) {
    if (ctx.state.achievements.includes(id)) return;

    ctx.state.achievements.push(id);
    saveState(ctx.state);
    renderAchievements();

    if (!silent) {
      toast.showAchievementToast(ACHIEVEMENTS[id]);
    }

    checkAllAchievementsUnlocked();
  }

  function checkAllAchievementsUnlocked() {
    if (ctx.state.achievements.includes(COMPLETION_ID)) return;

    const required = (Object.keys(ACHIEVEMENTS) as AchievementId[]).filter(
      (key) => key !== COMPLETION_ID && !POST_COMPLETION_IDS.includes(key)
    );
    if (!required.every((key) => ctx.state.achievements.includes(key))) return;

    unlockAchievement(COMPLETION_ID);
  }

  function renderAchievements() {
    let total = 0;
    let unlockedCount = 0;

    ctx.els.achievementList.querySelectorAll<HTMLElement>("[data-achievement]").forEach((card) => {
      const id = card.dataset.achievement;
      if (!id || !(id in ACHIEVEMENTS)) return;

      const achievementId = id as AchievementId;
      const unlocked = ctx.state.achievements.includes(achievementId);
      const isGhost = GHOST_ACHIEVEMENT_IDS.includes(achievementId);

      if (isGhost && !unlocked) {
        card.hidden = true;
        return;
      }

      card.hidden = false;
      total += 1;
      card.classList.toggle("unlocked", unlocked);
      if (unlocked) unlockedCount += 1;

      if (card.dataset.secret === "true") {
        const concealed = !unlocked;
        card.classList.toggle("concealed", concealed);

        const emojiEl = card.querySelector(".achievement-emoji");
        const titleEl = card.querySelector(".achievement-title");
        const descEl = card.querySelector(".achievement-desc");

        if (emojiEl && titleEl && descEl) {
          if (concealed) {
            emojiEl.textContent = "❓";
            titleEl.textContent = "???";
            descEl.textContent = "条件は隠されている";
          } else {
            emojiEl.textContent = card.dataset.emoji ?? "";
            titleEl.textContent = ACHIEVEMENTS[achievementId].title;
            descEl.innerHTML = card.dataset.desc ?? "";
          }
        }
      }
    });

    if (ctx.els.achievementCount) ctx.els.achievementCount.textContent = String(unlockedCount);
    if (ctx.els.achievementTotal) ctx.els.achievementTotal.textContent = String(total);
  }

  function resetAchievements() {
    ctx.state.achievements = [];
    ctx.state.visits = 0;
    delete ctx.state.lastVisitAt;
    ctx.petClicksSession = 0;
    ctx.avatarEscapedSession = false;
    saveState(ctx.state);
    sessionStorage.removeItem(SESSION_KEY);
    renderAchievements();
    ctx.els.passwordInput.value = "";

    if (ctx.els.endReaderBtn) {
      ctx.els.endReaderBtn.disabled = false;
    }

    if (ctx.els.avatarWrap) ctx.els.avatarWrap.classList.remove("is-escaped");
    if (ctx.els.avatarPetBtn) {
      ctx.els.avatarPetBtn.disabled = false;
      ctx.els.avatarPetBtn.classList.remove(
        "is-uncomfortable",
        "is-petting",
        "is-reacting",
        "is-escaping"
      );
    }
  }

  return {
    unlockAchievement,
    checkAllAchievementsUnlocked,
    renderAchievements,
    resetAchievements,
  };
}

export type AchievementApi = ReturnType<typeof createAchievementApi>;
