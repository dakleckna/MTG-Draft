import { test } from "node:test";
import assert from "node:assert/strict";
import { objects } from "./update-cubes.mjs";
import CubeData from "../cube-data.js";
import CubeRecords from "../cube-records.js";

test("CubeCobra URLs and IDs: rejects other hosts, scripts and invalid paths", () => {
  assert.equal(CubeData.cubeId("450"), "450");
  assert.equal(CubeData.cubeId("https://cubecobra.com/cube/list/vintage?view=spoiler"), "vintage");
  assert.equal(CubeData.cubeId("https://www.cubecobra.com/cube/overview/my-cube"), "my-cube");
  for (const input of ["javascript:alert(1)", "https://evil.com/cube/list/test", "https://cubecobra.com.evil.com/cube/list/test", "https://cubecobra.com/cube/list/../test", "two words"]) assert.equal(CubeData.cubeId(input), null);
});

test("suggestions work by partial name, owner and accents; prefix outranks popularity", () => {
  const cubes = [
    { id: "a", name: "My Vintage Cube", owner: "Owner", followers: 100 },
    { id: "b", name: "Vintage Cube", owner: "Émile", followers: 1 }
  ];
  assert.deepEqual(CubeData.search(cubes, "vint").map(c => c.id), ["b", "a"]);
  assert.equal(CubeData.search(cubes, "emile")[0].id, "b");
  assert.equal(CubeData.search(cubes, "nothing").length, 0);
});

test("top-50 catalog ranks by followers and rejects IDs, names and URLs outside it", () => {
  const cubes = Array.from({ length: 60 }, (_, i) => ({ id: `cube-${i}`, name: `Cube ${i}`, followers: i }));
  const top = CubeData.topCubes([...cubes, cubes[59]]);
  assert.equal(top.length, 50);
  assert.equal(top[0].id, "cube-59");
  assert.equal(top[49].id, "cube-10");
  assert.equal(CubeData.findCube(top, "https://cubecobra.com/cube/list/cube-59").id, "cube-59");
  assert.equal(CubeData.findCube(top, "cube 59").id, "cube-59");
  for (const value of ["cube-0", "Cube 0", "https://cubecobra.com/cube/list/cube-0"]) {
    assert.equal(CubeData.findCube(top, value), null);
  }
  assert.deepEqual(CubeData.topCubes([
    { id: "z", name: "B", followers: 1 }, { id: "b", name: "A", followers: 1 }, { id: "a", name: "A", followers: 1 }
  ]).map(c => c.id), ["a", "b", "z"]);
});

test("streaming export parser handles chunked UTF-8, quotes, nested objects and truncation", async () => {
  const expected = [{ id: "a", name: 'Ä {test} "cube"', nested: { cards: [1, 2] } }, { id: "b" }];
  const bytes = new TextEncoder().encode(JSON.stringify(expected));
  async function* chunks() { for (let i = 0; i < bytes.length; i += 3) yield bytes.slice(i, i + 3); }
  const result = []; for await (const c of objects(chunks())) result.push(c);
  assert.deepEqual(result, expected);
  await assert.rejects(async () => { for await (const c of objects([new TextEncoder().encode('[{"id":"a"}')])) void c; }, /Incomplete/);
});

test("cube cards use only mainboard, keep color overrides and distinguish missing Elo", () => {
  const result = CubeData.cards({ cards: { mainboard: [
    { colors: ["R"], details: { name: "A", colors: ["W"], elo: 1234, image_normal: "https://assets.cubecobra.com/card.webp", oracle_text: "Text" } },
    { details: { name: "B", type: "Land", image_normal: "javascript:bad" } }
  ], maybeboard: [{ details: { name: "Not included" } }] } });
  assert.equal(result.length, 2);
  assert.equal(result[0].group, "R");
  assert.equal(result[0].rating, 1234);
  assert.equal(result[1].group, "land");
  assert.equal(result[1].rating, null);
  assert.equal(result[1].image, null);
});

test("cube record winrates include losses and draws, deduplicate cards and ignore byes", () => {
  const record = { id: "one", players: [{ name: "a" }, { name: "b" }],
    matches: [{ matches: [{ p1: "a", p2: "b", results: [2, 1, 1] }, { p1: "a", p2: "bye", results: [2, 0, 0] }] }],
    decks: { a: ["black", "black", "red", "swamp"], b: ["white", "blue"] } };
  const data = { records: Array.from({ length: 15 }, (_, i) => ({ ...record, id: String(i) })), cards: {
    black: { name: "Black Card", type: "Creature", colorIdentity: ["B"], imageUrl: "https://test/card" },
    red: { name: "Red Card", type: "Creature", colorIdentity: ["R"] },
    swamp: { name: "Swamp", type: "Basic Land", colorIdentity: ["B"] },
    white: { name: "White Card", type: "Creature", colorIdentity: ["W"] },
    blue: { name: "Blue Card", type: "Creature", colorIdentity: ["U"] }
  } };
  data.records.push(data.records[0]);
  const result = CubeRecords.analyze(data);
  assert.equal(result.records, 15);
  assert.equal(result.playerGames, 120);
  const rakdos = result.archetypes.find(a => a.key === "BR");
  assert.equal(rakdos.decks, 15);
  assert.equal(rakdos.games, 60);
  assert.equal(rakdos.wins, 30);
  assert.equal(rakdos.winRate, 50);
  assert.equal(rakdos.topCards.length, 2);
  assert.equal(rakdos.topCards[0].games, 60);
  assert.equal(result.archetypes.find(a => a.key === "WU").winRate, 25);
  assert.deepEqual(CubeRecords.analyze({ records: [], cards: {} }).archetypes, []);
  assert.equal(CubeRecords.analyze({ ...data, records: [record] }).archetypes[0].topCards.length, 0);
});
