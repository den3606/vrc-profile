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

function renderFeatured(games: SteamGame[]) {
  const el = document.getElementById("steam-featured");
  if (!el) return;
  const section = el.closest(".profile-section");

  if (!games.length) {
    el.hidden = true;
    if (section instanceof HTMLElement) section.hidden = true;
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
}

function renderSteamFallback() {
  const list = document.getElementById("steam-games");
  if (!list) return;
  list.innerHTML =
    '<li class="steam-state"><a href="https://steamcommunity.com/id/dedendendedenpunn/" target="_blank" rel="noopener noreferrer">Steam で見る</a></li>';
}

function renderSteamGame(g: SteamGame) {
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

function formatHours(g: SteamGame) {
  const parts: string[] = [];
  if (typeof g.hoursTwoWeeks === "number" && g.hoursTwoWeeks > 0) {
    parts.push("直近2週 " + g.hoursTwoWeeks.toLocaleString() + "h");
  }
  if (typeof g.hoursTotal === "number" && g.hoursTotal > 0) {
    parts.push("累計 " + g.hoursTotal.toLocaleString() + "h");
  }
  return parts.join(" ・ ");
}
