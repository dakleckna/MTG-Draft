import { topCards } from "./game-card-stats.mjs";

const sum = values => Object.values(values || {}).reduce((total, n) => total + Number(n || 0), 0);
const isBasic = name => /^(Plains|Island|Swamp|Mountain|Forest|Wastes|Snow-Covered .+)$/.test(name);

export function analyzeUntappedCards(payload, cardNames, archetypes) {
  const fields = payload?.metadata?.fields;
  if (!payload?.data || !Array.isArray(fields)) throw new Error("Invalid Untapped card statistics");
  const locate = name => {
    for (let dataIndex = 0; dataIndex < fields.length; dataIndex++) {
      const fieldIndex = fields[dataIndex].indexOf(name);
      if (fieldIndex >= 0) return { dataIndex, fieldIndex };
    }
    throw new Error(`Missing Untapped field: ${name}`);
  };
  const gamesField = locate("games"), winsField = locate("wins");
  const value = (ranks, field) => Object.values(ranks).reduce((n, row) => n + Number(row?.[field.dataIndex]?.[field.fieldIndex] || 0), 0);
  return archetypes.map(archetype => {
    const games = sum(payload.metadata.games?.[archetype.id]);
    const cards = new Map();
    for (const [titleId, combinations] of Object.entries(payload.data)) {
      const name = cardNames.get(Number(titleId));
      // ALL is an overall statistic, not a substitute for the chosen colors.
      const ranks = combinations[archetype.id];
      if (!name || isBasic(name) || !ranks) continue;
      const card = { name, games: value(ranks, gamesField), wins: value(ranks, winsField) };
      if (!Number.isInteger(card.games) || !Number.isInteger(card.wins) || card.games < 0 || card.wins < 0 || card.wins > card.games || card.games > games) {
        throw new Error(`Invalid Untapped outcomes: ${name}`);
      }
      cards.set(name, card);
    }
    return { id: archetype.id, name: archetype.name, games, topCards: topCards({ cards }) };
  });
}
