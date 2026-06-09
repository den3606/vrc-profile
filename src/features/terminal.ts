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
  CODE_LANG_HELP,
  CODES_HIMAWARI,
  CODES_KUD,
} from "../config/codes";
import { getAchievementMeta, type AchievementId } from "../config/achievements";
import { getHintAchievementIds, getHintDetails } from "../config/hints";
import { getLocale, getMessages, setLocale } from "../i18n";
import type { Locale } from "../i18n";
import { resolveLocaleFromInput } from "../lib/locale-codes";
import { includesNormalizedCode, matchesAnyCode, normalizeCode } from "../lib/normalize-code";
import type { AppContext } from "../lib/app-context";
import type { AchievementApi } from "./achievements";
import { openAccessTerminal } from "../lib/access-terminal";
import type { OverlayApi } from "./overlays";

export function setupTerminal(
  ctx: AppContext,
  achievements: AchievementApi,
  overlays: OverlayApi
) {
  ctx.els.terminalToggle.addEventListener("click", () => {
    const closing = !ctx.els.accessTerminal.hidden;
    if (closing) {
      ctx.els.accessTerminal.hidden = true;
      return;
    }
    openAccessTerminal(ctx.els);
  });

  ctx.els.terminalClose.addEventListener("click", () => {
    ctx.els.accessTerminal.hidden = true;
  });

  ctx.els.codeSubmit.addEventListener("click", () => tryCode(ctx, achievements, overlays));
  ctx.els.codeInput.addEventListener("keydown", (e) => {
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

function codeVerified(value: string) {
  return `${value.toUpperCase()} ${getMessages().terminal.verifiedSuffix}`;
}

function terminalUnlockMessage(
  id: AchievementId,
  value: string,
  prefixLines: string[] = [],
  verifiedLine?: string
) {
  const { terminal } = getMessages();
  const footer = [terminal.achievementUnlocked, getAchievementMeta(id).title];
  return [verifiedLine ?? codeVerified(value), ...prefixLines, "", ...footer];
}

function showHintTerminal(ctx: AppContext, verifiedLine?: string) {
  const { hints } = getMessages();
  const hintAchievementIds = getHintAchievementIds();
  const hintDetails = getHintDetails();

  ctx.els.terminalOutput.classList.remove("error");
  ctx.els.terminalOutput.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "terminal-hint";

  if (verifiedLine) {
    const header = document.createElement("p");
    header.className = "terminal-verified";
    header.textContent = verifiedLine;
    wrap.appendChild(header);
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "hint-reveal-trigger";
  trigger.textContent = hints.trigger;

  const list = document.createElement("div");
  list.className = "hint-list";
  list.hidden = true;

  hintDetails.forEach((text, index) => {
    const item = document.createElement("div");
    item.className = "hint-item";

    const achievementId = hintAchievementIds[index];
    const unlocked = ctx.state.achievements.includes(achievementId);
    const label = unlocked
      ? hints.itemLabelUnlocked.replace("{title}", getAchievementMeta(achievementId).title)
      : hints.itemLabelLocked.replace("{n}", String(index + 1));

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

export function runLangHelp(ctx: AppContext): void {
  const { terminal } = getMessages();
  writeTerminal(ctx, [terminal.lang.helpPrompt, "", ...terminal.lang.help]);
  ctx.els.codeInput.value = "";
}

function tryLocaleSwitch(ctx: AppContext, locale: Locale, value: string) {
  const verified = codeVerified(value);
  const { terminal } = getMessages();

  if (getLocale() === locale) {
    writeTerminal(ctx, [verified, "", terminal.lang.already[locale]]);
    ctx.els.codeInput.value = "";
    return true;
  }

  setLocale(locale);
  writeTerminal(ctx, [verified, "", terminal.lang.set[locale]]);
  ctx.els.codeInput.value = "";
  return true;
}

function tryCode(ctx: AppContext, achievements: AchievementApi, overlays: OverlayApi) {
  const { terminal, ui } = getMessages();
  const value = normalizeCode(ctx.els.codeInput.value);

  if (value === CODE_LANG_HELP) {
    runLangHelp(ctx);
    return;
  }

  const localeFromCode = resolveLocaleFromInput(value);
  if (localeFromCode && tryLocaleSwitch(ctx, localeFromCode, value)) return;

  if (value === CODE_RESET) {
    achievements.resetAchievements();
    writeTerminal(ctx, [
      codeVerified(value),
      "",
      terminal.reset.complete,
      "",
      terminal.reset.cleared,
      terminal.reset.reload,
    ]);
    return;
  }

  if (value === CODE_HINT) {
    showHintTerminal(ctx, codeVerified(value));
    ctx.els.codeInput.value = "";
    return;
  }

  if (includesNormalizedCode(value, CODE_VRC_USER)) {
    achievements.unlockAchievement("vrc-engineer");
    writeTerminal(
      ctx,
      terminalUnlockMessage("vrc-engineer", value, [], terminal.vrcEngineerVerified)
    );
    ctx.els.codeInput.value = "";
    return;
  }

  if (value === CODE_ALREADY_KNOW) {
    achievements.unlockAchievement("honester");
    writeTerminal(
      ctx,
      terminalUnlockMessage("honester", value, [
        terminal.nextCodeHint,
        ...terminal.codeResponses.honester,
      ])
    );
    ctx.els.codeInput.value = "";
    return;
  }

  if (CODES_FRIEND_NAME.includes(value as (typeof CODES_FRIEND_NAME)[number])) {
    achievements.unlockAchievement("your-friend-name");
    writeTerminal(
      ctx,
      terminalUnlockMessage("your-friend-name", value, [
        terminal.nextCodeHint,
        ...terminal.codeResponses["your-friend-name"],
      ])
    );
    ctx.els.codeInput.value = "";
    return;
  }

  if (value === CODE_MIRROR_HINT) {
    writeTerminal(ctx, [codeVerified(value), "", terminal.mirrorHint]);
    ctx.els.codeInput.value = "";
    return;
  }

  if (CODES_MIRROR.includes(value as (typeof CODES_MIRROR)[number])) {
    achievements.unlockAchievement("mirror-mirror");
    writeTerminal(ctx, terminalUnlockMessage("mirror-mirror", value));
    ctx.els.codeInput.value = "";
    return;
  }

  if (value === CODE_DEEP_DIVER) {
    writeTerminal(ctx, [
      codeVerified(value),
      "",
      terminal.accessGranted,
      "",
      terminal.deepDiver.redirect,
    ]);
    ctx.els.codeInput.value = "";
    window.setTimeout(() => {
      ctx.els.accessTerminal.hidden = true;
      overlays.showHiddenProfile();
    }, 1800);
    return;
  }

  if (value === CODE_MAGIC) {
    achievements.unlockAchievement("science-and-magic-intersect");
    writeTerminal(ctx, terminalUnlockMessage("science-and-magic-intersect", value));
    ctx.els.codeInput.value = "";
    return;
  }

  if (value === CODE_HELP) {
    achievements.unlockAchievement("help-me-dennnnnn");
    writeTerminal(
      ctx,
      terminalUnlockMessage("help-me-dennnnnn", value, [
        terminal.nextCodeHint,
        ...terminal.codeResponses["help-me-dennnnnn"],
      ])
    );
    ctx.els.codeInput.value = "";
    return;
  }

  if (matchesAnyCode(ctx.els.codeInput.value, CODES_HIMAWARI)) {
    achievements.unlockAchievement("himawari");
    writeTerminal(ctx, terminalUnlockMessage("himawari", value));
    ctx.els.codeInput.value = "";
    return;
  }

  if (matchesAnyCode(ctx.els.codeInput.value, CODES_KUD)) {
    achievements.unlockAchievement("wafu");
    writeTerminal(
      ctx,
      terminalUnlockMessage("wafu", value, [...terminal.codeResponses.wafu])
    );
    ctx.els.codeInput.value = "";
    return;
  }

  if (value === CODE_THANK_YOU_VRC) {
    writeTerminal(ctx, [codeVerified(value), "", ui.thankYouVrc.message]);
    ctx.els.codeInput.value = "";
    window.setTimeout(() => {
      ctx.els.accessTerminal.hidden = true;
      overlays.showThankYouVrc();
    }, 1200);
    return;
  }

  if (value) {
    writeTerminal(ctx, terminal.accessDenied, { error: true });
  }
}
