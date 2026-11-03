import { test } from "node:test";
import assert from "node:assert/strict";
import { objects } from "./update-cubes.mjs";
import CubeData from "../cube-data.js";

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
