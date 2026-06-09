import { BOOT_LINES } from "../config/constants";
import type { Elements } from "../lib/elements";

export function runBootSequence(els: Elements) {
  const delays = [400, 900, 1400];
  const revealAt = 2200;

  BOOT_LINES.forEach((text, i) => {
    window.setTimeout(() => {
      els.bootLines[i].textContent = text;
      els.bootLines[i].classList.add("visible");
    }, delays[i]);
  });

  window.setTimeout(() => {
    els.bootOverlay.classList.add("fade-out");
    els.mainContent.hidden = false;

    window.setTimeout(() => {
      els.bootOverlay.remove();
    }, 500);
  }, revealAt);
}

export function setupTabs(els: Elements) {
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(els, btn.dataset.tab ?? "profile"));
  });
}

function switchTab(els: Elements, name: string) {
  const isProfile = name === "profile";

  els.tabProfile.hidden = !isProfile;
  els.tabAchievements.hidden = isProfile;

  els.tabButtons.forEach((btn) => {
    const active = btn.dataset.tab === name;
    btn.classList.toggle("vrc-tab-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  window.scrollTo({
    top: 0,
    behavior: "instant" in window ? ("instant" as ScrollBehavior) : "auto",
  });
}
