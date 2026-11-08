(function (root) {
  const order = ["W", "U", "B", "R", "G"];
  function analyze(data) {
    if (!Array.isArray(data?.records) || !data.cards || typeof data.cards !== "object") throw new Error("Ungültige CubeCobra-Spielstatistiken");
    const groups = new Map(), seen = new Set();
    let records = 0, playerGames = 0;
    for (const record of data.records) {
      if (!record.id || seen.has(record.id)) continue;
      seen.add(record.id);
      const players = new Set((record.players || []).map(p => p.name));
      const outcomes = new Map();
      for (const round of record.matches || []) for (const match of round.matches || []) {
        // Exclude byes, unplayed matches and malformed results.
        if (!players.has(match.p1) || !players.has(match.p2) || match.p1 === match.p2) continue;
        const [wins, losses, draws = 0] = match.results || [];
        if (![wins, losses, draws].every(n => Number.isInteger(n) && n >= 0) || wins + losses + draws === 0) continue;
        for (const [name, w, l] of [[match.p1, wins, losses], [match.p2, losses, wins]]) {
          const total = outcomes.get(name) || { games: 0, wins: 0 };
          total.games += w + l + draws; total.wins += w; outcomes.set(name, total);
        }
      }
      let used = false;
      for (const [name, deck] of Object.entries(record.decks || {})) {
        const result = outcomes.get(name);
        if (!players.has(name) || !result?.games || !Array.isArray(deck)) continue;
        const ids = [...new Set(deck)];
        // Unknown cards make color classification unreliable: skip this deck.
        if (!ids.length || ids.some(id => !data.cards[id])) continue;
        const spells = ids.map(id => data.cards[id]).filter(c => !/land/i.test(c.type || ""));
        if (!spells.length) continue;
        // Same >10% non-land color-identity rule as CubeCobra record analysis.
        const colors = order.filter(c => spells.filter(s => s.colorIdentity?.includes(c)).length / spells.length > .1);
        const key = colors.join("") || "C";
        const group = groups.get(key) || { key, colors, decks: 0, games: 0, wins: 0, cards: new Map() };
        group.decks++; group.games += result.games; group.wins += result.wins;
        for (const id of ids) {
          const info = data.cards[id];
          if (/\bbasic\b.*\bland\b/i.test(info.type || "") || /^(Plains|Island|Swamp|Mountain|Forest|Wastes|Snow-Covered .+)$/i.test(info.name || "")) continue;
          const card = group.cards.get(id) || { id, name: info.name, image: info.imageUrl, games: 0, wins: 0 };
          card.games += result.games; card.wins += result.wins; group.cards.set(id, card);
        }
        groups.set(key, group); playerGames += result.games; used = true;
      }
      if (used) records++;
    }
    const archetypes = [...groups.values()].sort((a, b) => b.decks - a.decks || b.games - a.games || a.key.localeCompare(b.key))
      .slice(0, 5).map(group => ({
        key: group.key, colors: group.colors, decks: group.decks, games: group.games, wins: group.wins,
        winRate: 100 * group.wins / group.games,
        topCards: [...group.cards.values()].filter(c => c.name && c.games >= 50)
          .map(c => ({ ...c, image: /^https:\/\//.test(c.image || "") ? c.image : null, winRate: 100 * c.wins / c.games }))
          .sort((a, b) => b.winRate - a.winRate || b.games - a.games || a.name.localeCompare(b.name)).slice(0, 20)
      }));
    return { source: "CubeCobra", metric: "recorded game win rate with card in submitted mainboard", ranking: "winRate", records, playerGames,
      updatedAt: new Date().toISOString(), archetypes };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { analyze };
  else root.CubeRecords = { analyze };
})(globalThis);
