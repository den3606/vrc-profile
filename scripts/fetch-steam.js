import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROFILE_URL = "https://steamcommunity.com/id/dedendendedenpunn";
const XML_URL = `${PROFILE_URL}/?xml=1`;
const HTML_URL = `${PROFILE_URL}/`;
const OUTPUT = path.join(rootDir, "public", "steam.json");
const LEGACY_OUTPUT = path.join(rootDir, "steam.json");
const UA = "Mozilla/5.0 (vrc-profile steam sync)";

function extract(block, tag) {
  const re = new RegExp(
    `<${tag}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${tag}>`
  );
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function toNumber(value) {
  if (!value) return null;
  const n = parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseSteamId(xml) {
  return (xml.match(/<steamID64>(\d+)<\/steamID64>/) || [])[1] || "";
}

function capsuleUrl(appId) {
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_184x69.jpg`;
}

function minutesToHours(minutes) {
  if (typeof minutes !== "number" || minutes <= 0) return null;
  return Math.round((minutes / 60) * 10) / 10;
}

function getSteamApiKey() {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    const message =
      "STEAM_API_KEY is not set. Add a key from https://steamcommunity.com/dev/apikey";
    if (process.env.CI) throw new Error(message);
    console.warn(message);
    return null;
  }
  return key;
}

async function steamApiGet(method, params) {
  const key = getSteamApiKey();
  if (!key) return null;

  const url = new URL(`https://api.steampowered.com/IPlayerService/${method}/v0001/`);
  url.searchParams.set("key", key);
  url.searchParams.set("format", "json");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Steam API ${method}: HTTP ${res.status}`);
  return res.json();
}

function parseRecentGamesFromXml(xml) {
  const blocks = xml.match(/<mostPlayedGame>[\s\S]*?<\/mostPlayedGame>/g) || [];
  return blocks.map((block) => {
    const link = extract(block, "gameLink");
    const appId = (link.match(/\/app\/(\d+)/) || [])[1] || "";
    return {
      appId,
      name: extract(block, "gameName"),
      storeUrl: appId
        ? `https://store.steampowered.com/app/${appId}/`
        : link,
      capsule: extract(block, "gameLogo"),
      hoursTwoWeeks: toNumber(extract(block, "hoursPlayed")),
      hoursTotal: toNumber(extract(block, "hoursOnRecord")),
    };
  });
}

async function fetchRecentGames(steamId, xml) {
  if (steamId && getSteamApiKey()) {
    try {
      const body = await steamApiGet("GetRecentlyPlayedGames", {
        steamid: steamId,
        count: 0,
      });
      const games = body?.response?.games;
      if (Array.isArray(games) && games.length > 0) {
        return games
          .filter((g) => g.playtime_2weeks > 0)
          .sort((a, b) => b.playtime_2weeks - a.playtime_2weeks)
          .map((g) => ({
            appId: String(g.appid),
            name: g.name || "Unknown",
            storeUrl: `https://store.steampowered.com/app/${g.appid}/`,
            capsule: capsuleUrl(g.appid),
            hoursTwoWeeks: minutesToHours(g.playtime_2weeks),
            hoursTotal: minutesToHours(g.playtime_forever),
          }));
      }
      console.warn("GetRecentlyPlayedGames returned no games, falling back to profile XML");
    } catch (e) {
      console.warn("GetRecentlyPlayedGames failed, falling back to profile XML:", e.message);
    }
  }

  const games = parseRecentGamesFromXml(xml);
  if (games.length > 0 && games.length <= 6) {
    console.warn(
      `Profile XML returned ${games.length} recent games (Steam caps this feed at 6). Set STEAM_API_KEY for the full list.`
    );
  }
  return games;
}

async function fetchTopGames(steamId) {
  const body = await steamApiGet("GetOwnedGames", {
    steamid: steamId,
    include_appinfo: 1,
    include_played_free_games: 1,
  });
  if (!body) return [];

  const games = body?.response?.games;
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error("GetOwnedGames returned no games (check API key and game details privacy)");
  }

  return games
    .filter((g) => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 12)
    .map((g) => ({
      appId: String(g.appid),
      name: g.name || "Unknown",
      storeUrl: `https://store.steampowered.com/app/${g.appid}/`,
      capsule: capsuleUrl(g.appid),
      hoursTotal: minutesToHours(g.playtime_forever),
    }));
}

function parseFeatured(html) {
  const block =
    (html.match(
      /<div class="showcase_gamecollector_games[\s\S]*?clear: left;/
    ) || [])[0] || "";
  const re =
    /showcase_gamecollector_game[^"]*">\s*<a href="https:\/\/steamcommunity\.com\/app\/(\d+)">\s*<img[^>]*src="([^"]+)"/g;
  const games = [];
  let m;
  while ((m = re.exec(block))) {
    const appId = m[1];
    games.push({
      appId,
      storeUrl: `https://store.steampowered.com/app/${appId}/`,
      capsule: m[2],
    });
  }
  return games;
}

async function main() {
  const xmlRes = await fetch(XML_URL, { headers: { "User-Agent": UA } });
  if (!xmlRes.ok) throw new Error(`Failed to fetch Steam XML: HTTP ${xmlRes.status}`);
  const xml = await xmlRes.text();
  const steamId = parseSteamId(xml);

  const games = await fetchRecentGames(steamId, xml);

  if (games.length === 0) {
    throw new Error("No recent games found (check API key or profile privacy)");
  }

  let featured = [];
  try {
    const htmlRes = await fetch(HTML_URL, { headers: { "User-Agent": UA } });
    if (htmlRes.ok) featured = parseFeatured(await htmlRes.text());
  } catch (e) {
    console.warn("Could not fetch Featured Games:", e.message);
  }

  let topGames = [];
  if (steamId && getSteamApiKey()) {
    topGames = await fetchTopGames(steamId);
  }

  const data = {
    updatedAt: new Date().toISOString(),
    profileUrl: `${PROFILE_URL}/`,
    featured,
    games,
    topGames,
  };

  const json = JSON.stringify(data, null, 2) + "\n";
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, json);
  fs.writeFileSync(LEGACY_OUTPUT, json);
  console.log(
    `Wrote ${games.length} recent, ${topGames.length} top, ${featured.length} featured to public/steam.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
