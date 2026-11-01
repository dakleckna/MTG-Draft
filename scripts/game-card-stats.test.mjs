import { test } from "node:test";
import assert from "node:assert/strict";
import { recordGame, topCards } from "./game-card-stats.mjs";

test("counts losses as well as wins, and multiple copies only once per game", () => {
  const group = { games: 0, wins: 0, cards: new Map() };
  for (let i = 0; i < 60; i++) recordGame(group, ["3", i < 49 ? "1" : "0"], [["Common", 0], ["Rare", 1]], i < 30);
  assert.equal(group.games, 60);
  assert.equal(group.wins, 30);
  assert.deepEqual(topCards(group), [{ name: "Common", games: 60, wins: 30, winRate: 50 }]);
});

test("popularity determines rank, not winrate; output is limited to twenty", () => {
  const group = { cards: new Map(Array.from({ length: 25 }, (_, i) => [i, { name: `Card ${i}`, games: 100 + i, wins: 50 }])) };
  const cards = topCards(group);
  assert.equal(cards.length, 20);
  assert.equal(cards[0].name, "Card 24");
  assert.equal(cards[19].name, "Card 5");
});
