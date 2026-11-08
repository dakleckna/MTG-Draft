# Repository guidance

This is a static GitHub Pages site. Keep hosting and automated data updates free.
Do not introduce paid services, a backend requirement, secrets, or a SQL server.
Do not edit README.md unless the user explicitly requests a README change.
Technical documentation belongs in docs/MAINTENANCE.md.
Keep changes local; do not push unless the user explicitly approves the push.

## Prepared data

- `drafts.json`: set catalog.
  Include published Draftsim reviews immediately, including prerelease sets;
  never filter by paper release date. Scryfall metadata must not gate discovery.
  Browser startup and the refresh button read the prepared catalog without cache.
  The lightweight update-sets.yml refreshes it every six hours independently of
  weekly bulk statistics. It must also refresh and publish untapped-meta.json so
  new sets get their color meta immediately when Untapped provides it.
  Preserve existing entries on sitemap omissions/errors.
- `untapped-meta.json`: archetype popularity, not winrate.
- `card-stats.json`: precomputed 17Lands mainboard-included winrates and popularity.
  For sets without 17Lands data, update-untapped-cards.mjs uses Untapped's public
  /free card endpoint (never premium/authenticated routes), with actual color
  splits and Included WR (main deck OR sideboard). Never substitute ALL for a
  color combination. Keep sources/metrics explicit in footer and card tooltip.
  Refresh these fallback entries every six hours alongside the meta. Preserve
  existing 17Lands entries; the weekly 17Lands importer can replace fallbacks.
- `cubes.json` and `cubes.json.gz`: public CubeCobra discovery index. Build via
  `scripts/update-cubes.mjs`; never commit the large raw export or follower lists.
  Limit the catalog to the top 50 by public follower count (ties: name, ID).
  Only these cubes may be selected/loaded, including direct URL/ID input.
  Cube suggestions are snapshot-based and searched in `cube-search-worker.js`.
  A selected cube may be loaded live from CubeCobra's CORS-enabled cubeJSON API.
  Cube cards use only CubeCobra data and Elo, never fabricated draft winrates.
  Cube meta statistics must use recorded match/game outcomes, never Elo.
  Aggregate public Records offline with cube-records.js; the prepared cache is
  cube-record-stats.json and includes only catalog IDs. Never persist raw player
  data. Browser record reads use this file only; no Records API/proxy fallback.
  Cloudflare Workers are a future idea only, not part of the current architecture.
  No inferred deck ideas, primer-based recommendations or generated card tips.
  The lower cube card list shows Elo only, without review text. Without records
  hide the meta/suggestions. With records retain the five most-played colors;
  select their top 20 cards by winrate (50+ games; ties: games, then name),
  ranking all eligible cards before truncation. Use the same dialog as MTG Set.
- Importers are under `scripts/`. The browser consumes JSON; never move bulk
  dataset downloads or statistical aggregation into browser code.
- Preserve source URLs, snapshot dates, metric definitions, licenses, and minimum
  50 games per card. Do not add overlapping sources' game counts together.
- Use only the licensed 17Lands public datasets, not their restricted website API.
- Prefer targeted set updates (`node scripts/update-card-stats.mjs fra hob`).
  The full import can download large files; don't run it for UI-only changes.
- Validate with `node scripts/validate-data.mjs` and
  `node --test scripts/game-card-stats.test.mjs` before publishing.
- Weekly updates live in `.github/workflows/update-drafts.yml`. Preserve its
  public-repository cost guard, standard runner, validation and explicit Pages build.

## UI

Maintain the light neutral styling. Keep the card dialog concise: archetype title,
card images/names/winrates and a compact source footer. Include accessible labels.
When changing app.js or styles.css, update the version query in index.html.
