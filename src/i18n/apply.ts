import type { Elements } from "../lib/elements";
import { getMessages } from "./index";
import type { AchievementId, MessageBundle } from "./types";

function setText(id: string, text: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function applyMeta(messages: MessageBundle) {
  document.title = messages.meta.title;

  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = messages.meta.description;
}

function applyUi(els: Elements, messages: MessageBundle) {
  const { ui, steam, signal } = messages;

  els.tabButtons.forEach((btn) => {
    if (btn.dataset.tab === "profile") btn.textContent = ui.tabs.profile;
    if (btn.dataset.tab === "achievements") btn.textContent = ui.tabs.achievements;
  });

  const tabsNav = document.querySelector<HTMLElement>(".vrc-tabs");
  if (tabsNav) tabsNav.setAttribute("aria-label", ui.tabs.navLabel);

  setText("profile-name", ui.profile.name);
  setText("profile-tagline", ui.profile.displayName);

  const avatar = document.querySelector<HTMLImageElement>(".vrc-avatar");
  if (avatar) avatar.alt = ui.profile.avatarAlt;

  if (els.avatarPetBtn) els.avatarPetBtn.setAttribute("aria-label", ui.profile.avatarPetLabel);

  const vrchatBtn = document.querySelector<HTMLAnchorElement>("[data-field='vrchat-url']");
  if (vrchatBtn) vrchatBtn.textContent = ui.profile.vrchatButton;

  setText("about-title", ui.about.title);

  const localeHint = document.getElementById("locale-hint");
  if (localeHint) {
    setText("locale-hint-text", ui.about.localeHint);
    localeHint.title = ui.about.localeHintTitle;
    localeHint.hidden = false;
  }
  setText("steam-featured-title", steam.sections.featured);
  setText("steam-recent-title", steam.sections.recent);
  setText("steam-top-title", steam.sections.top);
  setText("achievements-header", ui.achievements.header);
  setText("achievement-progress-label", ui.achievements.progressUnlocked);
  setText("toast-label", ui.toast.label);

  if (els.endReaderBtn) els.endReaderBtn.textContent = ui.footer.endMarker;

  els.terminalToggle.setAttribute("aria-label", ui.terminal.toggleLabel);
  els.terminalToggle.title = ui.terminal.toggleTitle;
  setText("terminal-header", ui.terminal.header);
  els.terminalClose.setAttribute("aria-label", ui.terminal.closeLabel);
  els.terminalClose.textContent = "×";
  setText("terminal-code-label", ui.terminal.codeLabel);
  els.codeSubmit.textContent = ui.terminal.submit;

  els.closeHidden.textContent = ui.hidden.returnButton;
  if (els.closeThankYouVrc) els.closeThankYouVrc.textContent = ui.hidden.returnButton;

  document.querySelectorAll<HTMLImageElement>(".thank-you-vrc-image").forEach((img) => {
    img.alt = ui.hidden.thankYouAlt;
  });

  setText("hidden-signal-title", signal.title);
  setText("hidden-signal-name-label", signal.nameLabel);
  setText("hidden-signal-message-label", signal.messageLabel);

  const messageInput = document.getElementById("hidden-signal-message") as HTMLTextAreaElement | null;
  if (messageInput) messageInput.placeholder = signal.messagePlaceholder;

  const submitBtn = document.getElementById("hidden-signal-submit");
  if (submitBtn) submitBtn.textContent = signal.submit;

  const loading = document.querySelector<HTMLElement>("#steam-games .steam-state");
  if (loading) loading.textContent = steam.loading;
}

function renderAbout(messages: MessageBundle) {
  const container = document.getElementById("about-paragraphs");
  if (!container) return;

  container.innerHTML = "";
  messages.profile.paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    container.appendChild(p);
  });

  const tags = document.getElementById("language-tags");
  if (!tags) return;

  tags.innerHTML = "";
  messages.profile.languages.forEach((label) => {
    const span = document.createElement("span");
    span.className = "vrc-lang-tag";
    span.textContent = label;
    tags.appendChild(span);
  });

}

export function renderAchievementCards(els: Elements) {
  const messages = getMessages();
  const list = els.achievementList;
  list.innerHTML = "";

  for (const id of messages.achievements.order) {
    const entry = messages.achievements.entries[id as AchievementId];
    const article = document.createElement("article");
    article.className = "achievement-card";
    article.dataset.achievement = id;
    if (entry.secret) article.dataset.secret = "true";
    if ("ghost" in entry && entry.ghost) article.hidden = true;

    article.innerHTML = `
      <div class="achievement-emoji" aria-hidden="true">${entry.emoji}</div>
      <div class="achievement-body">
        <h3 class="achievement-title">${entry.title}</h3>
        <p class="achievement-desc">${entry.desc}</p>
      </div>
    `;

    list.appendChild(article);
  }
}

function renderHiddenProfile(messages: MessageBundle) {
  const container = document.getElementById("hidden-profile-sections");
  if (!container) return;

  const { hiddenProfile: hp } = messages;
  container.innerHTML = "";

  const introCard = document.createElement("div");
  introCard.className = "vrc-card";

  hp.intro.forEach((text, index) => {
    const p = document.createElement("p");
    p.className = "hidden-intro";
    if (index === hp.intro.length - 1) p.classList.add("hidden-intro-last");
    p.textContent = text;
    introCard.appendChild(p);
  });

  container.appendChild(introCard);

  hp.sections.forEach((section) => {
    const el = document.createElement("section");
    el.className = "vrc-card profile-section";

    const h2 = document.createElement("h2");
    h2.className = "section-label";
    h2.textContent = section.title;
    el.appendChild(h2);

    section.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      el.appendChild(p);
    });

    container.appendChild(el);
  });

  const songsSection = document.createElement("section");
  songsSection.className = "vrc-card profile-section";

  const songsTitle = document.createElement("h2");
  songsTitle.className = "section-label";
  songsTitle.textContent = hp.favoriteSongs.title;
  songsSection.appendChild(songsTitle);

  if (hp.favoriteSongs.spotifyEmbed) {
    const embedWrap = document.createElement("div");
    embedWrap.className = "spotify-embed";

    const iframe = document.createElement("iframe");
    iframe.dataset.testid = "embed-iframe";
    iframe.style.borderRadius = "12px";
    iframe.src = hp.favoriteSongs.spotifyEmbed;
    iframe.width = "100%";
    iframe.height = "352";
    iframe.setAttribute("frameborder", "0");
    iframe.allowFullscreen = true;
    iframe.allow =
      "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.loading = "lazy";

    embedWrap.appendChild(iframe);
    songsSection.appendChild(embedWrap);
  }

  const ul = document.createElement("ul");
  ul.className = "profile-list";
  hp.favoriteSongs.items.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.label;
    li.appendChild(a);
    ul.appendChild(li);
  });
  songsSection.appendChild(ul);

  const songsFooter = document.createElement("p");
  songsFooter.textContent = hp.favoriteSongs.footer;
  songsSection.appendChild(songsFooter);
  container.appendChild(songsSection);

  const outroSection = document.createElement("section");
  outroSection.className = "vrc-card profile-section hidden-profile-outro";

  const outroText = document.createElement("p");
  outroText.className = "hidden-profile-outro-text";
  outroText.textContent = hp.outro;
  outroSection.appendChild(outroText);

  const outroImage = document.createElement("img");
  outroImage.className = "thank-you-vrc-image";
  outroImage.src = "images/thank_you_vrc.png";
  outroImage.alt = messages.ui.hidden.thankYouAlt;
  outroImage.width = 960;
  outroImage.height = 540;
  outroSection.appendChild(outroImage);
  container.appendChild(outroSection);
}

export function applyI18n(els: Elements) {
  const messages = getMessages();
  applyMeta(messages);
  applyUi(els, messages);
  renderAbout(messages);
  renderAchievementCards(els);
  renderHiddenProfile(messages);
}
