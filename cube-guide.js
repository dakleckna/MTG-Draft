(function (root) {
  const aliases = {
    W: ["mono white", "mono-white", "monowhite", "weiß"], U: ["mono blue", "mono-blue", "monoblue", "blau"],
    B: ["mono black", "mono-black", "monoblack", "schwarz"], R: ["mono red", "mono-red", "monored", "rot"],
    G: ["mono green", "mono-green", "monogreen", "grün"], WU: ["azorius", "uw", "wu"],
    UB: ["dimir", "ub", "bu"], BR: ["rakdos", "br", "rb"], RG: ["gruul", "rg", "gr"],
    WG: ["selesnya", "gw", "wg"], WB: ["orzhov", "wb", "bw"], UR: ["izzet", "ur", "ru"],
    BG: ["golgari", "bg", "gb"], WR: ["boros", "rw", "wr"], UG: ["simic", "ug", "gu"],
    WUB: ["esper"], UBR: ["grixis"], BRG: ["jund"], WRG: ["naya"], WUG: ["bant"],
    WBG: ["abzan"], WUR: ["jeskai"], UBG: ["sultai"], WBR: ["mardu"], URG: ["temur"],
    WUBRG: ["five color", "five-color", "5 color", "5-color", "5c", "fünffarbig", "domain"]
  };
  // Rules identify observable card roles, not an invented winrate or metagame.
  const roles = [
    { id: "reanimate", label: "Reanimator", test: /return target creature card from (?:a|your) graveyard to the battlefield|reanimate/, tip: "Plane große Reanimationsziele und Wege, sie in den Friedhof zu bekommen; ohne beides ist der Plan unzuverlässig." },
    { id: "graveyard", label: "Friedhof", test: /mill |surveil|discard (?:a|two|three) cards?|dredge|from your graveyard/, tip: "Verbinde Friedhofsfüller mit Karten, die den Friedhof nutzen. Halte gegen Friedhofs-Hate einen zweiten Spielplan bereit." },
    { id: "sacrifice", label: "Opfer-Synergien", test: /sacrifice (?:a|another|an? .*?) (?:creature|artifact)|whenever (?:another |a )?(?:creature|artifact).*dies/, tip: "Sammle Opfermaterial, wiederholbare Opfermöglichkeiten und Belohnungen; nur eine dieser Rollen ergibt noch keine Engine." },
    { id: "tokens", label: "Token", test: /create .*tokens?/, tip: "Token werden mit Team-Verstärkungen oder Opfer-Effekten wertvoller. Spiele gegen Massenremoval nicht die ganze Hand aus." },
    { id: "blink", label: "Blink", test: /exile (?:another |up to .*|target )?.*(?:you control|you own).*return .*battlefield/, tip: "Priorisiere Kreaturen mit Eintrittseffekten. Ein Blink-Effekt braucht gute Ziele und schützt nicht gegen jede Art von Removal." },
    { id: "etb", label: "Eintrittseffekte", test: /when (?:this (?:creature|permanent|artifact|enchantment)|[\w ',’-]+) enters(?: the battlefield)?,/, tip: "Eintrittseffekte lassen sich mit Blink oder Rückhol-Effekten mehrfach nutzen; achte auf Partner in denselben Farben." },
    { id: "ramp", label: "Ramp", test: /add \{|search your library for (?:up to .* )?(?:a |an? )?(?:basic )?land card/, tip: "Drafte Beschleunigung und teure Ziele im passenden Verhältnis. Frühes Ramp ist meist besser als noch ein weiterer teurer Finisher." },
    { id: "counter", label: "Kontrolle", test: /counter target (?:spell|noncreature|creature|artifact)/, tip: "Halte das passende Mana offen und priorisiere die gegnerischen Schlüsselzauber. Zu viele reaktive Karten ohne Kartennachschub können die Hand leeren." },
    { id: "draw", label: "Kartenauswahl", test: /draw (?:a|two|three|four|X) cards?|scry|surveil/, tip: "Kartenauswahl macht Synergiepläne konstanter. Halte trotzdem genug Interaktion und Karten bereit, die das Spiel beenden." },
    { id: "removal", label: "Interaktion", test: /(?:destroy|exile) target (?:creature|nonland|permanent)|deals? \d+ damage to (?:any target|target creature)|target creature gets -/, tip: "Interaktion hält den Weg für deinen Spielplan frei. Beachte Einschränkungen bei Ziel, Manawert und Geschwindigkeit, bevor du dich darauf verlässt." },
    { id: "counters", label: "+1/+1-Marken", test: /\+1\/\+1 counter/, tip: "Marken profitieren von wiederholbaren Auslösern und Proliferate. Verteile deine Investition, wenn der Gegner einzelnes Removal offen hat." },
    { id: "artifacts", label: "Artefakte", test: /affinity for artifacts|metalcraft|whenever .*artifact|for each artifact|artifact spells|artifact you control/, tip: "Artefakt-Belohnungen brauchen genügend günstige Artefakte. Prüfe die tatsächliche Dichte im Deck statt nur die Stärke der Einzelkarte." },
    { id: "spells", label: "Spells", test: /prowess|whenever you cast (?:an? )?(?:instant|noncreature)|instant or sorcery (?:spell|card)/, tip: "Günstige Zauber und wiederholbare Belohnungen gehören zusammen. Behalte genug Kreaturen oder andere Gewinnbedingungen im Deck." },
    { id: "fixing", label: "Mana-Fixing", test: /add (?:one mana of any color|.*mana of any (?:one )?color)|search your library for .*land card/, tip: "Fixing ermöglicht zusätzliche Farben, kostet aber Draftpicks und mitunter Tempo. Plane zuerst die Quellen für deine frühen Zauber." }
  ];
  for (const role of roles) role.test = new RegExp(role.test.source, "i");
  const plans = [
    { label: "Reanimator", roles: ["reanimate", "graveyard"], words: /reanimat/ },
    { label: "Opfer-Synergien", roles: ["sacrifice", "tokens"], words: /sacrifice|aristocrat|opfer/ },
    { label: "Blink", roles: ["blink", "etb"], words: /blink|flicker/ },
    { label: "Ramp", roles: ["ramp"], words: /ramp|big mana/ },
    { label: "Spells", roles: ["spells", "draw"], words: /spells|prowess|magecraft/ },
    { label: "Token", roles: ["tokens"], words: /tokens?|go wide/ },
    { label: "+1/+1-Marken", roles: ["counters"], words: /counters|proliferate|marken/ },
    { label: "Artefakte", roles: ["artifacts"], words: /artifacts?|artefakt/ },
    { label: "Kontrolle", roles: ["counter", "removal", "draw"], words: /control|kontrolle/ },
    { label: "Aggro", roles: ["early", "removal"], words: /aggro|weenie/ },
    { label: "Mehrfarbig", roles: ["fixing"], words: /domain|five.?color|5.?color|5c/ }
  ];
  function text(value) {
    return String(value || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/g, "")
      .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/[#*_`>|]/g, " ").replace(/\s+/g, " ").trim();
  }
  function primer(cube) {
    return [cube.description, ...(cube.primerTabs || []).map(tab => tab.content)].filter(v => typeof v === "string").join("\n");
  }
  function cardRoles(card) {
    const oracle = card.oracleText || "";
    const exactTags = {
      reanimate: /^(?:reanimate(?:-creature)?|recursion-creature)$/,
      graveyard: /^(?:self-mill|surveil|dredge)(?:-|$)/,
      sacrifice: /^(?:sacrifice-outlet|aristocrat|death-trigger)(?:-|$)/,
      tokens: /^token-generator(?:-|$)/, blink: /^(?:flicker|blink)(?:-|$)/,
      etb: /^etb-ability$/, ramp: /^(?:mana-dork|mana-rock|ramp)(?:-|$)/,
      counter: /^counterspell(?:-|$)/, draw: /^(?:draw|cantrip|scry)(?:-|$)/,
      removal: /^(?:spot-removal|burn|burn-any|burn-creature)$/,
      counters: /^(?:pp-counters-matter|proliferate|gives-pp-counters)$/,
      artifacts: /^(?:artifactfall|artifacts-matter|affinity|synergy-artifact)$/,
      spells: /^(?:magecraft|prowess|spells-matter)$/,
      fixing: /^(?:mana-fixing|fetchland)(?:-|$)/
    };
    const found = roles.filter(role => {
      if (role.id === "tokens" && /(?:its controller|that player|(?:target|each) opponent) (?:creates?|investigates?)/i.test(oracle)) return false;
      if (role.id === "reanimate" && (card.oracleTags || []).includes("reanimate-artifact") &&
        !(card.oracleTags || []).includes("reanimate-creature")) return false;
      return role.test.test(oracle) || (card.oracleTags || []).some(tag => exactTags[role.id].test(tag));
    }).map(role => role.id);
    if (/creature/i.test(card.typeLine) && card.manaValue >= 1 && card.manaValue <= 2) found.push("early");
    return found;
  }
  const isLand = card => /\bland\b/i.test(card.typeLine || "");
  const isBasic = card => /\bbasic\b.*\bland\b/i.test(card.typeLine || "");
  const fits = (card, key) => (card.deckColors || card.colorIdentity || []).every(color => key.includes(color));
  function guide(cube, cards) {
    const raw = primer(cube);
    const lines = raw.split(/\n|<\/?(?:p|li|h[1-6]|br)[^>]*>/i).map(text).filter(Boolean);
    const description = text(raw).toLowerCase();
    const unique = [...new Map(cards.map(card => [card.name, card])).values()];
    const rolesByName = new Map(unique.map(card => [card.name, cardRoles(card)]));
    const mentions = new Map();
    for (const [key, names] of Object.entries(aliases)) {
      const evidence = lines.find(line => !/\b(?:no|not supported|unsupported|kein|keine)\b/i.test(line) && (names.some(name => new RegExp(`(?:^|[^a-z])${name}(?=$|[^a-z])`, "i").test(line)) ||
        new RegExp(`(?:^|[^a-z])${key}(?=$|[^a-z])`, "i").test(line) ||
        line.includes(key.split("").map(c => `{${c}}`).join(""))));
      if (evidence) mentions.set(key, evidence);
    }
    // Mono and pairs can be inferred from the list; wider decks require an
    // explicit primer signal and enough fixing. No play statistics are inferred.
    const keys = new Set([...Object.keys(aliases).filter(key => key.length <= 2), ...mentions.keys()]);
    const candidates = [];
    for (const key of keys) {
      const pool = unique.filter(card => fits(card, key) && !isBasic(card));
      const spells = pool.filter(card => !isLand(card));
      const own = spells.filter(card => card.colorIdentity.length > 0);
      if (own.length < 8 || key.split("").some(c => !own.some(card => card.colorIdentity.includes(c)))) continue;
      const evidence = mentions.get(key) || "";
      const localText = evidence.toLowerCase();
      const counts = id => (id === "fixing" ? pool : spells).filter(card => rolesByName.get(card.name).includes(id)).length;
      // Universal colorless cards are useful picks but are weak evidence that
      // any particular color combination has a supported archetype.
      const roleWeight = id => spells.reduce((sum, card) => sum + (rolesByName.get(card.name).includes(id)
        ? (card.colorIdentity.length ? 1 : .2) : 0), 0);
      const supported = plans.map(plan => {
        const primary = counts(plan.roles[0]);
        const support = plan.roles.slice(1).reduce((sum, id) => sum + counts(id), 0);
        const explicit = plan.words.test(localText);
        return { ...plan, primary, support, explicit,
          score: roleWeight(plan.roles[0]) / Math.sqrt(own.length) + Math.min(support, primary * 2) / spells.length + (explicit ? 3 : 0) };
      }).filter(plan => plan.primary >= (plan.roles[0] === "early" ? 6 : 3) &&
        (!['reanimate', 'sacrifice', 'blink'].includes(plan.roles[0]) || plan.support >= 3));
      if (key.length > 2 && counts("fixing") < key.length + 2) continue;
      supported.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
      for (const plan of supported) {
        const ranked = pool.map(card => {
          const matches = rolesByName.get(card.name).filter(id => plan.roles.includes(id)).length;
          const named = description.includes(card.name.toLowerCase());
          // General CubeCobra Elo only breaks close ties in this recommendation.
          return { card, score: matches * 3 + (named ? 2 : 0) + (isLand(card) ? (key.length > 2 ? 2 : .4) : 1) +
            Math.max(0, Math.min(1, ((card.rating || 1000) - 1000) / 1000)) };
        }).sort((a, b) => b.score - a.score || a.card.name.localeCompare(b.card.name));
        candidates.push({ key, colors: key.split(""), plan: plan.label, evidence,
          score: plan.score + (evidence ? 4 : 0),
          topCards: ranked.slice(0, 20).map(({ card }) => ({ name: card.name, image: card.image, rating: card.rating })) });
      }
    }
    candidates.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
    // Prefer distinct supported plans over five near-identical variants of a
    // single plan. This is a recommendation order, never a popularity ranking.
    const archetypes = [];
    for (const candidate of candidates) {
      if (!archetypes.some(a => a.plan === candidate.plan || a.key === candidate.key)) archetypes.push(candidate);
      if (archetypes.length === 5) break;
    }
    for (const candidate of candidates) {
      if (archetypes.length === 5) break;
      if (!archetypes.some(a => a.key === candidate.key)) archetypes.push(candidate);
    }
    const reviews = new Map();
    for (const card of cards) {
      const matching = [...archetypes, ...candidates].find(candidate => fits(card, candidate.key) &&
        (rolesByName.get(card.name).some(id => plans.find(p => p.label === candidate.plan).roles.includes(id))));
      const matchedPlan = matching && plans.find(p => p.label === matching.plan);
      const role = roles.find(role => rolesByName.get(card.name).includes(role.id) && matchedPlan?.roles.includes(role.id)) ||
        roles.find(role => rolesByName.get(card.name).includes(role.id));
      const evidence = lines.find(line => line.toLowerCase().includes(card.name.toLowerCase()));
      const note = text(card.notes);
      const parts = [];
      if (note) parts.push(`Cube-Notiz: ${note.slice(0, 320)}`);
      if (evidence) parts.push(`Im Primer: ${evidence.slice(0, 240)}${evidence.length > 240 ? "…" : ""}`);
      if (role) {
        parts.push(`${matching ? `Deckidee ${matching.key} · ${matching.plan}: ` : ""}${role.tip}`);
        const partners = matching?.topCards.filter(other => other.name !== card.name &&
          rolesByName.get(other.name).some(id => plans.find(p => p.label === matching.plan).roles.includes(id))).slice(0, 2);
        if (partners?.length) parts.push(`Passende Karten im Cube: ${partners.map(c => c.name).join(", ")}.`);
      } else if (isLand(card)) {
        parts.push("Plane dieses Land nach den benötigten Manaquellen und seinen Bedingungen ein. Getappte Länder können frühe Spielzüge verzögern.");
      } else if (/creature/i.test(card.typeLine)) {
        parts.push(card.manaValue <= 2 ? "Früher Spielzug für die Kurve. In aggressiven Decks zählen Druck und verlässliches Mana mehr als ein später Splash."
          : card.manaValue >= 5 ? "Besetzt einen teuren Platz in der Kurve. Prüfe, ob dein Deck bis dahin stabilisiert und genug Mana oder Beschleunigung hat."
            : "Prüfe für den Hauptdeck-Platz die Manakurve und die Synergien deines Decks; eine hohe Elo allein macht die Karte hier nicht zum Pflichtpick.");
      } else if (!parts.length) {
        parts.push("Vergleiche diese Karte mit den anderen Optionen für ihre Rolle und Manakosten. Ohne passende Synergien hat ein konsistenter Spielplan Vorrang vor Einzelkarten-Elo.");
      }
      reviews.set(card.name, parts.join(" "));
    }
    return { archetypes, reviews };
  }
  const api = { guide, text };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CubeGuide = api;
})(globalThis);
