export function recordGame(group, values, indexes, won) {
  group.games++;
  group.wins += Number(won);
  for (const [name, index] of indexes) {
    if (Number(values[index]) <= 0) continue;
    const card = group.cards.get(name) || { name, games: 0, wins: 0 };
    card.games++;
    card.wins += Number(won);
    group.cards.set(name, card);
  }
}

export function topCards(group) {
  return [...group.cards.values()].filter(card => card.games >= 50)
    .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name)).slice(0, 20)
    .map(card => ({ ...card, winRate: 100 * card.wins / card.games }));
}
