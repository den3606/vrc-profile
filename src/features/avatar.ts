import {
  PET_CLICKS_REQUIRED,
  PET_ESCAPE_CLICKS,
} from "../config/constants";
import type { AppContext } from "../lib/app-context";
import type { AchievementApi } from "./achievements";

export function setupAvatarPet(ctx: AppContext, achievements: AchievementApi) {
  if (!ctx.els.avatarPetBtn) return;

  ctx.els.avatarPetBtn.addEventListener("click", () => {
    if (ctx.avatarEscapedSession) return;

    ctx.petClicksSession += 1;
    const count = ctx.petClicksSession;

    if (count <= PET_CLICKS_REQUIRED) {
      playAvatarPetAnimation(ctx.els.avatarPetBtn!);
      if (count === PET_CLICKS_REQUIRED) {
        achievements.unlockAchievement("pet-pet-pet");
      }
      return;
    }

    if (count < PET_ESCAPE_CLICKS) {
      ctx.els.avatarPetBtn!.classList.add("is-uncomfortable");
      playAvatarPetAnimation(ctx.els.avatarPetBtn!, "uncomfortable");
      return;
    }

    ctx.els.avatarPetBtn!.classList.remove("is-uncomfortable");
    ctx.els.avatarPetBtn!.classList.add("is-escaping");
    achievements.unlockAchievement("escape-from-friend");
  });

  ctx.els.avatarPetBtn.addEventListener("animationend", (e) => {
    const btn = ctx.els.avatarPetBtn!;
    if (e.target === btn && btn.classList.contains("is-escaping")) {
      btn.classList.remove("is-escaping");
      setAvatarEscaped(ctx);
      return;
    }

    if (e.target instanceof HTMLElement && e.target.classList.contains("vrc-avatar")) {
      btn.classList.remove("is-petting", "is-reacting");
    }
  });
}

function setAvatarEscaped(ctx: AppContext) {
  ctx.avatarEscapedSession = true;
  if (ctx.els.avatarWrap) ctx.els.avatarWrap.classList.add("is-escaped");
  if (ctx.els.avatarPetBtn) {
    ctx.els.avatarPetBtn.disabled = true;
    ctx.els.avatarPetBtn.classList.remove(
      "is-uncomfortable",
      "is-petting",
      "is-reacting",
      "is-escaping"
    );
  }
}

function playAvatarPetAnimation(btn: HTMLButtonElement, mode: "petting" | "uncomfortable" = "petting") {
  btn.classList.remove("is-petting", "is-reacting");
  void btn.offsetWidth;

  if (mode === "uncomfortable") {
    btn.classList.add("is-reacting");
    return;
  }

  btn.classList.add("is-petting");
}
