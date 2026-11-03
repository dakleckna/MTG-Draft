import { readFile, writeFile, rename } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import CubeData from "../cube-data.js";
const target = new URL("../cubes.json", import.meta.url);
const pending = new URL("../cubes.pending.json", import.meta.url);
const sourceUrl = "https://cubecobra-public.s3.amazonaws.com/export/cubes.json";

// Stream the official large export; retain only public discovery metadata.
export async function* objects(stream) {
  const decoder = new TextDecoder();
  let depth = 0, quoted = false, escaped = false, buffer = "", started = false, ended = false;
  for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true });
    for (const char of text) {
      if (!started) { if (/\s/.test(char)) continue; if (char !== "[") throw new Error("Expected cube array"); started = true; continue; }
      if (!depth) {
        if (char === "]") { ended = true; continue; }
        if (/[\s,]/.test(char)) continue;
        if (ended || char !== "{") throw new Error("Invalid export structure");
        depth = 1; buffer = "{"; continue;
      }
      buffer += char;
      if (buffer.length > 5_000_000) throw new Error("Cube export record too large");
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) { yield JSON.parse(buffer); buffer = ""; }
    }
  }
  if (!ended || depth || quoted) throw new Error("Incomplete CubeCobra export");
}

export async function updateCubes() {
  let previous;
  try { previous = JSON.parse(await readFile(target, "utf8")); } catch {}
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(600000) });
  if (!response.ok) throw new Error(`CubeCobra export: HTTP ${response.status}`);
  const sourceModifiedAt = response.headers.get("last-modified");
  if (previous?.sourceModifiedAt === sourceModifiedAt && previous?.cubes?.length) {
    await response.body.cancel();
    const output = { ...previous, limit: 50, ranking: "followers", cubes: CubeData.topCubes(previous.cubes) };
    await writeFile(pending, JSON.stringify(output) + "\n");
    await rename(pending, target);
    await writeFile(new URL("../cubes.json.gz", import.meta.url), gzipSync(JSON.stringify(output), { level: 9 }));
    console.log(`Cube index unchanged (${output.cubes.length} top cubes).`); return;
  }
  const cubes = new Map();
  for await (const c of objects(response.body)) {
    if (!/^[a-z\d_-]+$/i.test(c.id || "") || typeof c.name !== "string" || !c.name.trim()) continue;
    cubes.set(c.id, { id: c.id, name: c.name.slice(0, 250), owner: String(c.owner || "").slice(0, 100),
      cards: Number(c.card_count) || 0, followers: c.following?.length || 0 });
  }
  if (cubes.size < 50 || (previous?.sourceCount && cubes.size < previous.sourceCount / 2)) throw new Error("Cube index unexpectedly empty or incomplete");
  const output = { source: "CubeCobra", sourceUrl, sourceModifiedAt, generatedAt: new Date().toISOString(),
    sourceCount: cubes.size, limit: 50, ranking: "followers", cubes: CubeData.topCubes([...cubes.values()]) };
  await writeFile(pending, JSON.stringify(output) + "\n");
  await rename(pending, target);
  await writeFile(new URL("../cubes.json.gz", import.meta.url), gzipSync(JSON.stringify(output), { level: 9 }));
  console.log(`Saved top 50 by follower count from ${cubes.size} public cubes.`);
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  try { await updateCubes(); } catch (error) {
    try { const old = JSON.parse(await readFile(target, "utf8")); if (!old.cubes?.length) throw error; }
    catch { throw error; }
    console.warn(`::warning::Cube index update failed; keeping previous index: ${error.message}`);
  }
}
