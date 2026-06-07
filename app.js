(function () {
  "use strict";

  const STORAGE_KEY = "vrc-profile-state";
  const PASSWORD = "mirror";

  const BOOT_LINES = [
    "Connection established.",
    "Human detected.",
    "Loading profile...",
  ];

  const ACHIEVEMENTS = {
    "first-contact": "First Contact",
    "curious-visitor": "Curious Visitor",
    "observer": "Observer",
    "mirror-walker": "Mirror Walker",
    "deep-diver": "Deep Diver",
  };

  const RETURN_MESSAGES = {
    2: "Welcome back.",
    3: "You returned.",
    5: "You really like exploring.",
  };

  const state = loadState();

  const els = {
    bootOverlay: document.getElementById("boot-overlay"),
    bootLines: [
      document.getElementById("boot-line-1"),
      document.getElementById("boot-line-2"),
      document.getElementById("boot-line-3"),
    ],
    mainContent: document.getElementById("main-content"),
    returnMessage: document.getElementById("return-message"),
    achievementToast: document.getElementById("achievement-toast"),
    toastTitle: document.getElementById("toast-title"),
    observerMessage: document.getElementById("observer-message"),
    achievementList: document.getElementById("achievement-list"),
    hiddenProfile: document.getElementById("hidden-profile"),
    terminalToggle: document.getElementById("terminal-toggle"),
    accessTerminal: document.getElementById("access-terminal"),
    terminalClose: document.getElementById("terminal-close"),
    passwordInput: document.getElementById("password-input"),
    passwordSubmit: document.getElementById("password-submit"),
    terminalOutput: document.getElementById("terminal-output"),
    closeHidden: document.getElementById("close-hidden"),
  };

  init();

  function init() {
    runBootSequence();
    setupScrollTracking();
    setupObserverTimer();
    setupTerminal();
    setupHiddenProfile();
    renderAchievements();
    handleReturnVisitor();
    unlockAchievement("first-contact", { silent: true });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw
        ? JSON.parse(raw)
        : { visits: 0, achievements: [], observerShown: false };
    } catch {
      return { visits: 0, achievements: [], observerShown: false };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function runBootSequence() {
    const delays = [400, 900, 1400];
    const revealAt = 2200;

    BOOT_LINES.forEach((text, i) => {
      setTimeout(() => {
        els.bootLines[i].textContent = text;
        els.bootLines[i].classList.add("visible");
      }, delays[i]);
    });

    setTimeout(() => {
      els.bootOverlay.classList.add("fade-out");
      els.mainContent.hidden = false;

      setTimeout(() => {
        els.bootOverlay.remove();
      }, 500);
    }, revealAt);
  }

  function handleReturnVisitor() {
    state.visits += 1;
    saveState();

    const msg = RETURN_MESSAGES[state.visits];
    if (!msg) return;

    setTimeout(() => {
      showFloatingMessage(els.returnMessage, msg, 3500);
    }, 2800);
  }

  function setupScrollTracking() {
    let curiousUnlocked = state.achievements.includes("curious-visitor");
    let observerUnlocked = state.achievements.includes("observer");
    let bottomReached = false;

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? scrollTop / docHeight : 1;

      if (!curiousUnlocked && ratio >= 0.5) {
        curiousUnlocked = true;
        unlockAchievement("curious-visitor");
      }

      if (!bottomReached && ratio >= 0.98) {
        bottomReached = true;

        if (!observerUnlocked) {
          showObserverSequence();
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function showObserverSequence() {
    showFloatingMessage(els.observerMessage, "You are still here.", 2500);

    setTimeout(() => {
      showFloatingMessage(els.observerMessage, "Interesting.", 2500);
      unlockAchievement("observer");
    }, 3000);
  }

  function setupObserverTimer() {
    if (state.observerShown) return;

    const IDLE_MS = 45000;

    const timer = setTimeout(() => {
      if (state.observerShown) return;
      state.observerShown = true;
      saveState();

      showFloatingMessage(els.observerMessage, "You are still here.", 2500);

      setTimeout(() => {
        showFloatingMessage(els.observerMessage, "Interesting.", 2500);
      }, 3000);
    }, IDLE_MS);

    window.addEventListener(
      "beforeunload",
      () => clearTimeout(timer),
      { once: true }
    );
  }

  function setupTerminal() {
    els.terminalToggle.addEventListener("click", () => {
      const open = !els.accessTerminal.hidden;
      els.accessTerminal.hidden = open;
      if (!open) {
        els.passwordInput.focus();
        els.terminalOutput.textContent = "";
        els.terminalOutput.classList.remove("error");
      }
    });

    els.terminalClose.addEventListener("click", () => {
      els.accessTerminal.hidden = true;
    });

    els.passwordSubmit.addEventListener("click", tryPassword);
    els.passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryPassword();
    });
  }

  function tryPassword() {
    const value = els.passwordInput.value.trim().toLowerCase();

    if (value === PASSWORD) {
      els.terminalOutput.classList.remove("error");
      els.terminalOutput.textContent = [
        "ACCESS GRANTED",
        "",
        "Observer protocol initiated.",
      ].join("\n");

      unlockAchievement("mirror-walker");

      setTimeout(() => {
        els.accessTerminal.hidden = true;
        showHiddenProfile();
      }, 1800);
    } else if (value) {
      els.terminalOutput.classList.add("error");
      els.terminalOutput.textContent = "ACCESS DENIED";
    }
  }

  function setupHiddenProfile() {
    els.closeHidden.addEventListener("click", () => {
      els.hiddenProfile.hidden = true;
      document.body.style.overflow = "";
    });
  }

  function showHiddenProfile() {
    els.hiddenProfile.hidden = false;
    document.body.style.overflow = "hidden";
    unlockAchievement("deep-diver");
    els.hiddenProfile.scrollTop = 0;
  }

  function unlockAchievement(id, { silent = false } = {}) {
    if (state.achievements.includes(id)) return;

    state.achievements.push(id);
    saveState();
    renderAchievements();

    if (!silent) {
      showAchievementToast(ACHIEVEMENTS[id]);
    }
  }

  function renderAchievements() {
    els.achievementList.querySelectorAll("[data-achievement]").forEach((li) => {
      const id = li.dataset.achievement;
      const unlocked = state.achievements.includes(id);
      li.classList.toggle("unlocked", unlocked);
      li.querySelector(".achievement-icon").textContent = unlocked ? "✓" : "□";
    });
  }

  function showAchievementToast(title) {
    els.toastTitle.textContent = title;
    els.achievementToast.hidden = false;

    clearTimeout(showAchievementToast._timer);
    showAchievementToast._timer = setTimeout(() => {
      els.achievementToast.hidden = true;
    }, 3500);
  }

  function showFloatingMessage(el, text, duration) {
    el.textContent = text;
    el.hidden = false;

    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.hidden = true;
    }, duration);
  }
})();
