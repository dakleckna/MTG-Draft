import { test } from "node:test";
import assert from "node:assert/strict";
import SetCatalog from "../set-catalog.js";
import { buildCatalog, discoverCatalog, reviewDetails } from "./set-discovery.mjs";

const url = code => `https://draftsim.com/mtg-${code}-limited-set-review/`;
const old = { title: "The Hobbit", url: url("hob"), archetypeHint: "generic" };
const trek = { title: "Star Trek", url: url("trk"), archetypeHint: "generic" };
const sets = [{ code: "trk", name: "Star Trek", released_at: "2999-11-13" },
  { code: "hob", name: "The Hobbit", released_at: "2026-08-14" }];

test("published prerelease reviews are included even before paper release; no review means no set", () => {
  const result = buildCatalog({ current: [old], reviews: [url("trk"), old.url], sets: [...sets,
    { code: "zzz", name: "Unreviewed Future Set", released_at: "2999-12-01" }] });
  assert.deepEqual(result, [trek, old]);
});

test("missing Scryfall codes use the actual review title; older catalog entries survive sitemap omissions", () => {
  const details = reviewDetails('<h1>The Ultimate MTG Unknown &amp; New Limited Set Review</h1><meta property="article:published_time" content="2026-11-04T00:00:00Z">');
  const result = buildCatalog({ current: [old], reviews: [url("new-set")], sets: [], details: new Map([[url("new-set"), details]]) });
  assert.equal(result[0].title, "Unknown & New");
  assert.equal(result[1].url, old.url);
  assert.equal(reviewDetails("<h1>The Hobbit Limited Set Review</h1>").title, "The Hobbit");
  assert.throws(() => reviewDetails("<h1>Access denied</h1>"), /no usable/);
});

test("fresh devices and previously saved catalogs merge in published order without duplicates", () => {
  assert.deepEqual(SetCatalog.merge([trek, old], [old]), [trek, old]);
  assert.deepEqual(SetCatalog.merge([trek, old], [trek, old, old]), [trek, old]);
  assert.deepEqual(SetCatalog.merge([trek, { title: "bad", url: "https://evil.example/review" }], [old]), [trek, old]);
  const updated = SetCatalog.merge([{ ...trek, title: "Updated Star Trek" }, old], [trek, old]);
  assert.equal(updated[0].title, "Updated Star Trek");
});

test("discovery reads WordPress and Yoast post sitemaps and resolves new reviews", async () => {
  const replies = new Map([
    ["https://draftsim.com/wp-sitemap.xml", '<sitemapindex><loc>https://draftsim.com/post-sitemap.xml</loc><loc>https://draftsim.com/wp-sitemap-posts-post-2.xml</loc><loc>https://evil.example/sitemap.xml</loc></sitemapindex>'],
    ["https://draftsim.com/post-sitemap.xml", `<urlset><loc>${url("trk")}</loc></urlset>`],
    ["https://draftsim.com/wp-sitemap-posts-post-2.xml", `<urlset><loc>${url("new-set")}</loc><loc>https://draftsim.com/another-article/</loc></urlset>`],
    ["https://api.scryfall.com/sets", JSON.stringify({ data: sets })],
    [url("new-set"), '<h1>The Ultimate MTG New Set Limited Set Review</h1>']
  ]);
  const result = await discoverCatalog([old], async address => {
    assert.ok(replies.has(address), `Unexpected request: ${address}`);
    return new Response(replies.get(address));
  });
  assert.ok(result.some(d => d.title === "Star Trek"));
  assert.ok(result.some(d => d.title === "New Set"));
  assert.ok(result.some(d => d.url === old.url));
  await assert.rejects(() => discoverCatalog([old], async () => new Response("<html>Challenge</html>")), /no post sitemaps/);
});

test("Scryfall outages do not block a published new review", async () => {
  const fetchImpl = async address => {
    if (address.endsWith("wp-sitemap.xml")) return new Response('<loc>https://draftsim.com/post-sitemap.xml</loc>');
    if (address.endsWith("post-sitemap.xml")) return new Response(`<loc>${url("trk")}</loc>`);
    if (address.includes("scryfall.com")) return new Response("Unavailable", { status: 503 });
    if (address === url("trk")) return new Response('<h1>The Ultimate MTG Star Trek Limited Set Review</h1><meta property="article:published_time" content="2026-11-02">');
    throw new Error(`Unexpected request: ${address}`);
  };
  const result = await discoverCatalog([old], fetchImpl);
  assert.deepEqual(result, [trek, old]);
});
