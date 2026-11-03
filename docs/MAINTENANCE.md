# Betrieb und Datenquellen

## Cubes von CubeCobra

Oben neben dem Logo zwischen **MTG Set** und **Cube** wechseln. Im Cube-Modus
erscheint statt der Setliste ein Suchfeld mit Vorschlägen bei jedem Buchstaben.
Gesucht wird nach Name, Besitzer und Cube-ID; Pfeiltasten/Enter oder ein Klick
wählen den Cube aus. Anschließend auf **Laden** klicken. Es stehen nur die
50 beliebtesten Cubes nach öffentlicher Followerzahl zur Auswahl (Gleichstand:
Name, dann ID). Ein Name, Link oder eine ID lädt ebenfalls nur einen Katalog-Cube.

Der Suchkatalog stammt aus dem offiziellen öffentlichen CubeCobra-Gesamtexport
und wird im kostenlosen Wochenlauf aktualisiert (`node scripts/update-cubes.mjs`).
Es ist der Stand des CubeCobra-Exports, keine Live-Suche auf deren Website.
`cubes.json` enthält nur Suchmetadaten der Top 50; `cubes.json.gz` ist die
komprimierte Browserfassung. Ein Web Worker durchsucht den Katalog im Hintergrund.
Die große Exportdatei und Benutzer-Followerlisten werden nicht gespeichert.

Der ausgewählte Cube wird direkt über CubeCobras öffentliche CORS-API geladen.
Angezeigt werden die Hauptdeckkarten mit Bildern und Kartentexten aus CubeCobra,
nach Farben und anschließend CubeCobra-Elo sortiert. Elo ist eine übergreifende
CubeCobra-Bewertung, keine Winrate des gewählten Cubes. Für Cubes werden keine
Draftsim-, Untapped- oder 17Lands-Daten herangezogen. Private Cubes benötigen
weiterhin eine Berechtigung auf CubeCobra und können hier nicht geladen werden.

Die Statistikübersicht verwendet ausschließlich echte CubeCobra-Records:
Die fünf häufigsten Deckfarbkombinationen (Anzahl eingetragener Decks mit
Spielergebnissen) zeigen ihre Spiel-Winrate. Per Klick erscheinen die bis zu
20 meistgespielten Karten dieser Kombination mit ihrer Spiel-Winrate.
Standardländer sind ausgeschlossen, mindestens 50 Spieler-Spiele pro Karte sind
erforderlich. Es zählen auch Niederlagen und Unentschieden, keine Freilose.
Eine Karte zählt höchstens einmal je Spieler-Spiel. Die eingereichte Deckliste
gilt für die dokumentierten Match-Ergebnisse; Sideboardänderungen je Spiel sind
nicht bekannt. Farben werden wie bei CubeCobra anhand von mehr als 10 % der
Nichtland-Karten bestimmt. Frühere Cube-Versionen können enthalten sein.

`cube-record-stats.json` enthält nur Aggregate, keine Spielernamen. Der Wochenlauf
aktualisiert ausschließlich die 50 Katalog-Cubes über
`node scripts/update-cube-records.mjs`; entfernte IDs werden aus dem Cache genommen.
Der Browser liest ausschließlich diese vorbereitete JSON-Datei, ohne Live-Records,
Records-Proxys oder Cloudflare Worker. Die aktuelle Hauptkartenliste samt Primer
wird weiterhin über die öffentliche CubeCobra-CORS-API geladen.
Auch große Cubes können null Ergebnis-Records haben. Bei fehlenden Ergebnissen
oder einer nicht erreichbaren Cache-Datei zeigt dieselbe Tabelle bis zu fünf
Farbkombinationen mit dem Label „Empfehlung“, ohne Winrate. Die Empfehlungen aus
`cube-guide.js` sind regelbasierte Deckideen aus Primer und tatsächlicher Kartenliste,
keine gemessene Beliebtheit. Mono- und Zweifarbdecks werden aus vorhandenen Rollen
abgeleitet, breitere Kombinationen brauchen einen Primer-Hinweis und ausreichend
Fixing. Verschiedene unterstützte Spielpläne werden bevorzugt. Im Karten-Dialog
erscheinen bis zu 20 farblich passende Einzelkarten: Rollenpassung zuerst, dann
Primer-Nennung, mit allgemeiner CubeCobra-Elo als nachrangigem Faktor. Standardländer
und doppelte Kartennamen werden ausgeschlossen. Bei verfügbaren Ergebnissen ersetzt
die echte Records-Auswertung diese Vorschläge. Hintergrundantworten dürfen nach
einem neuen Ladevorgang oder Formatwechsel keine alte Übersicht wiederherstellen.

Das Layout bleibt identisch zum MTG-Set-Modus, ohne zusätzliche Cube-Infobox.
Nur die untere vollständige Kartenliste enthält erklärende Texte: vorhandene
Kartennotizen, gekürzte Primer-Stellen mit Kartennennung sowie regelbasierte
Hinweise zu erkannten Rollen und passenden Karten im selben Cube. Quellen werden
als Text ausgegeben, niemals als unbereinigtes HTML. Diese Heuristik ersetzt keine
vollständige Regelauswertung oder redaktionelle Cube-Analyse und verwendet keinen
kostenpflichtigen KI-Dienst. Tests: `node --test scripts/cube-guide.test.mjs`.

### Für später vorgemerkt

Entscheidung vom 03.11.2026: vorerst Top 50 und vollständig vorbereitete
Spielstatistiken auf GitHub. Ein eigener kostenloser Cloudflare Worker für
beliebige weitere Cubes und verlässliche Live-Records bleibt eine mögliche
spätere Erweiterung. Aktuell keinen Worker einrichten oder Account voraussetzen.

Der schwebende Pfeil links unten erscheint ab 500 px Scrolltiefe und führt zum
Seitenanfang zurück. Er respektiert reduzierte Bewegung und bleibt vom
Farben-/Archetypen-Menü rechts getrennt.

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
