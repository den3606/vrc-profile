(function () {
  "use strict";

  const STORAGE_KEY = "vrc-profile-state";
  const CODE_RESET = "reset";
  const CODE_HINT = "hint";
  const CODES_FRIEND_NAME = ["den3606", "den"];
  const CODES_MIRROR = ["6063ned", "ned"];
  const CODE_MIRROR_HINT = "mirror";
  const CODE_VRC_USER = ["usr_aac1b0fa-a840-4408-bea8-38a010120d03", "aac1b0fa-a840-4408-bea8-38a010120d03"];
  const CODE_ALREADY_KNOW = "already_knows";
  const CODE_THANK_YOU_VRC = "thank_you_vrc";
  const CODE_MAGIC = "magic";
  const CODE_HELP = "help";
  const CODE_DEEP_DIVER = "deep_diver";
  const CODES_HIMAWARI = ["#fcc800", "fcc800"];
  const CODES_KUD = [
    "kud",
    "kudryavka",
    "くど",
    "くどりゃふか",
    "クドリャフカ",
    "クド",
    "能美クドリャフカ",
  ];

  const BOOT_LINES = [
    "Connection established.",
    "Human detected.",
    "Loading profile...",
  ];

  const ACHIEVEMENTS = {
    "first-contact": { title: "First Contact", emoji: "👋" },
    observer: { title: "Observer", emoji: "👁️" },
    observed: { title: "Observed", emoji: "⏱️" },
    "pet-pet-pet": { title: "Pet, Pet, Pet", emoji: "🐕" },
    himawari: { title: "Himawari", emoji: "🌻" },
    "vrc-engineer": { title: "VRC Engineer", emoji: "🔧" },
    honester: { title: "Honester", emoji: "🫡" },
    "escape-from-friend": { title: "Escape From Friend", emoji: "🏃" },
    "your-friend-name": { title: "Your Friend Name", emoji: "🤝" },
    "mirror-mirror": { title: "Mirror, Mirror", emoji: "🪞" },
    "science-and-magic-intersect": { title: "Science And Magic", emoji: "🔮" },
    "help-me-dennnnnn": { title: "Help me, DENNNNNN!!", emoji: "🆘" },
    "full-signal": { title: "Full Signal", emoji: "✨" },
    "deep-diver": { title: "Deep Diver", emoji: "🤿" },
    wafu: { title: "Wafu!", emoji: "🚀" },
  };

  const COMPLETION_ID = "full-signal";
  const POST_COMPLETION_IDS = ["deep-diver", "wafu"];
  const GHOST_ACHIEVEMENT_IDS = ["wafu"];

  const SESSION_KEY = "vrc-profile-session";
  const OBSERVED_MS = 180000;
  const PET_CLICKS_REQUIRED = 10;
  const PET_ESCAPE_CLICKS = 20;

  const RETURN_MESSAGES = {
    2: "Welcome back.",
    3: "You returned.",
    5: "You really like exploring.",
  };

  const state = loadState();
  let petClicksSession = 0;
  let avatarEscapedSession = false;

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
    achievementList: document.getElementById("achievement-list"),
    achievementCount: document.getElementById("achievement-count"),
    achievementTotal: document.getElementById("achievement-total"),
    toastEmoji: document.getElementById("toast-emoji"),
    tabButtons: document.querySelectorAll(".vrc-tab"),
    tabProfile: document.getElementById("tab-profile"),
    tabAchievements: document.getElementById("tab-achievements"),
    hiddenProfile: document.getElementById("hidden-profile"),
    thankYouVrc: document.getElementById("thank-you-vrc"),
    closeThankYouVrc: document.getElementById("close-thank-you-vrc"),
    terminalToggle: document.getElementById("terminal-toggle"),
    accessTerminal: document.getElementById("access-terminal"),
    terminalClose: document.getElementById("terminal-close"),
    passwordInput: document.getElementById("password-input"),
    passwordSubmit: document.getElementById("password-submit"),
    terminalOutput: document.getElementById("terminal-output"),
    closeHidden: document.getElementById("close-hidden"),
    endReaderBtn: document.getElementById("end-reader-btn"),
    avatarPetBtn: document.getElementById("avatar-pet-btn"),
    avatarWrap: document.querySelector(".vrc-avatar-wrap"),
  };

  init();

  function init() {
    runBootSequence();
    setupEndReaderButton();
    setupAvatarPet();
    setupObservedTimer();
    setupTerminal();
    setupHiddenProfile();
    setupThankYouVrc();
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
        : { visits: 0, achievements: [] };
    } catch {
      return { visits: 0, achievements: [] };
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
        unlockAchievement("observer");
      }
    });
  }

  function setupAvatarPet() {
    if (!els.avatarPetBtn) return;

    els.avatarPetBtn.addEventListener("click", () => {
      if (avatarEscapedSession) return;

      petClicksSession += 1;
      const count = petClicksSession;

      if (count <= PET_CLICKS_REQUIRED) {
        playAvatarPetAnimation("petting");
        if (count === PET_CLICKS_REQUIRED) {
          unlockAchievement("pet-pet-pet");
        }
        return;
      }

      if (count < PET_ESCAPE_CLICKS) {
        els.avatarPetBtn.classList.add("is-uncomfortable");
        playAvatarPetAnimation("uncomfortable");
        return;
      }

      els.avatarPetBtn.classList.remove("is-uncomfortable");
      els.avatarPetBtn.classList.add("is-escaping");
      unlockAchievement("escape-from-friend");
    });

    els.avatarPetBtn.addEventListener("animationend", (e) => {
      if (e.target === els.avatarPetBtn && els.avatarPetBtn.classList.contains("is-escaping")) {
        els.avatarPetBtn.classList.remove("is-escaping");
        setAvatarEscaped();
        return;
      }

      if (e.target.classList.contains("vrc-avatar")) {
        els.avatarPetBtn.classList.remove("is-petting", "is-reacting");
      }
    });
  }

  function setAvatarEscaped() {
    avatarEscapedSession = true;
    if (els.avatarWrap) els.avatarWrap.classList.add("is-escaped");
    if (els.avatarPetBtn) {
      els.avatarPetBtn.disabled = true;
      els.avatarPetBtn.classList.remove("is-uncomfortable", "is-petting", "is-reacting", "is-escaping");
    }
  }

  function playAvatarPetAnimation(mode) {
    const btn = els.avatarPetBtn;
    btn.classList.remove("is-petting", "is-reacting");
    void btn.offsetWidth;

    if (mode === "uncomfortable") {
      btn.classList.add("is-reacting");
      return;
    }

    btn.classList.add("is-petting");
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

  function normalizeCode(input) {
    return input.trim().toLowerCase().replace(/[\s_]+/g, "_");
  }

  function matchesAnyCode(input, codes) {
    const normalized = normalizeCode(input);
    return codes.some((code) => normalizeCode(code) === normalized);
  }

  function tryCode() {
    const value = normalizeCode(els.passwordInput.value);

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

    if (CODE_VRC_USER.includes(value)) {
      unlockAchievement("vrc-engineer");
      writeTerminal(terminalUnlockMessage("vrc-engineer", ["USER ID VERIFIED"]));
      els.passwordInput.value = "";
      return;
    }

    if (value === CODE_ALREADY_KNOW) {
      unlockAchievement("honester");
      writeTerminal(
        terminalUnlockMessage("honester", [
          "[next code hint]",
          "文章の意味としても機能しています。なぜならあなたはもう他のcodeも知っているのだから。",
          "分からなかったら「h???」もあります。",
        ])
      );
      els.passwordInput.value = "";
      return;
    }

    if (CODES_FRIEND_NAME.includes(value)) {
      unlockAchievement("your-friend-name");
      writeTerminal(
        terminalUnlockMessage("your-friend-name", [
          "[next code hint]",
          "自分は相手の方を向いて話すほうが好きなんですけど、",
          "VRCの人はよく、別の世界の人を見て話しているよね",
        ])
      );
      els.passwordInput.value = "";
      return;
    }

    if (value === CODE_MIRROR_HINT) {
      writeTerminal("鏡自体ではないよ！何かの順番を変える感じ。");
      els.passwordInput.value = "";
      return;
    }

    if (CODES_MIRROR.includes(value)) {
      unlockAchievement("mirror-mirror");
      writeTerminal(
        terminalUnlockMessage("mirror-mirror", [
          "SIGNAL IDENTIFIED",
        ])
      );
      els.passwordInput.value = "";
      return;
    }

    if (value === CODE_DEEP_DIVER) {
      writeTerminal([
        "ACCESS GRANTED",
        "",
        "裏側のプロフィールへ移動します。",
      ]);
      els.passwordInput.value = "";
      setTimeout(() => {
        els.accessTerminal.hidden = true;
        showHiddenProfile();
      }, 1800);
      return;
    }

    if (value === CODE_MAGIC) {
      unlockAchievement("science-and-magic-intersect");
      writeTerminal(terminalUnlockMessage("science-and-magic-intersect"));
      els.passwordInput.value = "";
      return;
    }

    if (value === CODE_HELP) {
      unlockAchievement("help-me-dennnnnn");
      writeTerminal(
        terminalUnlockMessage("help-me-dennnnnn", [
          "[next code hint]",
          "なぞなぞで困ったときは help よりもまず、 h??? だよね。",
        ])
      );
      els.passwordInput.value = "";
      return;
    }

    if (matchesAnyCode(els.passwordInput.value, CODES_HIMAWARI)) {
      unlockAchievement("himawari");
      writeTerminal(terminalUnlockMessage("himawari"));
      els.passwordInput.value = "";
      return;
    }

    if (matchesAnyCode(els.passwordInput.value, CODES_KUD)) {
      unlockAchievement("wafu");
      writeTerminal(terminalUnlockMessage("wafu", ["わふー >ω<"]));
      els.passwordInput.value = "";
      return;
    }

    if (value === CODE_THANK_YOU_VRC) {
      els.passwordInput.value = "";
      els.accessTerminal.hidden = true;
      showThankYouVrc();
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

  function terminalUnlockMessage(id, prefixLines = []) {
    const footer = ["Achievement Unlocked", ACHIEVEMENTS[id].title];
    if (!prefixLines.length) return footer;
    return [...prefixLines, "", ...footer];
  }

  const HINT_ACHIEVEMENT_IDS = [
    "first-contact",
    "observer",
    "pet-pet-pet",
    "himawari",
    "vrc-engineer",
    "honester",
    "observed",
    "escape-from-friend",
    "your-friend-name",
    "mirror-mirror",
    "science-and-magic-intersect",
    "help-me-dennnnnn",
    "deep-diver",
  ];

  const HINT_DETAILS = [
    "このページを見ているということは、もう私と挨拶してますよね？",
    "プロフィールは最後まで見てくださいね。そして完了報告も！",
    "マウスカーソルって手の役割にもなるんですよ",
    "カラーコードもコードだよね。",
    "VRCって個人のプロフィールを特定するためのIDが振られてたりするんですよ。知ってましたか？",
    "正直者ってことです。",
    "ムスカ大佐でも、そのぐらいは待ってくれたんですよ。",
    "急に撫でられすぎたりすると、怖いよね。",
    "あなたの友だちの名前は…？",
    "VRCだと、無言勢がよく鏡文字を使って書きますよね",
    "プロフィールは1つではない",
    "hint以外にも困ったときに使う言葉ってありますよね。そう、h??? me!",
    "裏側の世界って、なんかちょっといいですよね。",
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

    const list = document.createElement("div");
    list.className = "hint-list";
    list.hidden = true;

    HINT_DETAILS.forEach((text, index) => {
      const item = document.createElement("div");
      item.className = "hint-item";

      const achievementId = HINT_ACHIEVEMENT_IDS[index];
      const unlocked = state.achievements.includes(achievementId);
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
    els.terminalOutput.appendChild(wrap);
  }

  function resetAchievements() {
    state.achievements = [];
    state.visits = 0;
    delete state.lastVisitAt;
    petClicksSession = 0;
    avatarEscapedSession = false;
    saveState();
    sessionStorage.removeItem(SESSION_KEY);
    renderAchievements();
    els.passwordInput.value = "";

    if (els.endReaderBtn) {
      els.endReaderBtn.disabled = false;
    }

    if (els.avatarWrap) els.avatarWrap.classList.remove("is-escaped");
    if (els.avatarPetBtn) {
      els.avatarPetBtn.disabled = false;
      els.avatarPetBtn.classList.remove("is-uncomfortable", "is-petting", "is-reacting", "is-escaping");
    }
  }

  function setupHiddenProfile() {
    els.closeHidden.addEventListener("click", () => {
      els.hiddenProfile.hidden = true;
      document.body.style.overflow = "";
    });
  }

  function setupThankYouVrc() {
    if (!els.closeThankYouVrc) return;

    els.closeThankYouVrc.addEventListener("click", () => {
      els.thankYouVrc.hidden = true;
      document.body.style.overflow = "";
    });
  }

  function showHiddenProfile() {
    els.hiddenProfile.hidden = false;
    document.body.style.overflow = "hidden";
    unlockAchievement("deep-diver");
    els.hiddenProfile.scrollTop = 0;
  }

  function showThankYouVrc() {
    if (!els.thankYouVrc) return;

    els.thankYouVrc.hidden = false;
    document.body.style.overflow = "hidden";
    els.thankYouVrc.scrollTop = 0;
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

    const required = Object.keys(ACHIEVEMENTS).filter(
      (key) => key !== COMPLETION_ID && !POST_COMPLETION_IDS.includes(key)
    );
    if (!required.every((key) => state.achievements.includes(key))) return;

    unlockAchievement(COMPLETION_ID);
  }

  function renderAchievements() {
    let total = 0;
    let unlockedCount = 0;

    els.achievementList.querySelectorAll("[data-achievement]").forEach((card) => {
      const id = card.dataset.achievement;
      const unlocked = state.achievements.includes(id);
      const isGhost = GHOST_ACHIEVEMENT_IDS.includes(id);

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

        if (concealed) {
          emojiEl.textContent = "❓";
          titleEl.textContent = "???";
          descEl.textContent = "条件は隠されている";
        } else {
          emojiEl.textContent = card.dataset.emoji;
          titleEl.textContent = ACHIEVEMENTS[id].title;
          descEl.innerHTML = card.dataset.desc;
        }
      }
    });

    if (els.achievementCount) els.achievementCount.textContent = String(unlockedCount);
    if (els.achievementTotal) els.achievementTotal.textContent = String(total);
  }

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
