import { readFile, writeFile } from "node:fs/promises";

const DRAFTS_PATH = new URL("../drafts.json", import.meta.url);
const DRAFTSIM_SITEMAP_URL = "https://draftsim.com/wp-sitemap.xml";
const SCRYFALL_SETS_URL = "https://api.scryfall.com/sets";
const FETCH_OPTIONS = {
  headers: {
    Accept: "application/xml, application/json, text/plain;q=0.9, */*;q=0.8",
    "User-Agent": "MTG-Draft manifest updater"
  }
};

async function fetchText(url) {
  const response = await fetch(url, FETCH_OPTIONS);

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function xmlLocations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(match => match[1].trim());
}

function draftsimCode(url) {
  return url.match(/\/mtg-([a-z0-9-]+)-limited-set-review\//i)?.[1]?.toLowerCase();
}

const currentDrafts = JSON.parse(await readFile(DRAFTS_PATH, "utf8"));
const currentByUrl = new Map(currentDrafts.map(draft => [draft.url, draft]));
const rootSitemap = await fetchText(DRAFTSIM_SITEMAP_URL);
const postSitemapUrls = xmlLocations(rootSitemap)
  .filter(url => /^https:\/\/draftsim\.com\/post-sitemap\d*\.xml$/i.test(url));
const postSitemaps = await Promise.all(postSitemapUrls.map(fetchText));
const reviewUrls = [...new Set(postSitemaps.flatMap(xmlLocations))]
  .filter(url => /^https:\/\/draftsim\.com\/mtg-[a-z0-9-]+-limited-set-review\/$/i.test(url));

const setsResponse = await fetch(SCRYFALL_SETS_URL, FETCH_OPTIONS);

if (!setsResponse.ok) {
  throw new Error(`Scryfall returned ${setsResponse.status} ${setsResponse.statusText}`);
}

const sets = await setsResponse.json();
const setsByCode = new Map(sets.data.map(set => [set.code.toLowerCase(), set]));
const today = new Date().toISOString().slice(0, 10);

const updatedDrafts = reviewUrls
  .map(url => {
    const oldDraft = currentByUrl.get(url);
    const set = setsByCode.get(draftsimCode(url));

    if (!set || !set.released_at || set.released_at > today) {
      return oldDraft || null;
    }

    return {
      title: oldDraft?.title || set.name,
      url,
      archetypeHint: draftsimCode(url) === "sos" ? "sos" : "generic",
      releasedAt: set.released_at
    };
  })
  .filter(Boolean)
  .sort((left, right) => (right.releasedAt || "").localeCompare(left.releasedAt || ""))
  .map(({ releasedAt, ...draft }) => draft);

await writeFile(DRAFTS_PATH, `${JSON.stringify(updatedDrafts, null, 2)}\n`);
console.log(`Updated ${updatedDrafts.length} draft reviews.`);
