const DEFAULT_PROXY = "https://api.allorigins.win/raw?url=";
const COLOR_NAMES_DE = { W: "Weiss", U: "Blau", B: "Schwarz", R: "Rot", G: "Gruen", C: "Farblos" };
const COLOR_NAME_TO_CODE = {
  white: "W", weiss: "W", blue: "U", blau: "U", black: "B", schwarz: "B", red: "R", rot: "R", green: "G", gruen: "G", green: "G"
};
const COLOR_PAIR_LABELS_DE = {
  WU: "Azorius - Weiss-Blau",
  UB: "Dimir - Blau-Schwarz",
  BR: "Rakdos - Schwarz-Rot",
  RG: "Gruul - Rot-Gruen",
  GW: "Selesnya - Gruen-Weiss",
  WB: "Orzhov - Weiss-Schwarz",
  UR: "Izzet - Blau-Rot",
  BG: "Golgari - Schwarz-Gruen",
  RW: "Boros - Rot-Weiss",
  GU: "Simic - Gruen-Blau"
};
const COLOR_PAIR_ORDER = ["WU", "UB", "BR", "RG", "GW", "WB", "UR", "BG", "RW", "GU"];
const MONO_AND_OTHER_GROUPS = [
  { key: "W", label: "Weiss", colors: ["W"], words: ["white"] },
  { key: "U", label: "Blau", colors: ["U"], words: ["blue"] },
  { key: "B", label: "Schwarz", colors: ["B"], words: ["black"] },
  { key: "R", label: "Rot", colors: ["R"], words: ["red"] },
  { key: "G", label: "Gruen", colors: ["G"], words: ["green"] },
  { key: "artifact", label: "Artefakte", colors: [], words: ["artifact", "artifacts"] },
  { key: "land", label: "Laender", colors: [], words: ["land", "lands"] },
  { key: "unassigned", label: "Nicht eindeutig zugeordnet", colors: [], words: [] }
];

const ARCHETYPE_PRESETS = {
  sos: {
    label: "Secrets of Strixhaven",
    archetypes: [
      { key: "WB", label: "Silverquill - Weiss-Schwarz", colors: ["W", "B"], words: ["silverquill", "inkling", "magecraft", "combat trick", "aggressive", "flyer", "flying"] },
      { key: "RW", label: "Lorehold - Rot-Weiss", colors: ["R", "W"], words: ["lorehold", "spirit", "graveyard", "leaves your graveyard", "excavate"] },
      { key: "BG", label: "Witherbloom - Schwarz-Gruen", colors: ["B", "G"], words: ["witherbloom", "pest", "sacrifice", "lifegain", "life gain", "drain", "gain life"] },
      { key: "UR", label: "Prismari - Blau-Rot", colors: ["U", "R"], words: ["prismari", "treasure", "big spell", "expensive spell", "mana value 5", "five-mana", "5-mana"] },
      { key: "GU", label: "Quandrix - Gruen-Blau", colors: ["G", "U"], words: ["quandrix", "fractal", "+1/+1 counter", "counters", "ramp", "token"] }
    ]
  },
  tmt: {
    label: "Teenage Mutant Ninja Turtles",
    archetypes: [
      { key: "WB", label: "Orzhov - Weiss-Schwarz: Ninjas/Sneak", colors: ["W", "B"], words: ["orzhov", "ninja", "ninjas", "sneak", "evasive"] },
      { key: "BG", label: "Golgari - Schwarz-Gruen: Food/Disappear", colors: ["B", "G"], words: ["golgari", "food", "disappear", "sacrifice"] },
      { key: "GU", label: "Simic - Gruen-Blau: Mutants/Mutagen", colors: ["G", "U"], words: ["simic", "mutant", "mutants", "mutagen"] },
      { key: "UR", label: "Izzet - Blau-Rot: Artifacts", colors: ["U", "R"], words: ["izzet", "artifact", "artifacts", "token"] },
      { key: "RW", label: "Boros - Rot-Weiss: Alliance/Go-Wide", colors: ["R", "W"], words: ["boros", "alliance", "go-wide", "go wide", "aggro"] }
    ]
  },
  generic: {
    label: "Generische 2-Farb-Archetypen",
    archetypes: COLOR_PAIR_ORDER.map(key => ({ key, label: COLOR_PAIR_LABELS_DE[key], colors: key.split(""), words: [] }))
  }
};

const DRAFT_CATALOG = [
  { title: "Secrets of Strixhaven", set: "sos", url: "https://draftsim.com/mtg-sos-limited-set-review/", preset: "sos", note: "Schulen/Farbpaare" },
  { title: "Teenage Mutant Ninja Turtles", set: "tmt", url: "https://draftsim.com/mtg-tmt-limited-set-review/", preset: "tmt", note: "5 Pick-Two-Archetypen" },
  { title: "Lorwyn Eclipsed", set: "ecl", url: "https://draftsim.com/mtg-ecl-limited-set-review/", preset: "generic", note: "Archetypen werden aus Draftsim erkannt, sonst 2-Farb-Fallback" },
  { title: "Avatar: The Last Airbender", set: "tla", url: "https://draftsim.com/mtg-tla-limited-set-review/", preset: "generic", note: "Archetypen werden aus Draftsim erkannt, sonst 2-Farb-Fallback" },
  { title: "Final Fantasy", set: "fin", url: "https://draftsim.com/mtg-fin-limited-set-review/", preset: "generic", note: "Archetypen werden aus Draftsim erkannt, sonst 2-Farb-Fallback" },
  { title: "Edge of Eternities", set: "eoe", url: "https://draftsim.com/mtg-eoe-limited-set-review/", preset: "generic", note: "Archetypen werden aus Draftsim erkannt, sonst 2-Farb-Fallback" },
  { title: "Tarkir: Dragonstorm", set: "tdm", url: "https://draftsim.com/mtg-tdm-limited-set-review/", preset: "generic", note: "Archetypen werden aus Draftsim erkannt, sonst 2-Farb-Fallback" },
  { title: "Aetherdrift", set: "dft", url: "https://draftsim.com/mtg-dft-limited-set-review/", preset: "generic", note: "Archetypen werden aus Draftsim erkannt, sonst 2-Farb-Fallback" },
  { title: "Foundations", set: "fdn", url: "https://draftsim.com/mtg-fdn-limited-set-review/", preset: "generic", note: "2-Farb-Fallback" },
  { title: "Modern Horizons 3", set: "mh3", url: "https://draftsim.com/mtg-mh3-limited-set-review/", preset: "generic", note: "2-Farb-Fallback" },
  { title: "Murders at Karlov Manor", set: "mkm", url: "https://draftsim.com/mtg-mkm-limited-set-review/", preset: "generic", note: "2-Farb-Fallback" },
  { title: "Lost Caverns of Ixalan", set: "lci", url: "https://draftsim.com/mtg-lci-limited-set-review/", preset: "generic", note: "2-Farb-Fallback" }
];

const els = {
  draftSelect: document.getElementById("draftSelect"), suggestedDraft: document.getElementById("suggestedDraft"),
  urlInput: document.getElementById("urlInput"), setInput: document.getElementById("setInput"), proxyInput: document.getElementById("proxyInput"), htmlInput: document.getElementById("htmlInput"),
  sortMode: document.getElementById("sortMode"), groupMode: document.getElementById("groupMode"), archetypeConfig: document.getElementById("archetypeConfig"), autoArchetypes: document.getElementById("autoArchetypes"),
  loadBtn: document.getElementById("loadBtn"), demoBtn: document.getElementById("demoBtn"), presetBtn: document.getElementById("presetBtn"), exportBtn: document.getElementById("exportBtn"),
  status: document.getElementById("status"), summary: document.getElementById("summary"), results: document.getElementById("results"), template: document.getElementById("cardTemplate")
};

let loadedCards = [];
let activeArchetypes = [];
const imageCache = new Map();

function init() {
  populateDraftSelect();
  const suggestion = pickSuggestion();
  applySuggestion(suggestion, false);
  els.proxyInput.value = DEFAULT_PROXY;
  els.draftSelect.addEventListener("change", () => {
    const selected = DRAFT_CATALOG.find(d => draftKey(d) === els.draftSelect.value) || pickSuggestion();
    applySuggestion(selected);
  });
  els.suggestedDraft.addEventListener("click", () => applySuggestion(pickSuggestion()));
  els.demoBtn.addEventListener("click", () => applySuggestion(pickSuggestion()));
  els.presetBtn.addEventListener("click", () => applyArchetypePreset(currentPresetKey()));
  els.loadBtn.addEventListener("click", loadReview);
  els.exportBtn.addEventListener("click", exportJson);
  els.urlInput.addEventListener("change", () => {
    const inferred = inferSetCode(els.urlInput.value);
    if (inferred) {
      els.setInput.value = inferred;
      const match = DRAFT_CATALOG.find(d => d.set === inferred);
      if (match) els.draftSelect.value = draftKey(match);
      applyArchetypePreset(currentPresetKey());
    }
  });
  els.setInput.addEventListener("change", () => applyArchetypePreset(currentPresetKey()));
}

function populateDraftSelect() {
  els.draftSelect.innerHTML = DRAFT_CATALOG.map(d => `<option value="${escapeHtml(draftKey(d))}">${escapeHtml(d.title)} (${escapeHtml(d.set.toUpperCase())})</option>`).join("");
}
function draftKey(d) { return `${d.set}|${d.url}`; }
function pickSuggestion() { return DRAFT_CATALOG[0]; }
function currentSetCode() { return (els.setInput.value.trim() || inferSetCode(els.urlInput.value) || "generic").toLowerCase(); }
function currentPresetKey() {
  const set = currentSetCode();
  const selected = DRAFT_CATALOG.find(d => d.set === set || d.url === els.urlInput.value.trim());
  return selected?.preset || set;
}
function applySuggestion(suggestion, announce = true) {
  els.draftSelect.value = draftKey(suggestion);
  els.suggestedDraft.textContent = `${suggestion.title} (${suggestion.set.toUpperCase()})`;
  els.urlInput.value = suggestion.url;
  els.setInput.value = suggestion.set;
  applyArchetypePreset(suggestion.preset || suggestion.set);
  if (announce) setStatus(`Draft eingesetzt: ${suggestion.title}. Klick auf "Review laden".`);
}
function applyArchetypePreset(presetKey) {
  const preset = ARCHETYPE_PRESETS[presetKey] || ARCHETYPE_PRESETS.generic;
  els.archetypeConfig.value = JSON.stringify(preset.archetypes, null, 2);
  setStatus(`Preset geladen: ${preset.label}. Beim Laden werden Draftsim-Archetypen automatisch bevorzugt, wenn sie auf der Seite erkennbar sind.`);
}
function getPreset(presetKey) { return ARCHETYPE_PRESETS[presetKey] || ARCHETYPE_PRESETS.generic; }
function setStatus(text, isError = false) { els.status.textContent = text || ""; els.status.classList.toggle("error", Boolean(isError)); }
function inferSetCode(url) { const m = String(url || "").match(/mtg-([a-z0-9]+)-limited-set-review/i); return m ? m[1].toLowerCase() : ""; }

async function loadReview() {
  try {
    setStatus("Lade Draftsim Review...");
    els.loadBtn.disabled = true; els.exportBtn.disabled = true; els.results.innerHTML = ""; els.summary.innerHTML = "";
    const url = els.urlInput.value.trim();
    const pastedHtml = els.htmlInput.value.trim();
    const setCode = currentSetCode();
    const html = pastedHtml || await fetchDraftsimHtml(url);
    const parsed = parseDraftsim(html, url);
    const manualArchetypes = readArchetypeConfig();
    const detectedArchetypes = detectArchetypesFromHtml(html);
    activeArchetypes = els.autoArchetypes.checked && detectedArchetypes.length >= 3 ? detectedArchetypes : manualArchetypes;
    if (els.autoArchetypes.checked && detectedArchetypes.length >= 3) {
      els.archetypeConfig.value = JSON.stringify(detectedArchetypes, null, 2);
    }
    if (!parsed.length) throw new Error("Ich konnte keine Karten mit Rating finden. Pruefe die URL oder fuege den Seitenquelltext im Fallback-Feld ein.");
    loadedCards = parsed.map(card => ({ ...card, setCode }));
    setStatus(`${loadedCards.length} Karten gefunden. Lade Scryfall-Daten und Bilder...`);
    await hydrateCardsFromScryfall(loadedCards, setCode);
    assignArchetypeGroups(loadedCards, activeArchetypes);
    sortCards(loadedCards, activeArchetypes);
    renderCards(loadedCards, activeArchetypes);
    renderSummary(loadedCards, activeArchetypes, detectedArchetypes.length);
    els.exportBtn.disabled = false;
    setStatus(`${loadedCards.length} Karten geladen. Gruppiert nach ${activeArchetypes.length} Archetypen/Farbkombos und innerhalb davon nach Rating.`);
  } catch (err) { console.error(err); setStatus(err.message || String(err), true); }
  finally { els.loadBtn.disabled = false; }
}

function readArchetypeConfig() {
  try {
    const parsed = JSON.parse(els.archetypeConfig.value || "[]");
    if (!Array.isArray(parsed) || !parsed.length) throw new Error("Die Archetyp-Konfiguration muss eine JSON-Liste sein.");
    return parsed.map(a => normalizeArchetype(a));
  } catch (err) { throw new Error(`Archetyp-JSON ist ungueltig: ${err.message}`); }
}
function normalizeArchetype(a) {
  const colors = normalizeColors(a.colors || []);
  return { key: String(a.key || canonicalColorKey(colors) || slugify(a.label || "archetype")), label: String(a.label || a.key || "Archetyp"), colors, words: Array.isArray(a.words) ? a.words.map(String) : [] };
}
async function fetchDraftsimHtml(url) {
  if (!url) throw new Error("Bitte eine Draftsim-URL eingeben.");
  const attempts = [url];
  const proxy = els.proxyInput.value.trim();
  if (proxy) attempts.push(proxy + encodeURIComponent(url));
  let lastErr;
  for (const attempt of attempts) {
    try { const res = await fetch(attempt, { cache: "no-store" }); if (!res.ok) throw new Error(`${res.status} ${res.statusText}`); return await res.text(); }
    catch (err) { lastErr = err; }
  }
  throw new Error(`Draftsim konnte nicht geladen werden. Nutze den HTML-Fallback. Details: ${lastErr?.message || lastErr}`);
}

function parseDraftsim(html, sourceUrl) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const content = doc.querySelector("article .entry-content") || doc.querySelector(".entry-content") || doc.querySelector("article") || doc.querySelector("main") || doc.body;
  const headings = [...content.querySelectorAll("h3")];
  return headings.map(h3 => {
    const nodes = []; let el = h3.nextElementSibling;
    while (el && !["H2", "H3"].includes(el.tagName)) { nodes.push(el); el = el.nextElementSibling; }
    const blockText = nodes.map(n => n.innerText || n.textContent || "").join("\n");
    const ratingMatch = blockText.match(/Rating:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/i);
    if (!ratingMatch) return null;
    const paragraphs = nodes.flatMap(n => {
      const own = n.matches?.("p") ? [n] : [];
      const nested = [...(n.querySelectorAll?.("p") || [])];
      return [...own, ...nested];
    }).map(p => (p.innerText || p.textContent || "").trim()).filter(t => t && !/^Rating:/i.test(t));
    const name = cleanCardName(h3.textContent || "");
    return { id: slugify(name), name, rating: Number(ratingMatch[1]), review: paragraphs.join("\n\n"), section: getSectionName(h3), sourceUrl, group: "unassigned", groupLabel: "Nicht eindeutig zugeordnet", image: "", imageStatus: "pending", scryfall: null, colorIdentity: [], cardType: "" };
  }).filter(Boolean);
}
function cleanCardName(name) { return String(name).replace(/\s+/g, " ").replace(/\s*\|\s*Illustration by.*$/i, "").trim(); }
function getSectionName(h3) { let el = h3.previousElementSibling; while (el) { if (el.tagName === "H2") return (el.textContent || "").trim(); el = el.previousElementSibling; } return ""; }

function detectArchetypesFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const content = doc.querySelector("article .entry-content") || doc.querySelector(".entry-content") || doc.body;
  const text = (content.innerText || content.textContent || "").replace(/\r/g, "");
  const beforeCards = text.split(/\n\s*[^\n]{2,80}\s*\n\s*Rating:\s*\d/i)[0] || text.slice(0, 12000);
  const archetypeTerms = "azorius|dimir|rakdos|gruul|selesnya|orzhov|izzet|golgari|boros|simic|jeskai|sultai|mardu|temur|abzan|bant|esper|grixis|jund|naya|silverquill|lorehold|witherbloom|prismari|quandrix";
  const lines = beforeCards.split("\n").map(s => s.trim()).filter(Boolean);
  const found = [];
  for (const line of lines) {
    const colorMatch = line.match(new RegExp(`\\b(${archetypeTerms})\\b\\s*\\(([^)]*(?:White|Blue|Black|Red|Green|Weiss|Blau|Schwarz|Rot|Gruen)[^)]*)\\)\\s*:?[\\s-]*(.*)$`, "i"));
    if (colorMatch) {
      const name = titleCase(colorMatch[1]);
      const colors = parseColors(colorMatch[2]);
      if (colors.length >= 2) {
        const theme = colorMatch[3].replace(/\s+/g, " ").trim();
        found.push({ key: canonicalColorKey(colors), label: `${name} - ${colors.map(c => COLOR_NAMES_DE[c]).join("-")}${theme ? `: ${theme}` : ""}`, colors, words: keywordsFromText(`${name} ${theme}`) });
      }
      continue;
    }
    const simple = line.match(/^(W\/U|U\/B|B\/R|R\/G|G\/W|W\/B|U\/R|B\/G|R\/W|G\/U|WU|UB|BR|RG|GW|WB|UR|BG|RW|GU)\s*:?[\s-]*(.+)$/i);
    if (simple) {
      const colors = parseColors(simple[1]);
      const theme = simple[2].trim();
      found.push({ key: canonicalColorKey(colors), label: `${COLOR_PAIR_LABELS_DE[canonicalColorKey(colors)] || canonicalColorKey(colors)}: ${theme}`, colors, words: keywordsFromText(theme) });
    }
  }
  const dedup = [];
  const seen = new Set();
  for (const a of found) {
    const k = a.key + "|" + a.label;
    if (!seen.has(k)) { seen.add(k); dedup.push(a); }
  }
  return dedup.slice(0, 12);
}
function parseColors(text) {
  const out = [];
  const tokens = String(text).replace(/[()]/g, " ").split(/[\/,+&\s-]+/).filter(Boolean);
  for (const token of tokens) {
    const t = token.toLowerCase();
    if (COLOR_NAME_TO_CODE[t]) out.push(COLOR_NAME_TO_CODE[t]);
    else if (/^[wubrg]$/i.test(token)) out.push(token.toUpperCase());
  }
  return normalizeColors(out);
}
function keywordsFromText(text) {
  const stop = new Set(["and", "the", "with", "white", "blue", "black", "red", "green", "weiss", "blau", "schwarz", "rot", "gruen"]);
  return [...new Set(String(text).toLowerCase().split(/[^a-z0-9+\/]+/).filter(w => w.length >= 4 && !stop.has(w)))].slice(0, 12);
}

async function hydrateCardsFromScryfall(cards, setCode) {
  const queue = [...cards];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const card = queue.shift();
      try { const data = await findScryfallCard(card.name, setCode); card.scryfall = data.raw || null; card.image = data.imageUrl; card.imageStatus = data.status; card.colorIdentity = normalizeColors(data.colorIdentity || []); card.cardType = data.typeLine || ""; }
      catch (_) { card.imageStatus = "failed"; }
      await sleep(80);
    }
  });
  await Promise.all(workers);
}
async function findScryfallCard(name, setCode) {
  const cacheKey = `${name}|${setCode}`; if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);
  const urls = [];
  if (setCode) urls.push(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&set=${encodeURIComponent(setCode)}`);
  urls.push(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
  if (setCode) urls.push(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}&set=${encodeURIComponent(setCode)}`);
  urls.push(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
  for (const url of urls) {
    try { const res = await fetch(url); if (!res.ok) continue; const data = await res.json();
      const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal || data.image_uris?.large || data.card_faces?.[0]?.image_uris?.large || "";
      const out = { raw: data, imageUrl, status: data.image_status || "ok", colorIdentity: data.color_identity || [], typeLine: data.type_line || "" };
      imageCache.set(cacheKey, out); return out;
    } catch (_) {}
  }
  const out = { raw: null, imageUrl: "", status: "missing", colorIdentity: [], typeLine: "" }; imageCache.set(cacheKey, out); return out;
}

function assignArchetypeGroups(cards, archetypes) {
  const mode = els.groupMode.value;
  for (const card of cards) {
    const candidates = scoreArchetypes(card, archetypes); card.matches = candidates;
    const exactColor = archetypes.find(a => sameColors(a.colors, card.colorIdentity) && card.colorIdentity.length > 1);
    if (mode === "strict-color" && exactColor) { card.group = exactColor.key; card.groupLabel = exactColor.label; continue; }
    const bestKeyword = candidates.find(c => c.keywordScore > 0);
    if (bestKeyword) { card.group = bestKeyword.key; card.groupLabel = bestKeyword.label; continue; }
    if (exactColor) { card.group = exactColor.key; card.groupLabel = exactColor.label; continue; }
    const fallback = fallbackGroup(card); card.group = fallback.key; card.groupLabel = fallback.label;
  }
}
function scoreArchetypes(card, archetypes) {
  const haystack = `${card.name} ${card.section} ${card.review}`.toLowerCase();
  return archetypes.map(a => { const keywordScore = a.words.reduce((score, word) => score + (word && haystack.includes(String(word).toLowerCase()) ? 10 : 0), 0); const colorScore = colorCompatibilityScore(card.colorIdentity, a.colors); const exact = sameColors(card.colorIdentity, a.colors) ? 20 : 0; return { ...a, score: keywordScore + colorScore + exact, keywordScore, colorScore, exact }; }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}
function colorCompatibilityScore(cardColors, archetypeColors) { const c = normalizeColors(cardColors); const a = normalizeColors(archetypeColors); if (!c.length || !a.length) return 0; if (c.every(color => a.includes(color))) return c.length === a.length ? 20 : 2; return c.filter(color => a.includes(color)).length; }
function fallbackGroup(card) { if (/land/i.test(card.cardType || card.section)) return { key: "land", label: "Laender" }; if (/artifact/i.test(card.cardType || card.section)) return { key: "artifact", label: "Artefakte" }; if (card.colorIdentity.length === 1) return { key: card.colorIdentity[0], label: COLOR_NAMES_DE[card.colorIdentity[0]] || card.colorIdentity[0] }; if (card.colorIdentity.length > 1) { const key = canonicalColorKey(card.colorIdentity); return { key, label: COLOR_PAIR_LABELS_DE[key] || `${key} - Mehrfarbig` }; } return { key: "unassigned", label: "Nicht eindeutig zugeordnet" }; }
function sortCards(cards, archetypes) { const mode = els.sortMode.value; const order = [...archetypes.map(a => a.key), ...MONO_AND_OTHER_GROUPS.map(g => g.key)]; const rank = new Map(order.map((key, i) => [key, i])); cards.sort((a, b) => { if (mode === "rating") return (b.rating - a.rating) || a.name.localeCompare(b.name); if (mode === "name") return a.name.localeCompare(b.name); return (rank.get(a.group) ?? 999) - (rank.get(b.group) ?? 999) || (b.rating - a.rating) || a.name.localeCompare(b.name); }); }
function renderSummary(cards, archetypes, detectedCount) { const average = cards.reduce((sum, c) => sum + c.rating, 0) / cards.length; const top = [...cards].sort((a, b) => b.rating - a.rating)[0]; const groups = new Set(cards.map(c => c.groupLabel)).size; const unassigned = cards.filter(c => c.group === "unassigned").length; els.summary.innerHTML = [`${cards.length} Karten`, `${groups} Gruppen`, `${archetypes.length} Archetypen`, detectedCount ? `${detectedCount} aus Draftsim erkannt` : "Preset/Fallback genutzt", `Ø Rating ${average.toFixed(2)}`, `Top: ${top.name} (${top.rating}/10)`, `${unassigned} nicht eindeutig`].map(t => `<div class="pill">${escapeHtml(t)}</div>`).join(""); }
function renderCards(cards, archetypes) { els.results.innerHTML = ""; const grouped = groupCards(cards, archetypes); for (const group of grouped) { const title = document.createElement("div"); title.className = `group-title group-${cssKey(group.key)}`; const avg = group.cards.reduce((s, c) => s + c.rating, 0) / group.cards.length; title.innerHTML = `<h2>${escapeHtml(group.label)} (${group.cards.length})</h2><p>Durchschnitt ${avg.toFixed(2)}/10</p>`; els.results.appendChild(title); for (const card of group.cards) { const node = els.template.content.firstElementChild.cloneNode(true); node.id = `card-${card.id}`; node.classList.add(`school-${cssKey(card.group)}`); node.querySelector("h3").textContent = card.name; node.querySelector(".card-topline").textContent = `${card.section || card.groupLabel}${card.colorIdentity.length ? ` - ${canonicalColorKey(card.colorIdentity)}` : ""}`; node.querySelector(".rating").textContent = `${card.rating}/10`; node.querySelector(".review").textContent = card.review; node.querySelector(".meta-line").textContent = `Bildquelle: Scryfall (${card.imageStatus || "ok"})`; const wrap = node.querySelector(".image-wrap"); if (card.image) { wrap.innerHTML = ""; const img = document.createElement("img"); img.src = card.image; img.alt = card.name; img.loading = "eager"; img.decoding = "async"; img.onerror = () => { wrap.innerHTML = `<div class="missing-img">Bild konnte nicht geladen werden</div>`; }; wrap.appendChild(img); } else { wrap.innerHTML = `<div class="missing-img">Kein Scryfall-Bild gefunden</div>`; } els.results.appendChild(node); } } }
function groupCards(cards, archetypes) { const order = [...archetypes, ...MONO_AND_OTHER_GROUPS]; const byKey = new Map(); for (const card of cards) { if (!byKey.has(card.group)) byKey.set(card.group, { key: card.group, label: card.groupLabel, cards: [] }); byKey.get(card.group).cards.push(card); } const out = []; for (const group of order) if (byKey.has(group.key)) out.push(byKey.get(group.key)); for (const group of byKey.values()) if (!out.some(g => g.key === group.key)) out.push(group); return out; }
function exportJson() { const blob = new Blob([JSON.stringify({ archetypes: activeArchetypes, cards: loadedCards }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "draftsim-review.json"; a.click(); URL.revokeObjectURL(a.href); }

function normalizeColors(colors) { const order = ["W", "U", "B", "R", "G"]; const set = new Set((colors || []).map(c => String(c).toUpperCase()).filter(c => order.includes(c))); return order.filter(c => set.has(c)); }
function sameColors(a, b) { return canonicalColorKey(a) === canonicalColorKey(b); }
function canonicalColorKey(colors) { return normalizeColors(colors).join("") || "C"; }
function slugify(str) { return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Math.random().toString(36).slice(2); }
function cssKey(str) { return String(str || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "other"; }
function escapeHtml(str) { return String(str ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch])); }
function titleCase(str) { return String(str).replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase()); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

init();
