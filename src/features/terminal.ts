import { ACHIEVEMENTS, type AchievementId } from "../config/achievements";
import {
  CODE_RESET,
  CODE_HINT,
  CODES_FRIEND_NAME,
  CODES_MIRROR,
  CODE_MIRROR_HINT,
  CODE_VRC_USER,
  CODE_ALREADY_KNOW,
  CODE_THANK_YOU_VRC,
  CODE_MAGIC,
  CODE_HELP,
  CODE_DEEP_DIVER,
  CODES_HIMAWARI,
  CODES_KUD,
} from "../config/codes";
import { HINT_ACHIEVEMENT_IDS, HINT_DETAILS } from "../config/hints";
import { includesNormalizedCode, matchesAnyCode, normalizeCode } from "../lib/normalize-code";
import type { AppContext } from "../lib/app-context";
import type { AchievementApi } from "./achievements";
import type { OverlayApi } from "./overlays";

export function setupTerminal(
  ctx: AppContext,
  achievements: AchievementApi,
  overlays: OverlayApi
) {
  ctx.els.terminalToggle.addEventListener("click", () => {
    const open = !ctx.els.accessTerminal.hidden;
    ctx.els.accessTerminal.hidden = open;
    if (!open) {
      ctx.els.passwordInput.focus();
      ctx.els.terminalOutput.textContent = "";
      ctx.els.terminalOutput.classList.remove("error");
    }
  });

  ctx.els.terminalClose.addEventListener("click", () => {
    ctx.els.accessTerminal.hidden = true;
  });

  ctx.els.passwordSubmit.addEventListener("click", () => tryCode(ctx, achievements, overlays));
  ctx.els.passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryCode(ctx, achievements, overlays);
  });
}

function writeTerminal(
  ctx: AppContext,
  lines: string | string[],
  { error = false }: { error?: boolean } = {}
) {
  ctx.els.terminalOutput.classList.toggle("error", error);
  ctx.els.terminalOutput.textContent = Array.isArray(lines) ? lines.join("\n") : lines;
}

function terminalUnlockMessage(id: AchievementId, prefixLines: string[] = []) {
  const footer = ["Achievement Unlocked", ACHIEVEMENTS[id].title];
  if (!prefixLines.length) return footer;
  return [...prefixLines, "", ...footer];
}

function showHintTerminal(ctx: AppContext) {
  ctx.els.terminalOutput.classList.remove("error");
  ctx.els.terminalOutput.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "terminal-hint";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "hint-reveal-trigger";
  trigger.textContent = "しょうがないにゃあ・・";

  const list = document.createElement("div");
  list.className = "hint-list";
  list.hidden = true;

  HINT_DETAILS.forEach((text, index) => {
    const item = document.createElement("div");
    item.className = "hint-item";

    const achievementId = HINT_ACHIEVEMENT_IDS[index];
    const unlocked = ctx.state.achievements.includes(achievementId);
    const label = unlocked
      ? `${ACHIEVEMENTS[achievementId].title}のヒント`
      : `実績${index + 1}のヒント`;

    const itemTrigger = document.createElement("button");
    itemTrigger.type = "button";
    itemTrigger.className = "hint-item-trigger";
    itemTrigger.textContent = label;

    const itemText = document.createElement("div");
    itemText.className = "hint-item-text";
    itemText.hidden = true;
    itemText.textContent = text;

    itemTrigger.addEventListener("click", () => {
      itemText.hidden = false;
      itemTrigger.disabled = true;
      itemTrigger.classList.add("is-revealed");
    });

    item.appendChild(itemTrigger);
    item.appendChild(itemText);
    list.appendChild(item);
  });

  trigger.addEventListener("click", () => {
    list.hidden = false;
    trigger.disabled = true;
    trigger.classList.add("is-revealed");
  });

  wrap.appendChild(trigger);
  wrap.appendChild(list);
  ctx.els.terminalOutput.appendChild(wrap);
}

function tryCode(ctx: AppContext, achievements: AchievementApi, overlays: OverlayApi) {
  const value = normalizeCode(ctx.els.passwordInput.value);

  if (value === CODE_RESET) {
    achievements.resetAchievements();
    writeTerminal(ctx, [
      "RESET COMPLETE",
      "",
      "Achievements cleared.",
      "ページを再度開き直してください。",
    ]);
    return;
  }

  if (value === CODE_HINT) {
    showHintTerminal(ctx);
    ctx.els.passwordInput.value = "";
    return;
  }

  if (includesNormalizedCode(value, CODE_VRC_USER)) {
    achievements.unlockAchievement("vrc-engineer");
    writeTerminal(ctx, terminalUnlockMessage("vrc-engineer", ["USER ID VERIFIED"]));
    ctx.els.passwordInput.value = "";
    return;
  }

  if (value === CODE_ALREADY_KNOW) {
    achievements.unlockAchievement("honester");
    writeTerminal(
      ctx,
      terminalUnlockMessage("honester", [
        "[next code hint]",
        "文章の意味としても機能しています。なぜならあなたはもう他のcodeも知っているのだから。",
        "分からなかったら「h???」もあります。",
      ])
    );
    ctx.els.passwordInput.value = "";
    return;
  }

  if (CODES_FRIEND_NAME.includes(value as (typeof CODES_FRIEND_NAME)[number])) {
    achievements.unlockAchievement("your-friend-name");
    writeTerminal(
      ctx,
      terminalUnlockMessage("your-friend-name", [
        "[next code hint]",
        "自分は相手の方を向いて話すほうが好きなんですけど、",
        "VRCの人はよく、別の世界の人を見て話しているよね",
      ])
    );
    ctx.els.passwordInput.value = "";
    return;
  }

  if (value === CODE_MIRROR_HINT) {
    writeTerminal(ctx, "鏡自体ではないよ！何かの順番を変える感じ。");
    ctx.els.passwordInput.value = "";
    return;
  }

  if (CODES_MIRROR.includes(value as (typeof CODES_MIRROR)[number])) {
    achievements.unlockAchievement("mirror-mirror");
    writeTerminal(ctx, terminalUnlockMessage("mirror-mirror", ["SIGNAL IDENTIFIED"]));
    ctx.els.passwordInput.value = "";
    return;
  }

  if (value === CODE_DEEP_DIVER) {
    writeTerminal(ctx, ["ACCESS GRANTED", "", "裏側のプロフィールへ移動します。"]);
    ctx.els.passwordInput.value = "";
    window.setTimeout(() => {
      ctx.els.accessTerminal.hidden = true;
      overlays.showHiddenProfile();
    }, 1800);
    return;
  }

  if (value === CODE_MAGIC) {
    achievements.unlockAchievement("science-and-magic-intersect");
    writeTerminal(ctx, terminalUnlockMessage("science-and-magic-intersect"));
    ctx.els.passwordInput.value = "";
    return;
  }

  if (value === CODE_HELP) {
    achievements.unlockAchievement("help-me-dennnnnn");
    writeTerminal(
      ctx,
      terminalUnlockMessage("help-me-dennnnnn", [
        "[next code hint]",
        "なぞなぞで困ったときは help よりもまず、 h??? だよね。",
      ])
    );
    ctx.els.passwordInput.value = "";
    return;
  }

  if (matchesAnyCode(ctx.els.passwordInput.value, CODES_HIMAWARI)) {
    achievements.unlockAchievement("himawari");
    writeTerminal(ctx, terminalUnlockMessage("himawari"));
    ctx.els.passwordInput.value = "";
    return;
  }

  if (matchesAnyCode(ctx.els.passwordInput.value, CODES_KUD)) {
    achievements.unlockAchievement("wafu");
    writeTerminal(ctx, terminalUnlockMessage("wafu", ["わふー >ω<"]));
    ctx.els.passwordInput.value = "";
    return;
  }

  if (value === CODE_THANK_YOU_VRC) {
    ctx.els.passwordInput.value = "";
    ctx.els.accessTerminal.hidden = true;
    overlays.showThankYouVrc();
    return;
  }

  if (value) {
    writeTerminal(ctx, "ACCESS DENIED", { error: true });
  }
}
