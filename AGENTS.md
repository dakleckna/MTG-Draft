# Repository guidance

This is a static GitHub Pages site. Keep hosting and automated data updates free.
Do not introduce paid services, a backend requirement, secrets, or a SQL server.
Keep README.md concise. Technical documentation belongs in docs/MAINTENANCE.md.

## Prepared data

- `drafts.json`: set catalog.
- `untapped-meta.json`: archetype popularity, not winrate.
- `card-stats.json`: precomputed 17Lands mainboard-included winrates and popularity.
- `cubes.json` and `cubes.json.gz`: public CubeCobra discovery index. Build via
  `scripts/update-cubes.mjs`; never commit the large raw export or follower lists.
  Cube suggestions are snapshot-based and searched in `cube-search-worker.js`.
  A selected cube may be loaded live from CubeCobra's CORS-enabled cubeJSON API.
  Cube cards use only CubeCobra data and Elo, never fabricated draft winrates.
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
