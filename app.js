(function () {
  "use strict";

  const STORAGE_KEY = "vrc-profile-state";
  const CODE_RESET = "reset";
  const CODE_HINT = "hint";
  const CODES_FRIEND_NAME = ["den3606", "den"];
  const CODES_MIRROR = ["6063ned", "ned"];
  const CODE_VRC_USER = "usr_aac1b0fa-a840-4408-bea8-38a010120d03";

  const BOOT_LINES = [
    "Connection established.",
    "Human detected.",
    "Loading profile...",
  ];

  const ACHIEVEMENTS = {
    "first-contact": { title: "First Contact", emoji: "👋" },
    observer: { title: "Observer", emoji: "👁️" },
    observed: { title: "Observed", emoji: "⏱️" },
    "vrc-engineer": { title: "VRC Engineer", emoji: "🔧" },
    "your-friend-name": { title: "Your Friend Name", emoji: "🤝" },
    "mirror-mirror": { title: "Mirror, Mirror", emoji: "🪞" },
    "deep-diver": { title: "Deep Diver", emoji: "🤿" },
    "full-signal": { title: "Full Signal", emoji: "✨" },
  };

  const COMPLETION_ID = "full-signal";

  // この3つが揃うと your-friend-name / mirror-mirror / deep-diver / full-signal の条件が表示される
  const SECRET_PREREQS = ["first-contact", "observer", "observed"];

  const SESSION_KEY = "vrc-profile-session";
  const OBSERVED_MS = 180000;

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
    achievementCount: document.getElementById("achievement-count"),
    achievementTotal: document.getElementById("achievement-total"),
    toastEmoji: document.getElementById("toast-emoji"),
    tabButtons: document.querySelectorAll(".vrc-tab"),
    tabProfile: document.getElementById("tab-profile"),
    tabAchievements: document.getElementById("tab-achievements"),
    hiddenProfile: document.getElementById("hidden-profile"),
    terminalToggle: document.getElementById("terminal-toggle"),
    accessTerminal: document.getElementById("access-terminal"),
    terminalClose: document.getElementById("terminal-close"),
    passwordInput: document.getElementById("password-input"),
    passwordSubmit: document.getElementById("password-submit"),
    terminalOutput: document.getElementById("terminal-output"),
    closeHidden: document.getElementById("close-hidden"),
    endReaderBtn: document.getElementById("end-reader-btn"),
  };

  init();

  function init() {
    runBootSequence();
    setupEndReaderButton();
    setupObserverTimer();
    setupObservedTimer();
    setupTerminal();
    setupHiddenProfile();
    setupTabs();
    loadSteamGames();
    renderAchievements();
    handleReturnVisitor();
    unlockAchievement("first-contact", { silent: true });
    checkAllAchievementsUnlocked();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw
        ? migrateState(JSON.parse(raw))
        : { visits: 0, achievements: [], observerShown: false };
    } catch {
      return { visits: 0, achievements: [], observerShown: false };
    }
  }

  function migrateState(data) {
    if (Array.isArray(data.achievements)) {
      data.achievements = data.achievements
        .map((id) => (id === "mirror-character" ? "mirror-mirror" : id))
        .filter((id) => id !== "return-signal");
      data.achievements = [...new Set(data.achievements)];
    }
    return data;
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
    // sessionStorage: このタブセッションが新規か（リロードでは消えない）
    const isNewSession = !sessionStorage.getItem(SESSION_KEY);
    if (!isNewSession) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    state.visits = (state.visits || 0) + 1;
    state.lastVisitAt = Date.now();
    saveState();

    const msg = RETURN_MESSAGES[state.visits];
    if (!msg) return;

    setTimeout(() => {
      showFloatingMessage(els.returnMessage, msg, 3500);
    }, 2800);
  }

  function setupObservedTimer() {
    if (state.achievements.includes("observed")) return;

    const timer = setTimeout(() => {
      unlockAchievement("observed");
    }, OBSERVED_MS);

    window.addEventListener(
      "beforeunload",
      () => clearTimeout(timer),
      { once: true }
    );
  }

  function setupTabs() {
    els.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(name) {
    const isProfile = name === "profile";

    els.tabProfile.hidden = !isProfile;
    els.tabAchievements.hidden = isProfile;

    els.tabButtons.forEach((btn) => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle("vrc-tab-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function loadSteamGames() {
    const list = document.getElementById("steam-games");
    if (!list) return;

    const inline = readInlineSteam();
    if (inline) renderSteamData(inline);

    fetch("./steam.json", { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.games) && data.games.length) {
          renderSteamData(data);
        }
      })
      .catch(() => {
        if (!inline) renderSteamFallback();
      });
  }

  function readInlineSteam() {
    const tag = document.getElementById("steam-data");
    if (!tag) return null;
    try {
      return JSON.parse(tag.textContent);
    } catch {
      return null;
    }
  }

  function renderSteamData(data) {
    const list = document.getElementById("steam-games");
    const updated = document.getElementById("steam-updated");
    if (!list) return;

    renderFeatured(Array.isArray(data.featured) ? data.featured : []);

    const games = Array.isArray(data.games) ? data.games : [];
    if (games.length === 0) {
      renderSteamFallback();
      return;
    }

    list.innerHTML = "";
    games.forEach((g) => list.appendChild(renderSteamGame(g)));

    if (updated && data.updatedAt) {
      const d = new Date(data.updatedAt);
      if (!Number.isNaN(d.getTime())) {
        updated.textContent =
          "Updated " +
          d.getFullYear() +
          "/" +
          String(d.getMonth() + 1).padStart(2, "0") +
          "/" +
          String(d.getDate()).padStart(2, "0");
        updated.hidden = false;
      }
    }
  }

  function renderFeatured(games) {
    const el = document.getElementById("steam-featured");
    if (!el) return;
    const section = el.closest(".profile-section");

    if (!games.length) {
      el.hidden = true;
      if (section) section.hidden = true;
      return;
    }

    el.innerHTML = "";
    games.forEach((g) => {
      const li = document.createElement("li");
      li.className = "steam-featured-item";

      const a = document.createElement("a");
      a.href = g.storeUrl || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.className = "steam-featured-capsule";
      img.src = g.capsule;
      img.alt = "";
      img.loading = "lazy";

      a.appendChild(img);
      li.appendChild(a);
      el.appendChild(li);
    });
    el.hidden = false;
    if (section) section.hidden = false;
  }

  function renderSteamFallback() {
    const list = document.getElementById("steam-games");
    if (!list) return;
    list.innerHTML =
      '<li class="steam-state"><a href="https://steamcommunity.com/id/dedendendedenpunn/" target="_blank" rel="noopener noreferrer">Steam で見る</a></li>';
  }

  function renderSteamGame(g) {
    const li = document.createElement("li");
    li.className = "steam-game";

    const a = document.createElement("a");
    a.className = "steam-game-link";
    a.href = g.storeUrl || "https://steamcommunity.com/id/dedendendedenpunn/";
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    if (g.capsule) {
      const img = document.createElement("img");
      img.className = "steam-game-capsule";
      img.src = g.capsule;
      img.alt = "";
      img.loading = "lazy";
      a.appendChild(img);
    }

    const info = document.createElement("span");
    info.className = "steam-game-info";

    const name = document.createElement("span");
    name.className = "steam-game-name";
    name.textContent = g.name || "Unknown";
    info.appendChild(name);

    const hours = document.createElement("span");
    hours.className = "steam-game-hours";
    hours.textContent = formatHours(g);
    info.appendChild(hours);

    a.appendChild(info);
    li.appendChild(a);
    return li;
  }

  function formatHours(g) {
    const parts = [];
    if (typeof g.hoursTwoWeeks === "number" && g.hoursTwoWeeks > 0) {
      parts.push("直近2週 " + g.hoursTwoWeeks.toLocaleString() + "h");
    }
    if (typeof g.hoursTotal === "number" && g.hoursTotal > 0) {
      parts.push("累計 " + g.hoursTotal.toLocaleString() + "h");
    }
    return parts.join(" ・ ");
  }

  function setupEndReaderButton() {
    if (!els.endReaderBtn) return;

    els.endReaderBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (!state.achievements.includes("observer")) {
        showObserverSequence();
      }
    });
  }

  function showObserverSequence() {
    showFloatingMessage(els.observerMessage, "Interesting.", 2500);
    unlockAchievement("observer");
  }

  function setupObserverTimer() {
    if (state.observerShown) return;

    const IDLE_MS = 45000;

    const timer = setTimeout(() => {
      if (state.observerShown) return;
      state.observerShown = true;
      saveState();

      showFloatingMessage(els.observerMessage, "Interesting.", 2500);
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

    els.passwordSubmit.addEventListener("click", tryCode);
    els.passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryCode();
    });
  }

  function tryCode() {
    const value = els.passwordInput.value.trim().toLowerCase();

    if (value === CODE_RESET) {
      resetAchievements();
      writeTerminal([
        "RESET COMPLETE",
        "",
        "Achievements cleared.",
        "ページを再度開き直してください。",
      ]);
      return;
    }

    if (value === CODE_HINT) {
      showHintTerminal();
      els.passwordInput.value = "";
      return;
    }

    if (value === CODE_VRC_USER) {
      unlockAchievement("vrc-engineer");
      writeTerminal([
        "USER ID VERIFIED",
        "",
        "Achievement Unlocked",
        "VRC Engineer",
      ]);
      els.passwordInput.value = "";
      return;
    }

    if (CODES_FRIEND_NAME.includes(value)) {
      unlockAchievement("your-friend-name");
      writeTerminal([
        "SIGNAL IDENTIFIED",
        "",
        "Achievement Unlocked",
        "Your Friend Name",
        "",
        "Mirror, Mirror:",
        "Read the friend name from the other side.",
      ]);
      els.passwordInput.value = "";
      return;
    }

    if (CODES_MIRROR.includes(value)) {
      writeTerminal([
        "ACCESS GRANTED",
        "",
        "Mirror, Mirror accepted.",
        "裏側のプロフィールへ移動します。",
      ]);
      unlockAchievement("mirror-mirror");

      els.passwordInput.value = "";
      setTimeout(() => {
        els.accessTerminal.hidden = true;
        showHiddenProfile();
      }, 1800);
      return;
    }

    if (value) {
      writeTerminal("ACCESS DENIED", { error: true });
    }
  }

  function writeTerminal(lines, { error = false } = {}) {
    els.terminalOutput.classList.toggle("error", error);
    els.terminalOutput.textContent = Array.isArray(lines) ? lines.join("\n") : lines;
  }

  const HINT_DETAILS = [
    "VRC Engineer: VRCで僕を特定するなにかです",
    "Your Friend Name: あなたの友だちの名前は…？",
    "Mirror, Mirror: VRCで鏡ですよ鏡。",
    "Deep Diver: 裏側の世界って、なんかちょっといいですよね。",
  ];

  function showHintTerminal() {
    els.terminalOutput.classList.remove("error");
    els.terminalOutput.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "terminal-hint";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "hint-reveal-trigger";
    trigger.textContent = "しょうがないにゃあ・・";

    const details = document.createElement("div");
    details.className = "hint-details";
    details.hidden = true;
    HINT_DETAILS.forEach((line) => {
      const row = document.createElement("div");
      row.textContent = line;
      details.appendChild(row);
    });

    trigger.addEventListener("click", () => {
      details.hidden = false;
      trigger.disabled = true;
      trigger.classList.add("is-revealed");
    });

    wrap.appendChild(trigger);
    wrap.appendChild(details);
    els.terminalOutput.appendChild(wrap);
  }

  function resetAchievements() {
    state.achievements = [];
    state.visits = 0;
    state.observerShown = false;
    delete state.lastVisitAt;
    saveState();
    sessionStorage.removeItem(SESSION_KEY);
    renderAchievements();
    els.passwordInput.value = "";

    if (els.endReaderBtn) {
      els.endReaderBtn.disabled = false;
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

    checkAllAchievementsUnlocked();
  }

  function checkAllAchievementsUnlocked() {
    if (state.achievements.includes(COMPLETION_ID)) return;

    const required = Object.keys(ACHIEVEMENTS).filter((key) => key !== COMPLETION_ID);
    if (!required.every((key) => state.achievements.includes(key))) return;

    unlockAchievement(COMPLETION_ID);
  }

  function renderAchievements() {
    const total = Object.keys(ACHIEVEMENTS).length;
    let unlockedCount = 0;

    const prereqsMet = SECRET_PREREQS.every((id) =>
      state.achievements.includes(id)
    );

    els.achievementList.querySelectorAll("[data-achievement]").forEach((card) => {
      const id = card.dataset.achievement;
      const unlocked = state.achievements.includes(id);
      card.classList.toggle("unlocked", unlocked);
      if (unlocked) unlockedCount += 1;

      if (card.dataset.secret === "true") {
        const concealed = !prereqsMet && !unlocked;
        card.classList.toggle("concealed", concealed);

        const emojiEl = card.querySelector(".achievement-emoji");
        const titleEl = card.querySelector(".achievement-title");
        const descEl = card.querySelector(".achievement-desc");

        if (concealed) {
          emojiEl.textContent = "❓";
          titleEl.textContent = "???";
          descEl.textContent = "条件は隠されている";
        } else {
          emojiEl.textContent = card.dataset.emoji;
          titleEl.textContent = card.dataset.title;
          descEl.innerHTML = card.dataset.desc;
        }
      }
    });

    if (els.achievementCount) els.achievementCount.textContent = String(unlockedCount);
    if (els.achievementTotal) els.achievementTotal.textContent = String(total);
  }

  function getToastElements() {
    return [els.returnMessage, els.observerMessage, els.achievementToast].filter(Boolean);
  }

  function layoutToasts() {
    const gap = 12;
    let top = 20;

    getToastElements().forEach((el) => {
      if (el.hidden) {
        el.style.removeProperty("top");
        return;
      }

      el.style.top = top + "px";
      top += el.offsetHeight + gap;
    });
  }

  function showAchievementToast({ title, emoji }) {
    els.toastEmoji.textContent = emoji;
    els.toastTitle.textContent = title;
    els.achievementToast.hidden = false;
    layoutToasts();
    requestAnimationFrame(layoutToasts);

    clearTimeout(showAchievementToast._timer);
    showAchievementToast._timer = setTimeout(() => {
      els.achievementToast.hidden = true;
      layoutToasts();
    }, 3500);
  }

  function showFloatingMessage(el, text, duration) {
    el.textContent = text;
    el.hidden = false;
    layoutToasts();
    requestAnimationFrame(layoutToasts);

    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.hidden = true;
      layoutToasts();
    }, duration);
  }
})();
