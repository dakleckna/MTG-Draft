import { readFile, writeFile } from "node:fs/promises";

const DRAFTS_PATH = new URL("../drafts.json", import.meta.url);
const META_PATH = new URL("../untapped-meta.json", import.meta.url);
const UNTAPPED_BASE_URL = "https://mtga.untapped.gg/limited/draft";
const SLUG_OVERRIDES = new Map([
  ["Lost Caverns of Ixalan", "the-lost-caverns-of-ixalan"]
]);
const COLOR_COMBINATIONS = [
  { id: 1, name: "Mono White" },
  { id: 2, name: "Mono Blue" },
  { id: 4, name: "Mono Black" },
  { id: 8, name: "Mono Red" },
  { id: 16, name: "Mono Green" },
  { id: 3, name: "Azorius" },
  { id: 5, name: "Orzhov" },
  { id: 6, name: "Dimir" },
  { id: 9, name: "Boros" },
  { id: 10, name: "Izzet" },
  { id: 12, name: "Rakdos" },
  { id: 17, name: "Selesnya" },
  { id: 18, name: "Simic" },
  { id: 20, name: "Golgari" },
  { id: 24, name: "Gruul" },
  { id: 7, name: "Esper" },
  { id: 11, name: "Jeskai" },
  { id: 13, name: "Mardu" },
  { id: 14, name: "Grixis" },
  { id: 19, name: "Bant" },
  { id: 21, name: "Abzan" },
  { id: 22, name: "Sultai" },
  { id: 25, name: "Naya" },
  { id: 26, name: "Jund" },
  { id: 28, name: "Temur" }
];

function untappedSlug(title) {
  return SLUG_OVERRIDES.get(title) || title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function sum(values) {
  return Object.values(values || {}).reduce((total, value) => total + Number(value || 0), 0);
}

function parseNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

  if (!match) {
    throw new Error("Untapped page data not found.");
  }

  return JSON.parse(match[1]);
}

function extractMeta(html, draft, sourceUrl) {
  const pageData = parseNextData(html);
  const data = pageData.props?.pageProps?.ssrProps?.limitedSetInfo?.data;
  const combinations = data?.color_combinations_data;

  if (!combinations || typeof combinations !== "object") {
    throw new Error("Untapped color combination data not found.");
  }

  const archetypes = COLOR_COMBINATIONS
    .map(({ id, name }) => {
      const combination = combinations[id];
      const popularity = sum(combination?.popularity_by_rank);

      return { name, popularity };
    })
    .filter(archetype => archetype.popularity > 0)
    .sort((left, right) => right.popularity - left.popularity)
    .slice(0, 5)
    .map(archetype => ({
      ...archetype,
      popularity: Number(archetype.popularity.toFixed(1))
    }));

  if (!archetypes.length) {
    throw new Error("Untapped returned no popular color combinations.");
  }

  const lastModified = Number(data.color_combinations_last_modified || data.last_modified);

  return {
    sourceUrl,
    updatedAt: Number.isFinite(lastModified)
      ? new Date(lastModified * 1000).toISOString()
      : new Date().toISOString(),
    archetypes
  };
}

async function fetchUntappedMeta(draft) {
  const sourceUrl = `${UNTAPPED_BASE_URL}/${untappedSlug(draft.title)}/tier-list`;
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "MTG-Draft meta updater"
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return extractMeta(await response.text(), draft, sourceUrl);
}

async function mapWithConcurrency(items, limit, task) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const drafts = JSON.parse(await readFile(DRAFTS_PATH, "utf8"));
let previousMeta = { drafts: {} };

try {
  previousMeta = JSON.parse(await readFile(META_PATH, "utf8"));
} catch {
  // The first successful run creates the manifest.
}

const entries = await mapWithConcurrency(drafts, 4, async draft => {
  try {
    const meta = await fetchUntappedMeta(draft);
    console.log(`Updated Untapped meta: ${draft.title}`);
    return [draft.url, meta];
  } catch (error) {
    const previous = previousMeta.drafts?.[draft.url];
    console.warn(`Untapped meta unavailable for ${draft.title}: ${error.message}`);
    return previous ? [draft.url, previous] : null;
  }
});

const manifest = {
  generatedAt: new Date().toISOString(),
  drafts: Object.fromEntries(entries.filter(Boolean))
};

await writeFile(META_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Saved Untapped meta for ${Object.keys(manifest.drafts).length} drafts.`);
