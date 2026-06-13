const DRAFTS = [
  { title: "Secrets of Strixhaven", url: "https://draftsim.com/mtg-sos-limited-set-review/", archetypeHint: "sos" },
  { title: "Teenage Mutant Ninja Turtles", url: "https://draftsim.com/mtg-tmt-limited-set-review/", archetypeHint: "generic" },
  { title: "Lorwyn Eclipsed", url: "https://draftsim.com/mtg-ecl-limited-set-review/", archetypeHint: "generic" },
  { title: "Avatar: The Last Airbender", url: "https://draftsim.com/mtg-tla-limited-set-review/", archetypeHint: "generic" },
  { title: "Final Fantasy", url: "https://draftsim.com/mtg-fin-limited-set-review/", archetypeHint: "generic" },
  { title: "Edge of Eternities", url: "https://draftsim.com/mtg-eoe-limited-set-review/", archetypeHint: "generic" },
  { title: "Tarkir: Dragonstorm", url: "https://draftsim.com/mtg-tdm-limited-set-review/", archetypeHint: "generic" },
  { title: "Aetherdrift", url: "https://draftsim.com/mtg-dft-limited-set-review/", archetypeHint: "generic" },
  { title: "Foundations", url: "https://draftsim.com/mtg-fdn-limited-set-review/", archetypeHint: "generic" },
  { title: "Modern Horizons 3", url: "https://draftsim.com/mtg-mh3-limited-set-review/", archetypeHint: "generic" },
  { title: "Murders at Karlov Manor", url: "https://draftsim.com/mtg-mkm-limited-set-review/", archetypeHint: "generic" },
  { title: "Lost Caverns of Ixalan", url: "https://draftsim.com/mtg-lci-limited-set-review/", archetypeHint: "generic" }
];

const COLOR_NAMES = { W: "Weiss", U: "Blau", B: "Schwarz", R: "Rot", G: "Gruen" };

const COLOR_ALIASES = {
  white: "W", weiss: "W",
  blue: "U", blau: "U",
  black: "B", schwarz: "B",
  red: "R", rot: "R",
  green: "G", gruen: "G"
};

const COLOR_PAIR_ORDER = ["WB", "RW", "BG", "UR", "GU", "WU", "UB", "BR", "RG", "GW"];

const COLOR_PAIR_LABELS = {
  WB: "Weiss-Schwarz", RW: "Rot-Weiss", BG: "Schwarz-Gruen", UR: "Blau-Rot", GU: "Gruen-Blau",
  WU: "Weiss-Blau", UB: "Blau-Schwarz", BR: "Schwarz-Rot", RG: "Rot-Gruen", GW: "Gruen-Weiss"
};

const GUILD_NAMES = {
  WU: "Azorius", UB: "Dimir", BR: "Rakdos", RG: "Gruul", GW: "Selesnya",
  WB: "Orzhov", UR: "Izzet", BG: "Golgari", RW: "Boros", GU: "Simic"
};

const KNOWN_ARCHETYPES = {
  sos: [
    { key: "WB", label: "Silverquill - Weiss-Schwarz", colors: ["W", "B"], words: ["silverquill", "inkling", "magecraft"] },
    { key: "RW", label: "Lorehold - Rot-Weiss", colors: ["R", "W"], words: ["lorehold", "spirit", "graveyard"] },
    { key: "BG", label: "Witherbloom - Schwarz-Gruen", colors: ["B", "G"], words: ["witherbloom", "pest", "sacrifice", "life gain", "lifegain"] },
    { key: "UR", label: "Prismari - Blau-Rot", colors: ["U", "R"], words: ["prismari", "treasure", "big spell", "5-mana"] },
    { key: "GU", label: "Quandrix - Gruen-Blau", colors: ["G", "U"], words: ["quandrix", "fractal", "counter", "ramp"] }
  ]
};

const FALLBACK_GROUPS = [
  { key: "W", label: "Weiss", colors: ["W"], words: [] },
  { key: "U", label: "Blau", colors: ["U"], words: [] },
  { key: "B", label: "Schwarz", colors: ["B"], words: [] },
  { key: "R", label: "Rot", colors: ["R"], words: [] },
  { key: "G", label: "Gruen", colors: ["G"], words: [] },
  { key: "artifact", label: "Artefakte", colors: [], words: [] },
  { key: "land", label: "Laender", colors: [], words: [] },
  { key: "unassigned", label: "Nicht eindeutig zugeordnet", colors: [], words: [] }
];

const PROXIES = [
  url => url,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

const els = {
  draftSelect: document.getElementById("draftSelect"),
  loadBtn: document.getElementById("loadBtn"),
  status: document.getElementById("status"),
  progress: document.getElementById("progress"),
  progressLabel: document.getElementById("progressLabel"),
  progressPercent: document.getElementById("progressPercent"),
  progressBar: document.getElementById("progressBar"),
  progressEta: document.getElementById("progressEta"),
  summary: document.getElementById("summary"),
  results: document.getElementById("results"),
  template: document.getElementById("cardTemplate")
};

const scryfallCache = new Map();

let activeController = null;
let isLoading = false;
let loadStartedAt = 0;

function init() {
  els.draftSelect.innerHTML = DRAFTS
    .map((draft, index) => `<option value="${index}">${escapeHtml(draft.title)}</option>`)
    .join("");

  els.loadBtn.addEventListener("click", loadSelectedDraft);
  els.draftSelect.addEventListener("change", resetView);

  resetView();
}

async function loadSelectedDraft() {
  const draft = getSelectedDraft();

  if (isLoading && activeController) {
    activeController.abort();
  }

  activeController = new AbortController();
  isLoading = true;
  loadStartedAt = Date.now();

  try {
    setBusy(true);
    clearOutput();
    showProgress(true);
    updateProgress(1, "Starte Ladevorgang...");
    setStatus(`Lade ${draft.title} von Draftsim...`);

    const html = await fetchDraftsimHtml(draft.url, activeController.signal);
    updateProgress(18, "Draftsim-Artikel geladen. Parse Karten...");

    const cards = parseDraftsimReview(html, draft.url);

    if (!cards.length) {
      throw new Error("Keine Karten mit Draftsim-Rating gefunden.");
    }

    updateProgress(28, `${cards.length} Karten gefunden. Erkenne Archetypen...`);
    const archetypes = detectArchetypes(html, draft);

    updateProgress(35, "Lade Karteninfos und Bilder von Scryfall...");

    await hydrateScryfallInBatches(cards, activeController.signal, percent => {
      updateProgress(35 + percent * 0.45, "Lade Karteninfos und Bilder von Scryfall...");
    });

    updateProgress(82, "Ordne Karten den Archetypen zu...");
    assignGroups(cards, archetypes);
    sortCards(cards, archetypes);

    updateProgress(90, "Bereite Ansicht vor...");
    renderSummary(cards, archetypes, draft.title);

    await renderCardsProgressively(cards, archetypes, percent => {
      updateProgress(90 + percent * 0.09, "Zeichne Kartenansicht...");
    });

    updateProgress(100, "Fertig.");
    setStatus(`${draft.title} geladen.`);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
      updateProgress(100, "Fehler beim Laden.");
      setStatus(`Fehler: ${error.message || error}`, true);
    }
  } finally {
    isLoading = false;
    activeController = null;
    setBusy(false);
  }
}

function getSelectedDraft() {
  return DRAFTS[Number(els.draftSelect.value) || 0];
}

async function fetchDraftsimHtml(url, signal) {
  let lastError;

  for (const makeUrl of PROXIES) {
    const requestUrl = makeUrl(url);

    try {
      const response = await fetch(requestUrl, {
        signal,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const text = await response.text();

      if (!/Rating:\s*\d/i.test(text)) {
        throw new Error("Antwort enthaelt keine Ratings");
      }

      return text;
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      lastError = error;
    }
  }

  throw new Error(
    `Draftsim konnte nicht geladen werden. Wahrscheinlich blockiert CORS oder ein Proxy. Details: ${lastError?.message || lastError}`
  );
}

function parseDraftsimReview(html, sourceUrl) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const content =
    doc.querySelector("article .entry-content") ||
    doc.querySelector(".entry-content") ||
    doc.querySelector("article") ||
    doc.querySelector("main") ||
    doc.body;

  const headings = [...content.querySelectorAll("h3")];

  return headings
    .map(h3 => {
      const nodes = [];
      let next = h3.nextElementSibling;

      while (next && !["H2", "H3"].includes(next.tagName)) {
        nodes.push(next);
        next = next.nextElementSibling;
      }

      const blockText = nodes.map(node => node.textContent || "").join("\n");
      const ratingMatch = blockText.match(/Rating:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/i);

      if (!ratingMatch) {
        return null;
      }

      const paragraphs = nodes
        .flatMap(node => {
          const own = node.matches?.("p") ? [node] : [];
          const nested = [...(node.querySelectorAll?.("p") || [])];
          return [...own, ...nested];
        })
        .map(p => (p.textContent || "").trim())
        .filter(text => text && !/^Rating:/i.test(text));

      const name = cleanCardName(h3.textContent || "");

      return {
        id: slugify(name),
        name,
        rating: Number(ratingMatch[1]),
        review: paragraphs.join("\n\n"),
        section: findPreviousHeading(h3, "H2"),
        sourceUrl,
        image: "",
        imageStatus: "pending",
        colorIdentity: [],
        typeLine: "",
        group: "unassigned",
        groupLabel: "Nicht eindeutig zugeordnet"
      };
    })
    .filter(Boolean);
}

async function hydrateScryfallInBatches(cards, signal, onProgress) {
  const uniqueNames = [...new Set(cards.map(card => card.name))];
  const missingNames = uniqueNames.filter(name => !scryfallCache.has(name));
  const chunks = chunk(missingNames, 75);

  if (!chunks.length) {
    applyScryfallData(cards);
    onProgress?.(100);
    return;
  }

  for (let index = 0; index < chunks.length; index++) {
    const names = chunks[index];

    const response = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identifiers: names.map(name => ({ name }))
      })
    });

    if (!response.ok) {
      throw new Error(`Scryfall konnte nicht geladen werden: ${response.status}`);
    }

    const data = await response.json();

    for (const item of data.data || []) {
      const namesForCache = [cleanCardName(item.name || "")];

      if (item.name && item.name.includes(" // ")) {
        namesForCache.push(...item.name.split(" // ").map(cleanCardName));
      }

      for (const name of namesForCache) {
        scryfallCache.set(name, scryfallInfo(item));
      }
    }

    for (const item of data.not_found || []) {
      const name = cleanCardName(item.name || "");

      scryfallCache.set(name, {
        image: "",
        status: "missing",
        colorIdentity: [],
        typeLine: ""
      });
    }

    onProgress?.(((index + 1) / chunks.length) * 100);
    await nextFrame();
  }

  applyScryfallData(cards);
}

function applyScryfallData(cards) {
  for (const card of cards) {
    const data =
      scryfallCache.get(card.name) ||
      {
        image: "",
        status: "missing",
        colorIdentity: [],
        typeLine: ""
      };

    card.image = data.image;
    card.imageStatus = data.status;
    card.colorIdentity = data.colorIdentity;
    card.typeLine = data.typeLine;
  }
}

function scryfallInfo(card) {
  return {
    image:
      card.image_uris?.normal ||
      card.card_faces?.[0]?.image_uris?.normal ||
      card.image_uris?.large ||
      card.card_faces?.[0]?.image_uris?.large ||
      "",
    status: card.image_status || "ok",
    colorIdentity: normalizeColors(card.color_identity || []),
    typeLine: card.type_line || ""
  };
}

function detectArchetypes(html, draft) {
  const detected = detectArchetypesFromArticle(html);

  if (detected.length >= 3) {
    return detected;
  }

  if (KNOWN_ARCHETYPES[draft.archetypeHint]) {
    return KNOWN_ARCHETYPES[draft.archetypeHint];
  }

  return COLOR_PAIR_ORDER.map(key => ({
    key,
    label: `${GUILD_NAMES[key]} - ${COLOR_PAIR_LABELS[key]}`,
    colors: key.split(""),
    words: [
      GUILD_NAMES[key].toLowerCase(),
      COLOR_PAIR_LABELS[key].toLowerCase()
    ]
  }));
}

function detectArchetypesFromArticle(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const content =
    doc.querySelector("article .entry-content") ||
    doc.querySelector(".entry-content") ||
    doc.body;

  const headings = [...content.querySelectorAll("h2, h3, h4")]
    .map(h => (h.textContent || "").trim())
    .filter(Boolean);

  const intro = (content.textContent || "").slice(0, 18000);

  const lines = [...headings, ...intro.split("\n")]
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const out = [];

  for (const line of lines) {
    const withGuild = line.match(
      /\b(Azorius|Dimir|Rakdos|Gruul|Selesnya|Orzhov|Izzet|Golgari|Boros|Simic|Silverquill|Lorehold|Witherbloom|Prismari|Quandrix)\b(?:\s*[-:–]\s*|\s+)(.{0,90})/i
    );

    if (withGuild) {
      const name = titleCase(withGuild[1]);
      const rest = withGuild[2].trim();
      const colors = colorsForName(name) || parseColors(rest);

      if (colors.length >= 2) {
        addArchetype(out, {
          key: canonicalColorKey(colors),
          label: `${name} - ${colors.map(c => COLOR_NAMES[c]).join("-")}${rest ? `: ${trimTheme(rest)}` : ""}`,
          colors,
          words: keywords(`${name} ${rest}`)
        });
      }
    }

    const withColors = line.match(
      /\b(W\/U|U\/B|B\/R|R\/G|G\/W|W\/B|U\/R|B\/G|R\/W|G\/U|WU|UB|BR|RG|GW|WB|UR|BG|RW|GU)\b\s*[-:–]?\s*(.{4,90})/i
    );

    if (withColors) {
      const colors = parseColors(withColors[1]);
      const key = canonicalColorKey(colors);

      if (colors.length >= 2) {
        addArchetype(out, {
          key,
          label: `${GUILD_NAMES[key] || key} - ${COLOR_PAIR_LABELS[key] || key}: ${trimTheme(withColors[2])}`,
          colors,
          words: keywords(withColors[2])
        });
      }
    }
  }

  return out.slice(0, 10);
}

function addArchetype(list, archetype) {
  if (!list.some(item => item.key === archetype.key)) {
    list.push(archetype);
  }
}

function assignGroups(cards, archetypes) {
  for (const card of cards) {
    const haystack = `${card.name} ${card.section} ${card.review}`.toLowerCase();

    const keywordMatch = archetypes
      .map(archetype => ({
        ...archetype,
        score: (archetype.words || []).reduce((sum, word) => {
          return sum + (word && haystack.includes(String(word).toLowerCase()) ? 1 : 0);
        }, 0)
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (keywordMatch && keywordMatch.score > 0) {
      card.group = keywordMatch.key;
      card.groupLabel = keywordMatch.label;
      continue;
    }

    const colorMatch = archetypes.find(archetype => {
      return sameColors(archetype.colors, card.colorIdentity) && card.colorIdentity.length > 1;
    });

    if (colorMatch) {
      card.group = colorMatch.key;
      card.groupLabel = colorMatch.label;
      continue;
    }

    const fallback = fallbackGroup(card);
    card.group = fallback.key;
    card.groupLabel = fallback.label;
  }
}

function sortCards(cards, archetypes) {
  const order = [
    ...archetypes.map(archetype => archetype.key),
    ...FALLBACK_GROUPS.map(group => group.key)
  ];

  const rank = new Map(order.map((key, index) => [key, index]));

  cards.sort((a, b) => {
    const groupDiff = (rank.get(a.group) ?? 999) - (rank.get(b.group) ?? 999);

    if (groupDiff) {
      return groupDiff;
    }

    const ratingDiff = b.rating - a.rating;

    if (ratingDiff) {
      return ratingDiff;
    }

    return a.name.localeCompare(b.name);
  });
}

function renderSummary(cards, archetypes, draftTitle) {
  const average = cards.reduce((sum, card) => sum + card.rating, 0) / cards.length;
  const top = [...cards].sort((a, b) => b.rating - a.rating)[0];
  const groupCount = new Set(cards.map(card => card.groupLabel)).size;

  els.summary.innerHTML = [
    draftTitle,
    `${cards.length} Karten`,
    `${groupCount} Gruppen`,
    `Durchschnitt ${average.toFixed(2)}/10`,
    `Top: ${top.name} (${top.rating}/10)`
  ]
    .map(text => `<div class="pill">${escapeHtml(text)}</div>`)
    .join("");
}

async function renderCardsProgressively(cards, archetypes, onProgress) {
  els.results.innerHTML = "";

  const groups = groupCards(cards, archetypes);
  const totalCards = cards.length || 1;
  let renderedCards = 0;

  for (const group of groups) {
    const average = group.cards.reduce((sum, card) => sum + card.rating, 0) / group.cards.length;

    const title = document.createElement("section");
    title.className = `group-title group-${cssKey(group.key)}`;
    title.innerHTML = `<h2>${escapeHtml(group.label)} (${group.cards.length})</h2><p>Durchschnitt ${average.toFixed(2)}/10</p>`;
    els.results.appendChild(title);

    const fragment = document.createDocumentFragment();

    for (const card of group.cards) {
      fragment.appendChild(createCardElement(card));
      renderedCards++;

      if (renderedCards % 25 === 0) {
        els.results.appendChild(fragment);
        onProgress?.((renderedCards / totalCards) * 100);
        await nextFrame();
      }
    }

    els.results.appendChild(fragment);
    onProgress?.((renderedCards / totalCards) * 100);
    await nextFrame();
  }
}

function createCardElement(card) {
  const node = els.template.content.firstElementChild.cloneNode(true);

  node.classList.add(`group-${cssKey(card.group)}`);
  node.querySelector(".card-topline").textContent = card.section || card.groupLabel;
  node.querySelector("h3").textContent = card.name;
  node.querySelector(".rating").textContent = `${card.rating}/10`;
  node.querySelector(".review").textContent = card.review;

  const imageWrap = node.querySelector(".image-wrap");

  if (card.image) {
    imageWrap.innerHTML = "";

    const img = document.createElement("img");
    img.src = card.image;
    img.alt = card.name;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      imageWrap.innerHTML = `<div class="missing-img">Kein Bild gefunden</div>`;
    };

    imageWrap.appendChild(img);
  } else {
    imageWrap.innerHTML = `<div class="missing-img">Kein Bild gefunden</div>`;
  }

  return node;
}

function groupCards(cards, archetypes) {
  const order = [...archetypes, ...FALLBACK_GROUPS];
  const map = new Map();

  for (const card of cards) {
    if (!map.has(card.group)) {
      map.set(card.group, {
        key: card.group,
        label: card.groupLabel,
        cards: []
      });
    }

    map.get(card.group).cards.push(card);
  }

  const groups = [];

  for (const item of order) {
    if (map.has(item.key)) {
      groups.push(map.get(item.key));
    }
  }

  for (const item of map.values()) {
    if (!groups.some(group => group.key === item.key)) {
      groups.push(item);
    }
  }

  return groups;
}

function fallbackGroup(card) {
  if (/land/i.test(card.typeLine || card.section)) {
    return {
      key: "land",
      label: "Laender"
    };
  }

  if (/artifact/i.test(card.typeLine || card.section)) {
    return {
      key: "artifact",
      label: "Artefakte"
    };
  }

  if (card.colorIdentity.length === 1) {
    return {
      key: card.colorIdentity[0],
      label: COLOR_NAMES[card.colorIdentity[0]] || card.colorIdentity[0]
    };
  }

  if (card.colorIdentity.length > 1) {
    const key = canonicalColorKey(card.colorIdentity);

    return {
      key,
      label: `${GUILD_NAMES[key] || key} - ${COLOR_PAIR_LABELS[key] || "Mehrfarbig"}`
    };
  }

  return {
    key: "unassigned",
    label: "Nicht eindeutig zugeordnet"
  };
}

function colorsForName(name) {
  const map = {
    azorius: ["W", "U"],
    dimir: ["U", "B"],
    rakdos: ["B", "R"],
    gruul: ["R", "G"],
    selesnya: ["G", "W"],
    orzhov: ["W", "B"],
    izzet: ["U", "R"],
    golgari: ["B", "G"],
    boros: ["R", "W"],
    simic: ["G", "U"],
    silverquill: ["W", "B"],
    lorehold: ["R", "W"],
    witherbloom: ["B", "G"],
    prismari: ["U", "R"],
    quandrix: ["G", "U"]
  };

  return map[String(name).toLowerCase()] || null;
}

function parseColors(text) {
  const out = [];

  for (const token of String(text).replace(/[()]/g, " ").split(/[\s/+,&-]+/).filter(Boolean)) {
    const lower = token.toLowerCase();

    if (COLOR_ALIASES[lower]) {
      out.push(COLOR_ALIASES[lower]);
    } else if (/^[wubrg]$/i.test(token)) {
      out.push(token.toUpperCase());
    }
  }

  return normalizeColors(out);
}

function normalizeColors(colors) {
  const order = ["W", "U", "B", "R", "G"];

  const set = new Set(
    (colors || [])
      .map(color => String(color).toUpperCase())
      .filter(color => order.includes(color))
  );

  return order.filter(color => set.has(color));
}

function canonicalColorKey(colors) {
  return normalizeColors(colors).join("") || "C";
}

function sameColors(a, b) {
  return canonicalColorKey(a) === canonicalColorKey(b);
}

function keywords(text) {
  const stop = new Set([
    "white",
    "blue",
    "black",
    "red",
    "green",
    "weiss",
    "blau",
    "schwarz",
    "rot",
    "gruen",
    "and",
    "with",
    "the",
    "archetype"
  ]);

  return [
    ...new Set(
      String(text)
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter(word => word.length >= 4 && !stop.has(word))
    )
  ].slice(0, 10);
}

function cleanCardName(name) {
  return String(name)
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*Illustration by.*$/i, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function findPreviousHeading(element, tagName) {
  let current = element.previousElementSibling;

  while (current) {
    if (current.tagName === tagName) {
      return (current.textContent || "").trim();
    }

    current = current.previousElementSibling;
  }

  return "";
}

function trimTheme(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/^[\-:–]+\s*/, "")
    .slice(0, 80)
    .trim();
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function clearOutput() {
  els.summary.innerHTML = "";
  els.results.innerHTML = "";
}

function resetView() {
  clearOutput();
  showProgress(false);
  setStatus("Draft auswählen und auf Laden klicken.");
}

function setStatus(message, isError = false) {
  els.status.textContent = message || "";
  els.status.classList.toggle("error", Boolean(isError));
}

function setBusy(isBusy) {
  els.loadBtn.disabled = isBusy;
  els.draftSelect.disabled = isBusy;
  els.loadBtn.textContent = isBusy ? "Lädt..." : "Laden";
}

function showProgress(show) {
  els.progress.hidden = !show;

  if (!show) {
    els.progressBar.style.width = "0%";
    els.progressPercent.textContent = "0%";
    els.progressLabel.textContent = "";
    els.progressEta.textContent = "";
  }
}

function updateProgress(value, label) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));

  els.progressBar.style.width = `${percent}%`;
  els.progressPercent.textContent = `${percent}%`;
  els.progressLabel.textContent = label || "Lade...";

  if (!loadStartedAt || percent <= 5 || percent >= 100) {
    els.progressEta.textContent = percent >= 100 ? "Fertig." : "";
    return;
  }

  const elapsedSeconds = (Date.now() - loadStartedAt) / 1000;
  const estimatedTotal = elapsedSeconds / (percent / 100);
  const remainingSeconds = Math.max(0, estimatedTotal - elapsedSeconds);

  els.progressEta.textContent = `Bisher ${formatSeconds(elapsedSeconds)} · grob noch ${formatSeconds(remainingSeconds)}`;
}

function formatSeconds(seconds) {
  if (seconds < 1) {
    return "<1s";
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = Math.ceil(seconds % 60);

  return `${minutes}m ${rest}s`;
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function cssKey(value) {
  return String(value || "other").replace(/[^a-z0-9]/gi, "-");
}

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    Math.random().toString(36).slice(2)
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function titleCase(value) {
  return String(value).replace(/\w\S*/g, token => {
    return token[0].toUpperCase() + token.slice(1).toLowerCase();
  });
}

init();
