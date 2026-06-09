import type { Elements } from "../lib/elements";

export function setupToast(els: Elements) {
  function getToastElements() {
    return [els.returnMessage, els.achievementToast].filter(Boolean);
  }

  function layoutToasts() {
    const gap = 12;
    let top = 20;

    getToastElements().forEach((el) => {
      if (el.hidden) {
        el.style.removeProperty("top");
        return;
      }

      el.style.top = `${top}px`;
      top += el.offsetHeight + gap;
    });
  }

  function showAchievementToast({ title, emoji }: { title: string; emoji: string }) {
    els.toastEmoji.textContent = emoji;
    els.toastTitle.textContent = title;
    els.achievementToast.hidden = false;
    layoutToasts();
    requestAnimationFrame(layoutToasts);

    clearTimeout(showAchievementToast._timer);
    showAchievementToast._timer = window.setTimeout(() => {
      els.achievementToast.hidden = true;
      layoutToasts();
    }, 3500);
  }

  function showFloatingMessage(el: HTMLElement, text: string, duration: number) {
    el.textContent = text;
    el.hidden = false;
    layoutToasts();
    requestAnimationFrame(layoutToasts);

    clearTimeout((el as HTMLElement & { _timer?: number })._timer);
    (el as HTMLElement & { _timer?: number })._timer = window.setTimeout(() => {
      el.hidden = true;
      layoutToasts();
    }, duration);
  }

  showAchievementToast._timer = 0;

  return { showAchievementToast, showFloatingMessage };
}

export type ToastApi = ReturnType<typeof setupToast>;
