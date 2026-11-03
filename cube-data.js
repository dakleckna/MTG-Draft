(function (root) {
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  function topCubes(cubes) {
    return [...new Map(cubes.map(c => [c.id, c])).values()].sort((a, b) =>
      b.followers - a.followers || a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en")).slice(0, 50);
  }
  function findCube(cubes, value) {
    const id = cubeId(value);
    return cubes.find(cube => cube.id.toLowerCase() === String(id).toLowerCase() || normalize(cube.name) === normalize(value)) || null;
  }
  function cubeId(value) {
    const text = String(value || "").trim();
    if (/^[a-z\d_-]{1,100}$/i.test(text)) return text;
    try {
      const url = new URL(text);
      if (url.protocol !== "https:" || !["cubecobra.com", "www.cubecobra.com"].includes(url.hostname)) return null;
      const id = url.pathname.match(/^\/cube\/(?:list|overview|analysis|playtest|blog)\/([a-z\d_-]+)\/?$/i)?.[1];
      return id && id.length <= 100 ? id : null;
    } catch { return null; }
  }
  function search(cubes, query, limit = 8) {
    const q = normalize(query);
    const terms = q.split(/\s+/).filter(Boolean);
    const best = [];
    for (const cube of cubes) {
      const name = cube._name || normalize(cube.name);
      const haystack = cube._search || normalize(`${cube.name} ${cube.owner} ${cube.id}`);
      if (!terms.every(term => haystack.includes(term))) continue;
      best.push({ cube, prefix: Number(name.startsWith(q)) });
      best.sort((a, b) => b.prefix - a.prefix || b.cube.followers - a.cube.followers || a.cube.name.localeCompare(b.cube.name));
      if (best.length > limit) best.pop();
    }
    return best.map(({ cube }) => cube);
  }
  function cards(cube) {
    if (!cube || !Array.isArray(cube.cards?.mainboard)) throw new Error("CubeCobra hat keine gültige Hauptkartenliste geliefert.");
    return cube.cards.mainboard.flatMap(card => {
      const d = card.details || {};
      const name = d.name || card.name;
      if (!name) return [];
      const colors = ["W", "U", "B", "R", "G"].filter(c => (card.colors || d.colors || []).includes(c));
      const type = card.type_line || d.type || "";
      const group = /land/i.test(type) ? "land" : colors.length ? colors.join("") : /artifact/i.test(type) ? "artifact" : "unassigned";
      const elo = typeof d.elo === "number" && Number.isFinite(d.elo) ? d.elo : null;
      const image = card.imgUrl || d.image_normal || d.image_small;
      return [{ name, source: "cubecobra", rating: elo, colorIdentity: colors, group, typeLine: type,
        manaValue: Number(card.cmc ?? d.cmc), oracleText: d.oracle_text || "", oracleTags: d.oracle_tags || [],
        deckColors: ["W", "U", "B", "R", "G"].filter(c => (d.color_identity || colors).includes(c)),
        notes: typeof card.notes === "string" ? card.notes : "", tags: card.tags || [],
        section: type, review: d.oracle_text || "", image: /^https:\/\//.test(image || "") ? image : null }];
    });
  }
  const api = { normalize, cubeId, search, cards, topCubes, findCube };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CubeData = api;
})(globalThis);
