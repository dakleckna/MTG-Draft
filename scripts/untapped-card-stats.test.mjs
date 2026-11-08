import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeUntappedCards } from "./untapped-card-stats.mjs";

const groups = [{ id: 5, name: "Orzhov" }, { id: 12, name: "Rakdos" }];
const names = new Map([[1, "Shared Card"], [2, "Swamp"], [3, "Small Sample"], [4, "Global Only"]]);
const payload = () => ({ metadata: { fields: [["games", "wins"]], games: { 5: { bronze: 100 }, 12: { bronze: 200 } } }, data: {
  1: { 5: { b: [[30, 18]], s: [[20, 12]] }, 12: { b: [[80, 20]] }, ALL: { b: [[1000, 900]] } },
  2: { 5: { b: [[100, 80]] } },
  3: { 5: { b: [[49, 49]] } },
  4: { ALL: { b: [[500, 450]] } }
} });

test("Untapped card winrates use actual color splits and never substitute ALL", () => {
  const result = analyzeUntappedCards(payload(), names, groups);
  assert.equal(result[0].topCards.length, 1);
  assert.deepEqual(result[0].topCards[0], { name: "Shared Card", games: 50, wins: 30, winRate: 60 });
  assert.equal(result[1].topCards[0].winRate, 25);
  assert.equal(result[0].games, 100);
  assert.equal(result[1].games, 200);
});

test("Untapped payload field order is read from metadata; missing metrics are rejected", () => {
  const data = { metadata: { fields: [["wins", "games"]], games: { 5: { gold: 100 } } },
    data: { 1: { 5: { g: [[30, 60]] } } } };
  assert.equal(analyzeUntappedCards(data, names, [groups[0]])[0].topCards[0].winRate, 50);
  assert.throws(() => analyzeUntappedCards({ ...data, metadata: { fields: [["games"]] } }, names, groups), /Missing Untapped field: wins/);
});

test("missing color splits stay empty and impossible outcome counts fail", () => {
  const data = payload();
  assert.deepEqual(analyzeUntappedCards(data, names, [{ id: 18, name: "Simic" }])[0].topCards, []);
  data.data[1][5].b = [[30, 100]];
  assert.throws(() => analyzeUntappedCards(data, names, groups), /Invalid Untapped outcomes/);
});
