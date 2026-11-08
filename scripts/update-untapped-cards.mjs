import { readFile, writeFile, rename } from "node:fs/promises";
import { analyzeUntappedCards } from "./untapped-card-stats.mjs";

const root = new URL("../", import.meta.url);
const meta = JSON.parse(await readFile(new URL("untapped-meta.json", root), "utf8"));
const stats = JSON.parse(await readFile(new URL("card-stats.json", root), "utf8"));
const wanted = process.argv.slice(2).filter(s => !s.startsWith("--")).map(s => s.toLowerCase());
const art = new Map(Object.values(stats.drafts).flatMap(s => s.archetypes.flatMap(a => a.topCards))
  .filter(c => c.image && c.url).map(c => [c.name, { image: c.image, url: c.url }]));
const get = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: { Accept: "application/json,text/html", "User-Agent": "MTG-Draft card updater", ...options.headers }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response;
};
let changed = false;
for (const [reviewUrl, info] of Object.entries(meta.drafts)) {
  const code = reviewUrl.match(/mtg-([a-z0-9-]+)-limited-set-review/)[1];
  if (wanted.length && !wanted.includes(code)) continue;
  // Existing 17Lands entries keep their metric and remain on the weekly importer.
  if (stats.drafts[reviewUrl] && stats.drafts[reviewUrl].source !== "Untapped.gg") continue;
  try {
    const sourceUrl = info.sourceUrl.replace(/\/tier-list$/, "/card-data");
    const html = await (await get(sourceUrl)).text();
    const page = JSON.parse(html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1] || "null");
    const ssr = page?.props?.pageProps?.ssrProps;
    const endpoint = ssr?.limitedCardStatsRespUrl;
    // Use only the same public /free endpoint requested by Untapped's client.
    // SSR intentionally omits color splits and wins; it cannot supply these stats.
    if (typeof endpoint !== "string" || !/^\/analytics\/query\/card_stats_limited_by_set_v2\/free\?/.test(endpoint)) throw new Error("No public Untapped card endpoint");
    const query = new URL(endpoint, "https://api.mtga.untapped.gg");
    if (query.searchParams.get("CardSetFilter") !== code.toUpperCase() || query.searchParams.get("LimitedEventTypeFilter") !== "PREMIER_DRAFT") throw new Error("Unexpected Untapped set or event");
    const response = await get(`https://api.mtga.untapped.gg/api/v1${endpoint}`);
    const archetypes = analyzeUntappedCards(await response.json(), new Map(ssr.minifiedMtgaJsonData.localeData), info.archetypes);
    const names = [...new Set(archetypes.flatMap(a => a.topCards).filter(c => !art.has(c.name)).map(c => c.name))];
    for (let i = 0; i < names.length; i += 75) {
      const result = await get("https://api.scryfall.com/cards/collection", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers: names.slice(i, i + 75).map(name => ({ name: name.split(" // ")[0] })) }) });
      for (const card of (await result.json()).data || []) {
        const image = (card.image_uris || card.card_faces?.[0]?.image_uris)?.normal;
        if (!image) continue;
        const entry = { image, url: card.scryfall_uri };
        art.set(card.name, entry);
        for (const face of card.card_faces || []) art.set(face.name, entry);
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    for (const a of archetypes) for (const card of a.topCards) {
      if (!art.has(card.name)) throw new Error(`Missing card image: ${card.name}`);
      Object.assign(card, art.get(card.name));
    }
    if (!archetypes.some(a => a.topCards.length)) throw new Error("No cards with at least 50 games yet");
    stats.drafts[reviewUrl] = { source: "Untapped.gg", sourceUrl, updatedAt: new Date().toISOString(),
      sourceModifiedAt: response.headers.get("last-modified"),
      metric: "included win rate (main deck or sideboard)", archetypes };
    changed = true;
    console.log(`${code.toUpperCase()}: ${archetypes.map(a => `${a.name}: ${a.topCards.length} cards / ${a.games} games`).join(", ")}`);
  } catch (error) { console.warn(`::warning::Untapped cards ${code}: ${error.message}; keeping previous data`); }
}
if (changed) {
  const pending = new URL("card-stats.pending.json", root);
  await writeFile(pending, JSON.stringify({ ...stats, generatedAt: new Date().toISOString() }, null, 2) + "\n");
  await rename(pending, new URL("card-stats.json", root));
}
