import { readFile, writeFile, rename } from "node:fs/promises";
import CubeRecords from "../cube-records.js";
const root = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("cubes.json", root), "utf8"));
let previous = { cubes: {} };
try { previous = JSON.parse(await readFile(new URL("cube-record-stats.json", root), "utf8")); } catch {}
const selected = process.argv.slice(2);
const allowed = new Set(catalog.cubes.map(c => c.id));
previous.cubes = Object.fromEntries(Object.entries(previous.cubes).filter(([id]) => allowed.has(id)));
// Only the selected top-50 catalog is maintained; never expand via browser reads.
const ids = selected.length ? selected : [...allowed];
if (ids.some(id => !allowed.has(id))) throw new Error("Cube ID is not in the top-50 catalog");
for (const id of ids) {
  if (!/^[a-z\d_-]+$/i.test(id)) throw new Error("Invalid cube ID");
  try {
    const r = await fetch(`https://cubecobra.com/cube/records/analysisdata/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    previous.cubes[id] = CubeRecords.analyze(await r.json());
    console.log(`${id}: ${previous.cubes[id].records} events, ${previous.cubes[id].playerGames} player-games`);
  } catch (error) { console.warn(`::warning::Cube records ${id}: ${error.message}; keeping previous data`); }
  await new Promise(resolve => setTimeout(resolve, 500));
}
await writeFile(new URL("cube-record-stats.pending.json", root), JSON.stringify({ ...previous, generatedAt: new Date().toISOString() }) + "\n");
await rename(new URL("cube-record-stats.pending.json", root), new URL("cube-record-stats.json", root));
