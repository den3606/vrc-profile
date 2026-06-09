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

  const blocks = xml.match(/<mostPlayedGame>[\s\S]*?<\/mostPlayedGame>/g) || [];
  const games = blocks.map((block) => {
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

  if (games.length === 0) {
    throw new Error("No games parsed from Steam XML (profile private or markup changed)");
  }

  let featured = [];
  try {
    const htmlRes = await fetch(HTML_URL, { headers: { "User-Agent": UA } });
    if (htmlRes.ok) featured = parseFeatured(await htmlRes.text());
  } catch (e) {
    console.warn("Could not fetch Featured Games:", e.message);
  }

  const data = {
    updatedAt: new Date().toISOString(),
    profileUrl: `${PROFILE_URL}/`,
    featured,
    games,
  };

  const json = JSON.stringify(data, null, 2) + "\n";
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, json);
  fs.writeFileSync(LEGACY_OUTPUT, json);
  console.log(`Wrote ${games.length} games, ${featured.length} featured to public/steam.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
