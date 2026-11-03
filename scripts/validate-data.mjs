import { readFile, appendFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import CubeData from "../cube-data.js";

const root = new URL("../", import.meta.url);
const read = async name => JSON.parse(await readFile(new URL(name, root), "utf8"));
const [drafts, meta, stats] = await Promise.all([read("drafts.json"), read("untapped-meta.json"), read("card-stats.json")]);
const cubeIndex = await read("cubes.json");
assert(cubeIndex.source === "CubeCobra" && cubeIndex.cubes?.length > 0, "Missing CubeCobra index");
assert(cubeIndex.cubes.length === 50 && cubeIndex.limit === 50 && cubeIndex.ranking === "followers", "Expected top-50 cube catalog");
assert.deepEqual(CubeData.topCubes(cubeIndex.cubes), cubeIndex.cubes, "Cube catalog is not ranked by follower count");
const cubeIds = new Set();
for (const cube of cubeIndex.cubes) {
  assert(/^[a-z\d_-]+$/i.test(cube.id) && typeof cube.name === "string" && cube.name.trim(), "Invalid cube index entry");
  assert(!cubeIds.has(cube.id), "Duplicate cube ID"); cubeIds.add(cube.id);
}
const compressedIndex = JSON.parse(gunzipSync(await readFile(new URL("cubes.json.gz", root))).toString("utf8"));
assert.deepEqual(compressedIndex, cubeIndex, "Compressed cube index does not match JSON index");
console.log(`Validated ${cubeIds.size} public CubeCobra search entries.`);
const cubeRecords = await read("cube-record-stats.json");
assert(cubeRecords.cubes && typeof cubeRecords.cubes === "object", "Missing CubeCobra record cache");
for (const [id, summary] of Object.entries(cubeRecords.cubes)) {
  assert(cubeIds.has(id) && summary.source === "CubeCobra", "Invalid or out-of-catalog cube statistics source");
  assert(summary.archetypes.length <= 5, "More than five cube archetypes");
  for (const a of summary.archetypes) {
    assert(a.decks > 0 && a.games > 0 && a.wins >= 0 && a.wins <= a.games, "Invalid cube outcomes");
    assert(Math.abs(a.winRate - 100 * a.wins / a.games) < 1e-6, "Invalid cube winrate");
    let previousGames = Infinity;
    const cardIds = new Set();
    assert(a.topCards.length <= 20, "More than 20 cube cards");
    for (const c of a.topCards) {
      assert(!cardIds.has(c.id), "Duplicate cube card"); cardIds.add(c.id);
      assert(c.games >= 50 && c.games <= a.games && c.games <= previousGames, "Invalid cube card frequency"); previousGames = c.games;
      assert(c.wins >= 0 && c.wins <= c.games && Math.abs(c.winRate - 100 * c.wins / c.games) < 1e-6, "Invalid cube card winrate");
    }
  }
}
console.log(`Validated recorded game summaries for ${Object.keys(cubeRecords.cubes).length} cubes.`);
assert(Array.isArray(drafts) && drafts.length > 0, "Draft list is empty");
const urls = new Set();
for (const draft of drafts) {
  assert(draft.title && /^https:\/\/draftsim\.com\/mtg-[a-z0-9-]+-limited-set-review\/$/.test(draft.url), "Invalid draft");
  assert(!urls.has(draft.url), "Duplicate draft URL"); urls.add(draft.url);
}
assert(meta.drafts && stats.drafts, "Missing database tables");
assert(Object.keys(stats.drafts).length > 0, "Card database is empty");
let cards = 0, games = 0;
const rows = [];
for (const [url, data] of Object.entries(meta.drafts)) {
  assert(urls.has(url), `Meta points to unknown draft: ${url}`);
  assert(data.archetypes?.length > 0, "Missing archetypes");
  for (const a of data.archetypes) assert(Number.isFinite(a.popularity) && a.popularity >= 0 && a.popularity <= 100, "Invalid popularity");
}
for (const [url, data] of Object.entries(stats.drafts)) {
  assert(urls.has(url), `Statistics point to unknown draft: ${url}`);
  assert(data.source === "17Lands" && data.license === "CC BY 4.0", "Missing source/license");
  assert(Number.isFinite(Date.parse(data.updatedAt)), "Missing update date");
  const ids = new Set();
  for (const a of data.archetypes) {
    assert(!ids.has(a.id), "Duplicate archetype"); ids.add(a.id);
    assert(Number.isInteger(a.games) && a.games >= 0 && a.wins >= 0 && a.wins <= a.games, "Invalid game totals");
    games += a.games;
    assert(a.topCards.length <= 20, "More than 20 cards");
    let last = Infinity; const names = new Set();
    for (const c of a.topCards) {
      assert(!names.has(c.name), "Duplicate card"); names.add(c.name);
      assert(c.games >= 50 && c.games <= a.games && c.games <= last, "Invalid sample or ranking"); last = c.games;
      assert(c.wins >= 0 && c.wins <= c.games && Math.abs(c.winRate - 100 * c.wins / c.games) < 1e-6, "Invalid winrate");
      assert(c.image?.startsWith("https://") && c.url?.startsWith("https://"), `Missing card image/link: ${c.name}`);
      cards++;
    }
  }
  rows.push(`| ${drafts.find(d => d.url === url).title.replaceAll("|", " ")} | ${data.archetypes.reduce((n, a) => n + a.games, 0).toLocaleString("en-US")} | ${data.sourceModifiedAt || data.updatedAt} |`);
}
const summary = `Validated ${drafts.length} drafts, ${Object.keys(stats.drafts).length} card datasets, ${cards} cards, ${games.toLocaleString("en-US")} player-games.`;
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
  `## Prepared database\n\n${summary}\n\n| Set | Player-games in shown archetypes | Source snapshot |\n| --- | ---: | --- |\n${rows.join("\n")}\n`);
