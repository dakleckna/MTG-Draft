import { readFile, writeFile, rename } from "node:fs/promises";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { recordGame, topCards } from "./game-card-stats.mjs";

// Only CC BY 4.0 public datasets, never the website's restricted statistics API.
const root = new URL("../", import.meta.url);
const meta = JSON.parse(await readFile(new URL("untapped-meta.json", root), "utf8"));
let previous = { drafts: {} };
try { previous = JSON.parse(await readFile(new URL("card-stats.json", root), "utf8")); } catch {}
const wanted = process.argv.slice(2).map(s => s.toLowerCase());

export function csv(line) {
  const fields = []; let field = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { fields.push(field); field = ""; }
    else field += c;
  }
  fields.push(field.replace(/\r$/, ""));
  return fields;
}

const colorId = value => [...value.toUpperCase()].reduce((id, color) => id | ({ W: 1, U: 2, B: 4, R: 8, G: 16 }[color] || 0), 0);
const isBasic = name => /^(Plains|Island|Swamp|Mountain|Forest|Wastes|Snow-Covered .+)$/.test(name);

async function* download(url, response) {
  let offset = 0;
  const etag = response.headers.get("etag");
  for (let attempt = 0; ; attempt++) {
    try {
      for await (const chunk of response.body) { offset += chunk.length; yield chunk; }
      return;
    } catch (error) {
      if (attempt >= 3) throw error;
      console.warn(`Resuming dataset at compressed byte ${offset}`);
      response = await fetch(url, {
        headers: { Range: `bytes=${offset}-`, ...(etag ? { "If-Range": etag } : {}) },
        signal: AbortSignal.timeout(300000)
      });
      if (response.status !== 206 || !response.headers.get("content-range")?.startsWith(`bytes ${offset}-`)) {
        await response.body?.cancel();
        throw new Error("Dataset download could not be resumed safely");
      }
    }
  }
}

async function build(draftUrl, info) {
  const code = draftUrl.match(/mtg-([a-z0-9]+)-/)[1].toUpperCase();
  const sourceUrl = `https://17lands-public.s3.amazonaws.com/analysis_data/game_data/game_data_public.${code}.PremierDraft.csv.gz`;
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(300000) });
  if (!response.ok) throw new Error(`dataset ${response.status}`);
  const old = previous.drafts[draftUrl];
  if (old?.sourceModifiedAt === response.headers.get("last-modified") &&
      info.archetypes.every(a => old.archetypes.some(b => a.id === b.id))) {
    await response.body.cancel();
    console.log(`${code}: dataset unchanged`);
    return old;
  }
  const source = Readable.from(download(sourceUrl, response));
  const unzip = source.pipe(createGunzip());
  source.on("error", error => unzip.destroy(error));
  const lines = createInterface({ input: unzip, crlfDelay: Infinity });
  const groups = new Map(info.archetypes.map(a => [a.id, { name: a.name, games: 0, wins: 0, cards: new Map() }]));
  let columns, indexes, colorsIndex, wonIndex;
  let rejectedRows = 0, totalRows = 0;
  try {
    for await (const line of lines) {
      if (!columns) {
        columns = csv(line);
        colorsIndex = columns.indexOf("main_colors");
        wonIndex = columns.indexOf("won");
        indexes = columns.map((name, index) => name.startsWith("deck_") && !isBasic(name.slice(5)) ? [name.slice(5), index] : null).filter(Boolean);
        if (colorsIndex < 0 || wonIndex < 0 || !indexes.length) throw new Error("Unsupported dataset schema");
        continue;
      }
      if (!line.trim()) continue;
      totalRows++;
      const values = line.includes('"') ? csv(line) : line.split(",");
      if (values.length !== columns.length) {
        if (++rejectedRows > 100) throw new Error("Too many malformed CSV rows");
        continue;
      }
      const group = groups.get(colorId(values[colorsIndex]));
      if (!group) continue;
      const outcome = values[wonIndex].toLowerCase();
      if (!["true", "false", "1", "0"].includes(outcome)) throw new Error("Invalid outcome");
      const won = outcome === "true" || outcome === "1";
      recordGame(group, values, indexes, won);
    }
  } finally { lines.close(); source.destroy(); unzip.destroy(); }
  if (rejectedRows / totalRows > 0.001) throw new Error("Dataset has too many malformed rows");
  if (rejectedRows) console.warn(`${code}: excluded ${rejectedRows} malformed rows of ${totalRows}`);
  const archetypes = [...groups].map(([id, group]) => ({
    id, name: group.name, games: group.games, wins: group.wins,
    topCards: topCards(group)
  }));
  console.log(`${code}: ${archetypes.map(a => `${a.name} ${a.games} games`).join(", ")}`);
  return { source: "17Lands", sourceUrl, sourceModifiedAt: response.headers.get("last-modified"),
    updatedAt: new Date().toISOString(), license: "CC BY 4.0", metric: "deck-included win rate", rejectedRows, archetypes };
}

for (const [draftUrl, info] of Object.entries(meta.drafts)) {
  if (wanted.includes("--images-only")) break;
  const code = draftUrl.match(/mtg-([a-z0-9]+)-/)[1];
  if (wanted.length && !wanted.includes(code)) continue;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { previous.drafts[draftUrl] = await build(draftUrl, info); break; }
    catch (error) {
      console.warn(`${code}: ${error.message}${attempt === 0 ? "; retrying" : "; keeping previous data"}`);
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

const cards = Object.values(previous.drafts).flatMap(info => info.archetypes.flatMap(a => a.topCards));
const names = [...new Set(cards.filter(c => !c.image).map(c => c.name))];
const art = new Map();
for (let i = 0; i < names.length; i += 75) {
  const response = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "MTG-Draft/1.0" },
    body: JSON.stringify({ identifiers: names.slice(i, i + 75).map(name => ({ name: name.split(" // ")[0] })) }), signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Scryfall ${response.status}`);
  for (const c of (await response.json()).data || []) {
    const entry = { image: (c.image_uris || c.card_faces?.[0]?.image_uris)?.normal, url: c.scryfall_uri };
    art.set(c.name, entry);
    for (const face of c.card_faces || []) art.set(face.name, entry);
  }
  await new Promise(resolve => setTimeout(resolve, 120));
}
for (const card of cards) Object.assign(card, art.get(card.name) || {});
const pending = new URL("card-stats.pending.json", root);
await writeFile(pending, JSON.stringify({ ...previous, generatedAt: new Date().toISOString() }, null, 2) + "\n");
await rename(pending, new URL("card-stats.json", root));
console.log(`Saved card statistics for ${Object.keys(previous.drafts).length} sets (${cards.length} ranked card entries).`);
