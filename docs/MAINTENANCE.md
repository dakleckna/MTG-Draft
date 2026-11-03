# Betrieb und Datenquellen

## Cubes von CubeCobra

Oben neben dem Logo zwischen **Draft** und **Cube** wechseln. Im Cube-Modus
erscheint statt der Setliste ein Suchfeld mit Vorschlägen bei jedem Buchstaben.
Gesucht wird nach Name, Besitzer und Cube-ID; Pfeiltasten/Enter oder ein Klick
wählen den Cube aus. Anschließend auf **Laden** klicken. Ein CubeCobra-Link oder
eine Cube-ID kann auch ohne Katalogtreffer direkt geladen werden.

Der Suchkatalog stammt aus dem offiziellen öffentlichen CubeCobra-Gesamtexport
und wird im kostenlosen Wochenlauf aktualisiert (`node scripts/update-cubes.mjs`).
Es ist der Stand des CubeCobra-Exports, keine Live-Suche auf deren Website.
`cubes.json` enthält nur öffentliche Suchmetadaten; `cubes.json.gz` ist die
komprimierte Browserfassung. Ein Web Worker durchsucht den Katalog im Hintergrund.
Die große Exportdatei und Benutzer-Followerlisten werden nicht gespeichert.

Der ausgewählte Cube wird direkt über CubeCobras öffentliche CORS-API geladen.
Angezeigt werden die Hauptdeckkarten mit Bildern und Kartentexten aus CubeCobra,
nach Farben und anschließend CubeCobra-Elo sortiert. Elo ist eine übergreifende
CubeCobra-Bewertung, keine Winrate des gewählten Cubes. Für Cubes werden keine
Draftsim-, Untapped- oder 17Lands-Daten herangezogen. Private Cubes benötigen
weiterhin eine Berechtigung auf CubeCobra und können hier nicht geladen werden.

[Website öffnen](https://dakleckna.github.io/MTG-Draft/)

Die Farbkombinationen unter dem Ladebereich sind anklickbar. Die Kartenübersicht
zeigt bis zu 20 häufige Hauptdeckkarten aus den freigegebenen
[17Lands-Spieldatensätzen](https://www.17lands.com/public_datasets)
([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), mit Kartenbildern von Scryfall. Untapped liefert die Meta-Reihenfolge
nach Beliebtheit; diese Prozentwerte sind Meta-Anteile, keine Winrates.
Die Karten werden nach Anzahl der Spiele mit der Karte im Hauptdeck sortiert;
Standardländer sind ausgenommen. Die Karten-Winrate zählt Siege in diesen
Spielen, nicht nur Spiele, in denen die Karte gezogen wurde. Mindestens 50 Spiele
pro Karte sind erforderlich. Der Filter verwendet die Hauptfarben des Decks
aus dem Datensatz; Splashes können enthalten sein. Datenumfang und Datenstand
stehen unten im Dialog. Es werden keine Trophy-Deck-Winrates hochgerechnet
und keine Spiele verschiedener Anbieter addiert.

Die Analyse lässt sich lokal mit `node scripts/update-card-stats.mjs` erneuern.
Optional können Setcodes folgen, z. B. `node scripts/update-card-stats.mjs fra hob`.
Unveränderte Datensätze werden wiederverwendet. Die Rohdaten werden gestreamt,
nicht im Repository abgelegt; `card-stats.json` enthält nur aggregierte Werte.
Einzelne strukturell ungültige CSV-Zeilen werden ausgelassen und als
`rejectedRows` protokolliert. Bei mehr als 100 oder 0,1 % ungültigen Zeilen
wird der Datensatz verworfen und ein vorhandener letzter Stand behalten.

## Aktualisierungen

Der Button **Neue Drafts suchen** lädt die aktuelle Liste aus `drafts.json`.
Ein GitHub-Workflow aktualisiert diese Datei montags um 06:17 UTC aus den
Draftsim-Reviews und den Setdaten von Scryfall. Er aktualisiert außerdem
`untapped-meta.json` mit den beliebtesten Farbkombinationen aus den öffentlichen
Premier-Draft-Tier-List-Daten von Untapped.gg. Er kann auf GitHub auch über
**Actions → Update draft reviews → Run workflow** sofort gestartet werden.

## Kostenlose Datenbank und Betrieb

Die Datenbank besteht aus versionierten JSON-Dateien im Repository:

| Datei | Inhalt |
| --- | --- |
| `drafts.json` | Verfügbare Sets und Review-Links |
| `untapped-meta.json` | Beliebteste Farbkombinationen und Quelldatum |
| `card-stats.json` | Vorberechnete Karten, Spiele, Siege, Winrates, Bilder und Quellen pro Set/Farbkombination |

Die Website lädt diese Dateien über GitHub Pages. Beim Öffnen der Kartenübersicht
werden keine Spieldatensätze heruntergeladen und keine Statistiken berechnet.
Die Draftsim-Kartenreviews werden weiterhin beim Laden des Sets abgerufen.

Der Wochenlauf aktualisiert Sets, Meta und Kartendaten, prüft die Datenbank,
committet die Ergebnisse und fordert einen Pages-Build an. Er verwendet nur
den automatisch bereitgestellten `GITHUB_TOKEN`; keine API-Schlüssel,
SQL-Server, Abos oder externen Datenbankdienste sind nötig.
Bei Abruffehlern bleibt der letzte gültige Karten-Datenstand erhalten. Bei einer
fehlgeschlagenen Gesamtprüfung werden keine neuen Dateien gepusht.
Die Actions-Zusammenfassung zeigt die Datenstände und Spielzahlen pro Set.

Der Workflow läuft absichtlich nur in einem **öffentlichen Repository** auf einem
Standard-Runner (`ubuntu-latest`). Dafür sind GitHub Actions und GitHub Pages mit
GitHub Free kostenlos. Wird das Repo privat gemacht, wird der Datenjob übersprungen.
Es werden keine kostenpflichtigen Runner, Cloud-Datenbanken, Actions-Caches oder
zusätzlichen Speicher-Abos eingerichtet.

GitHub Pages muss wie bisher aus `main` und `/` veröffentlicht werden.
Bot-Commits starten nicht automatisch den normalen Pages-Build; deshalb fordert
der Workflow ihn ausdrücklich über die GitHub-API an.
Die Veröffentlichung akzeptiert auch erfolgreiche Antworten ohne JSON-Inhalt,
wiederholt vorübergehende API-Fehler und wartet auf den erfolgreichen Pages-Build
des tatsächlich gespeicherten Commits. Sie wird auch ohne neue Datenänderung
ausgeführt, damit ein erneuter Workflow-Lauf eine fehlgeschlagene Veröffentlichung repariert.
Der wöchentliche Zeitplan
läuft auf dem Standardbranch. GitHub kann geplante Läufe verzögern und bei längerer
Repository-Inaktivität deaktivieren; unter Actions lässt sich der Workflow wieder aktivieren.

Lokale Prüfung ohne Netzwerk und ohne Datenänderung:

```sh
node scripts/validate-data.mjs
node --test scripts/game-card-stats.test.mjs scripts/publish-pages.test.mjs
```

Eine neue Datenquelle kann als weiterer Importer unter `scripts/` ergänzt werden.
Das Frontend braucht nur die fertigen JSON-Daten. Quellen mit möglicherweise
überlappenden Spielen dürfen nicht ungeprüft zu einer Winrate zusammengezählt werden.
