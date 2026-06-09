import { getMessages } from "../i18n";

export interface SteamGame {
  appId?: string;
  name?: string;
  storeUrl?: string;
  capsule?: string;
  hoursTwoWeeks?: number;
  hoursTotal?: number;
}

export interface SteamData {
  updatedAt?: string;
  profileUrl?: string;
  featured?: SteamGame[];
  games?: SteamGame[];
  topGames?: SteamGame[];
}

export function loadSteamGames() {
  const list = document.getElementById("steam-games");
  if (!list) return;

  const inline = readInlineSteam();
  if (inline) renderSteamData(inline);

  fetch("./steam.json", { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: SteamData | null) => {
      if (data && Array.isArray(data.games) && data.games.length) {
        renderSteamData(data);
      }
    })
    .catch(() => {
      if (!inline) renderSteamFallback();
    });
}

function readInlineSteam(): SteamData | null {
  const tag = document.getElementById("steam-data");
  if (!tag) return null;
  try {
    return JSON.parse(tag.textContent ?? "") as SteamData;
  } catch {
    return null;
  }
}

function renderSteamData(data: SteamData) {
  const list = document.getElementById("steam-games");
  if (!list) return;

  const featured = Array.isArray(data.featured) ? data.featured : [];
  const topGames = Array.isArray(data.topGames) ? data.topGames : [];
  const games = Array.isArray(data.games) ? data.games : [];

  renderFeatured(featured, data.updatedAt);
  renderTopGames(topGames, data.updatedAt);

  if (games.length === 0) {
    renderSteamFallback();
    applyUpdatedLabel("steam-updated", data.updatedAt, false);
    return;
  }

  list.innerHTML = "";
  games.forEach((g) => list.appendChild(renderSteamGame(g)));
  applyUpdatedLabel("steam-updated", data.updatedAt, true);
}

function formatUpdatedAt(updatedAt: string) {
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return null;
  return (
    getMessages().steam.updatedPrefix +
    d.getFullYear() +
    "/" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(d.getDate()).padStart(2, "0")
  );
}

function applyUpdatedLabel(elementId: string, updatedAt: string | undefined, show: boolean) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (!show || !updatedAt) {
    el.hidden = true;
    return;
  }

  const text = formatUpdatedAt(updatedAt);
  if (!text) {
    el.hidden = true;
    return;
  }

  el.textContent = text;
  el.hidden = false;
}

function renderTopGames(games: SteamGame[], updatedAt?: string) {
  const list = document.getElementById("steam-top-games");
  if (!list) return;
  const section = list.closest(".profile-section");

  if (!games.length) {
    list.hidden = true;
    if (section instanceof HTMLElement) section.hidden = true;
    applyUpdatedLabel("steam-top-updated", updatedAt, false);
    return;
  }

  list.innerHTML = "";
  games.forEach((g) => list.appendChild(renderSteamGame(g, { totalOnly: true })));
  list.hidden = false;
  if (section instanceof HTMLElement) section.hidden = false;
  applyUpdatedLabel("steam-top-updated", updatedAt, true);
}

function renderFeatured(games: SteamGame[], updatedAt?: string) {
  const el = document.getElementById("steam-featured");
  if (!el) return;
  const section = el.closest(".profile-section");

  if (!games.length) {
    el.hidden = true;
    if (section instanceof HTMLElement) section.hidden = true;
    applyUpdatedLabel("steam-featured-updated", updatedAt, false);
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
    img.src = g.capsule ?? "";
    img.alt = "";
    img.loading = "lazy";

    a.appendChild(img);
    li.appendChild(a);
    el.appendChild(li);
  });
  el.hidden = false;
  if (section instanceof HTMLElement) section.hidden = false;
  applyUpdatedLabel("steam-featured-updated", updatedAt, true);
}

function renderSteamFallback() {
  const list = document.getElementById("steam-games");
  if (!list) return;
  const link = getMessages().steam.fallbackLink;
  list.innerHTML = `<li class="steam-state"><a href="https://steamcommunity.com/id/den3606/" target="_blank" rel="noopener noreferrer">${link}</a></li>`;
}

function renderSteamGame(g: SteamGame, options?: { totalOnly?: boolean }) {
  const li = document.createElement("li");
  li.className = "steam-game";

  const a = document.createElement("a");
  a.className = "steam-game-link";
  a.href = g.storeUrl || "https://steamcommunity.com/id/den3606/";
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
  name.textContent = g.name || getMessages().steam.unknownGame;
  info.appendChild(name);

  const hours = document.createElement("span");
  hours.className = "steam-game-hours";
  hours.textContent = options?.totalOnly ? formatTotalHours(g) : formatHours(g);
  info.appendChild(hours);

  a.appendChild(info);
  li.appendChild(a);
  return li;
}

function formatTotalHours(g: SteamGame) {
  const { hours } = getMessages().steam;
  if (typeof g.hoursTotal === "number" && g.hoursTotal > 0) {
    return hours.totalPrefix + g.hoursTotal.toLocaleString() + hours.suffix;
  }
  return "";
}

function formatHours(g: SteamGame) {
  const { hours } = getMessages().steam;
  const parts: string[] = [];
  if (typeof g.hoursTwoWeeks === "number" && g.hoursTwoWeeks > 0) {
    parts.push(hours.recentPrefix + g.hoursTwoWeeks.toLocaleString() + hours.suffix);
  }
  if (typeof g.hoursTotal === "number" && g.hoursTotal > 0) {
    parts.push(hours.totalPrefix + g.hoursTotal.toLocaleString() + hours.suffix);
  }
  return parts.join(hours.separator);
}
