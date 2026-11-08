import SetCatalog from "../set-catalog.js";

export function xmlLocations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(match => match[1].trim().replaceAll("&amp;", "&"));
}
export const reviewCode = url => url.match(/\/mtg-([a-z0-9-]+)-limited-set-review\//i)?.[1]?.toLowerCase();

export function reviewDetails(html) {
  const decode = value => value.replace(/&amp;/g, "&").replace(/&#0*39;|&#x27;|&apos;/gi, "'")
    .replace(/&quot;/g, '"').replace(/&#(?:8217|x2019);/gi, "’");
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  const title = decode(heading.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ")
    .replace(/^(?:The\s+)?Ultimate\s+(?:MTG\s+)?|^MTG\s+/i, "")
    .replace(/\s+Limited Set Review\b.*$/i, "").trim();
  if (!/Limited Set Review/i.test(heading) || !title) throw new Error("Review has no usable set title");
  return { title, publishedAt: html.match(/property=["']article:published_time["']\s+content=["']([^"']+)/i)?.[1]?.slice(0, 10) || "" };
}

export function buildCatalog({ current, reviews, sets, details = new Map() }) {
  const old = new Map(current.filter(d => SetCatalog.normalize(d)).map(d => [d.url, d]));
  const byCode = new Map(sets.map(set => [set.code.toLowerCase(), set]));
  const normalizeName = name => name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const byName = new Map(sets.map(set => [normalizeName(set.name), set]));
  const entries = new Map();
  for (const url of new Set([...reviews, ...old.keys()])) {
    if (!SetCatalog.isReviewUrl(url)) continue;
    const code = reviewCode(url);
    const set = byCode.get(code) || byName.get(normalizeName(code));
    const info = details.get(url);
    const previous = old.get(url);
    const title = previous?.title || set?.name || info?.title;
    if (!title) continue;
    // A published review is useful during prerelease. Do not gate it on paper
    // release dates or on Scryfall already listing the new set.
    entries.set(url, { title, url, archetypeHint: code === "sos" ? "sos" : "generic",
      sortDate: set?.released_at || info?.publishedAt || "" });
  }
  return [...entries.values()].sort((a, b) => b.sortDate.localeCompare(a.sortDate) || a.title.localeCompare(b.title))
    .map(({ sortDate, ...draft }) => draft);
}

export async function discoverCatalog(current, fetchImpl = fetch) {
  const get = async url => {
    const r = await fetchImpl(url, { headers: { Accept: "application/xml, application/json, text/html;q=0.9, */*;q=0.8",
      "User-Agent": "MTG-Draft manifest updater" }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`${url} returned HTTP ${r.status}`);
    return r;
  };
  const root = await (await get("https://draftsim.com/wp-sitemap.xml")).text();
  const sitemaps = xmlLocations(root).filter(url => /^https:\/\/draftsim\.com\/(?:post-sitemap\d*|wp-sitemap-posts-post-\d+)\.xml$/i.test(url));
  if (!sitemaps.length) throw new Error("Draftsim returned no post sitemaps; preserving current catalog");
  const pages = await Promise.all(sitemaps.map(async url => (await get(url)).text()));
  const reviews = [...new Set(pages.flatMap(xmlLocations))].filter(SetCatalog.isReviewUrl);
  if (!reviews.length) throw new Error("Draftsim returned no reviews; preserving current catalog");
  let sets;
  try {
    const response = await (await get("https://api.scryfall.com/sets")).json();
    if (!Array.isArray(response.data)) throw new Error("Invalid Scryfall set catalog");
    sets = response.data;
  } catch (error) {
    console.warn(`::warning::Scryfall unavailable; using review metadata: ${error.message}`);
    sets = [];
  }
  const known = new Set(current.map(d => d.url));
  const codes = new Set(sets.map(s => s.code.toLowerCase()));
  const details = new Map();
  for (const url of reviews.filter(url => !known.has(url) && !codes.has(reviewCode(url)))) {
    try { details.set(url, reviewDetails(await (await get(url)).text())); }
    catch (error) { console.warn(`::warning::Cannot resolve review ${url}: ${error.message}`); }
  }
  return buildCatalog({ current, reviews, sets, details });
}
