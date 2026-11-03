importScripts("cube-data.js?v=cubes-1");
let indexPromise;
let latest = 0;
async function readIndex() {
  let index;
  if (typeof DecompressionStream === "function") {
    const response = await fetch("cubes.json.gz", { cache: "no-cache" });
    if (!response.ok) throw new Error("Katalog nicht verfügbar");
    index = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).json();
  } else {
    const response = await fetch("cubes.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Katalog nicht verfügbar");
    index = await response.json();
  }
  if (!Array.isArray(index.cubes)) throw new Error("Ungültiger Katalog");
  for (const cube of index.cubes) {
    cube._name = CubeData.normalize(cube.name);
    cube._search = CubeData.normalize(`${cube.name} ${cube.owner} ${cube.id}`);
  }
  return index;
}
onmessage = async ({ data: { id, query } }) => {
  latest = id;
  try {
    if (!indexPromise) indexPromise = readIndex().catch(error => { indexPromise = null; throw error; });
    const index = await indexPromise;
    const matches = id === latest ? CubeData.search(index.cubes, query).map(({ _name, _search, ...cube }) => cube) : [];
    postMessage({ id, total: index.cubes.length, snapshot: index.sourceModifiedAt, matches });
  } catch { postMessage({ id, error: true }); }
};
