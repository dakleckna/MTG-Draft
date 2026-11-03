import { test } from "node:test";
import assert from "node:assert/strict";
import CubeGuide from "../cube-guide.js";

const card = (name, colors, oracleText = "", extra = {}) => ({
  name, colorIdentity: colors, deckColors: colors, typeLine: "Creature", manaValue: 2,
  oracleText, oracleTags: [], rating: 1400, image: `https://cards.example/${encodeURIComponent(name)}`, ...extra
});
const pool = () => ["W", "U", "B", "R", "G"].flatMap(color => Array.from({ length: 10 }, (_, i) =>
  card(`${color} spell ${i}`, [color], i < 5 ? "When this creature enters, create a 1/1 creature token." : "Draw a card.")));

test("primer-backed recommendations keep colors legal, names unique and no fake statistics", () => {
  const cards = [...pool(), card("Rakdos engine", ["B", "R"], "Sacrifice another creature: Draw a card.", { notes: "Keep sacrifice fodder ready." })];
  cards.push(cards[0]); // Multiple copies/printings cannot fill the twenty slots.
  const result = CubeGuide.guide({ primerTabs: [{ content: "BR / Rakdos: sacrifice tokens. [[Rakdos engine]] is a build-around." }] }, cards);
  assert.equal(result.archetypes.length, 5);
  assert.equal(result.archetypes[0].key, "BR");
  assert.equal(new Set(result.archetypes.map(a => a.key)).size, 5);
  for (const a of result.archetypes) {
    assert.ok(a.topCards.length <= 20);
    assert.equal(new Set(a.topCards.map(c => c.name)).size, a.topCards.length);
    assert.equal(a.winRate, undefined);
    for (const c of a.topCards) {
      assert.ok(cards.find(card => card.name === c.name).deckColors.every(color => a.colors.includes(color)));
      assert.equal(c.winRate, undefined);
    }
  }
  assert.match(result.reviews.get("Rakdos engine"), /Cube-Notiz: Keep sacrifice fodder ready/);
  assert.match(result.reviews.get("Rakdos engine"), /Im Primer: BR \/ Rakdos/);
  assert.match(result.reviews.get("Rakdos engine"), /Opfermaterial/);
});

test("mono and five-color recommendations are possible, wider decks need real fixing", () => {
  const mono = Array.from({ length: 30 }, (_, i) => card(`Green ${i}`, ["G"], "{T}: Add {G}."));
  assert.equal(CubeGuide.guide({}, mono).archetypes[0].key, "G");
  const cube = { primerTabs: [{ content: "Five-color Domain: ramp and mana fixing." }] };
  assert.ok(!CubeGuide.guide(cube, pool()).archetypes.some(a => a.key === "WUBRG"));
  const fixing = Array.from({ length: 10 }, (_, i) => card(`Fixing ${i}`, [], "{T}: Add one mana of any color.", { typeLine: "Land" }));
  assert.ok(CubeGuide.guide(cube, [...pool(), ...fixing]).archetypes.some(a => a.key === "WUBRG"));
});

test("empty sources stay empty and untrusted formatting stays plain text", () => {
  assert.deepEqual(CubeGuide.guide({}, []).archetypes, []);
  const value = '<script>alert(1)</script><p>[[Sol Ring]] **Ramp** [guide](https://example.com)</p>';
  assert.equal(CubeGuide.text(value), "Sol Ring Ramp guide");
  const result = CubeGuide.guide({ description: value }, [card("Sol Ring", [], "{T}: Add {C}{C}.")]);
  assert.ok(!result.reviews.get("Sol Ring").includes("alert"));
  assert.ok(!result.reviews.get("Sol Ring").includes("<"));
});

test("drawback and self-damage tags do not become card draw or removal advice", () => {
  const result = CubeGuide.guide({}, [card("Mana rock", [], "{T}: Add {C}{C}.", {
    oracleTags: ["mana-rock", "drawback", "burn-you"], typeLine: "Artifact"
  })]);
  const review = result.reviews.get("Mana rock");
  assert.match(review, /Beschleunigung/);
  assert.ok(!review.includes("Kartenauswahl"));
  assert.ok(!review.includes("Interaktion hält"));
});

test("giving an opponent a Clue is not a token-engine recommendation", () => {
  const result = CubeGuide.guide({}, [card("Fateful Absence", ["W"],
    "Destroy target creature or planeswalker. Its controller investigates.", {
      typeLine: "Instant", oracleTags: ["spot-removal", "token-generator-clue"]
    })]);
  assert.match(result.reviews.get("Fateful Absence"), /Interaktion hält/);
  assert.ok(!result.reviews.get("Fateful Absence").includes("Token werden"));
});
