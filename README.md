# Draft Reviewer

Checks for drafts

## Aktualisierungen

Der Button **Neue Drafts suchen** lädt die aktuelle Liste aus `drafts.json`.
Ein GitHub-Workflow aktualisiert diese Datei täglich um 06:17 UTC aus den
Draftsim-Reviews und den Setdaten von Scryfall. Er aktualisiert außerdem
`untapped-meta.json` mit den beliebtesten Farbkombinationen aus den öffentlichen
Premier-Draft-Tier-List-Daten von Untapped.gg. Er kann auf GitHub auch über
**Actions → Update draft reviews → Run workflow** sofort gestartet werden.
