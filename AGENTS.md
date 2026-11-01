# Repository guidance

This is a static GitHub Pages site. Keep hosting and automated data updates free.
Do not introduce paid services, a backend requirement, secrets, or a SQL server.

## Prepared data

- `drafts.json`: set catalog.
- `untapped-meta.json`: archetype popularity, not winrate.
- `card-stats.json`: precomputed 17Lands mainboard-included winrates and popularity.
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
