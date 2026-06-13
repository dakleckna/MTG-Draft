# Draftsim Limited Review Viewer

Static GitHub-Pages app for viewing Draftsim Limited set reviews with Scryfall card images.

## What it does

- You select a draft from a dropdown.
- The app loads the matching Draftsim Limited set review.
- It extracts card names, Draftsim ratings and review text.
- It loads card images, color identity and metadata from Scryfall.
- It groups cards by the Limited archetypes / MTG color combinations for that draft.
- It sorts each group by rating descending.
- It uses subtle background colors per archetype / color combo.
- It exports the processed data as JSON.

## GitHub Pages setup

1. Create a new GitHub repository.
2. Upload all files from this folder to the repository root.
3. Go to **Settings -> Pages**.
4. Choose either:
   - **Deploy from a branch**: `main` / `/ root`, or
   - **GitHub Actions**, using the included workflow in `.github/workflows/pages.yml`.
5. Open the generated GitHub Pages URL.

## Draft selection

The draft dropdown is controlled in `app.js` by `DRAFT_CATALOG`.

Example:

```js
{
  title: "Secrets of Strixhaven",
  set: "sos",
  url: "https://draftsim.com/mtg-sos-limited-set-review/",
  preset: "sos",
  note: "Schulen/Farbpaare"
}
```

To add another Draftsim review later, add one object to `DRAFT_CATALOG` with the Draftsim URL and Scryfall set code.

## Archetype grouping

The app now supports three layers:

1. **Auto-detection from Draftsim**  
   If the article contains a section like “Draft Archetypes” with lines such as `Orzhov (White/Black): Ninjas/Sneak`, the app turns those into groups automatically.

2. **Set presets**  
   Some sets can have custom presets in `ARCHETYPE_PRESETS`, for example `sos` and `tmt`.

3. **Generic fallback**  
   If no archetypes are detected and no preset exists, the app uses the ten normal two-color MTG pairs: Azorius, Dimir, Rakdos, Gruul, Selesnya, Orzhov, Izzet, Golgari, Boros and Simic.

Each archetype has this shape:

```json
{
  "key": "WB",
  "label": "Silverquill - Weiss-Schwarz",
  "colors": ["W", "B"],
  "words": ["silverquill", "inkling", "magecraft"]
}
```

The app assigns cards using:

1. Draftsim text keywords.
2. Scryfall color identity, especially for multicolor cards.
3. Fallback groups for mono-colored cards, artifacts, lands and unclear cards.

## CORS / Proxy note

GitHub Pages is static. Draftsim may block direct browser requests through CORS. The UI includes a proxy field and an HTML fallback field. For a public long-term site, use your own lightweight proxy instead of relying on a public CORS proxy.
