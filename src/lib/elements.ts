export interface Elements {
  bootOverlay: HTMLElement;
  bootLines: HTMLElement[];
  mainContent: HTMLElement;
  returnMessage: HTMLElement;
  achievementToast: HTMLElement;
  toastTitle: HTMLElement;
  toastEmoji: HTMLElement;
  achievementList: HTMLElement;
  achievementCount: HTMLElement | null;
  achievementTotal: HTMLElement | null;
  tabButtons: NodeListOf<HTMLButtonElement>;
  tabProfile: HTMLElement;
  tabAchievements: HTMLElement;
  hiddenProfile: HTMLElement;
  thankYouVrc: HTMLElement | null;
  closeThankYouVrc: HTMLButtonElement | null;
  terminalToggle: HTMLButtonElement;
  accessTerminal: HTMLElement;
  terminalClose: HTMLButtonElement;
  passwordInput: HTMLInputElement;
  passwordSubmit: HTMLButtonElement;
  terminalOutput: HTMLElement;
  closeHidden: HTMLButtonElement;
  endReaderBtn: HTMLButtonElement | null;
  avatarPetBtn: HTMLButtonElement | null;
  avatarWrap: HTMLElement | null;
}

function required<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

export function getElements(): Elements {
  return {
    bootOverlay: required("boot-overlay"),
    bootLines: [
      required("boot-line-1"),
      required("boot-line-2"),
      required("boot-line-3"),
    ],
    mainContent: required("main-content"),
    returnMessage: required("return-message"),
    achievementToast: required("achievement-toast"),
    toastTitle: required("toast-title"),
    toastEmoji: required("toast-emoji"),
    achievementList: required("achievement-list"),
    achievementCount: document.getElementById("achievement-count"),
    achievementTotal: document.getElementById("achievement-total"),
    tabButtons: document.querySelectorAll<HTMLButtonElement>(".vrc-tab"),
    tabProfile: required("tab-profile"),
    tabAchievements: required("tab-achievements"),
    hiddenProfile: required("hidden-profile"),
    thankYouVrc: document.getElementById("thank-you-vrc"),
    closeThankYouVrc: document.getElementById("close-thank-you-vrc") as HTMLButtonElement | null,
    terminalToggle: required<HTMLButtonElement>("terminal-toggle"),
    accessTerminal: required("access-terminal"),
    terminalClose: required<HTMLButtonElement>("terminal-close"),
    passwordInput: required<HTMLInputElement>("password-input"),
    passwordSubmit: required<HTMLButtonElement>("password-submit"),
    terminalOutput: required("terminal-output"),
    closeHidden: required<HTMLButtonElement>("close-hidden"),
    endReaderBtn: document.getElementById("end-reader-btn") as HTMLButtonElement | null,
    avatarPetBtn: document.getElementById("avatar-pet-btn") as HTMLButtonElement | null,
    avatarWrap: document.querySelector(".vrc-avatar-wrap"),
  };
}
