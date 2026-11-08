(function (root) {
  const isReviewUrl = url => typeof url === "string" && /^https:\/\/draftsim\.com\/mtg-[a-z0-9-]+-limited-set-review\/$/i.test(url);
  function normalize(draft) {
    if (!draft || typeof draft.title !== "string" || !draft.title.trim() || !isReviewUrl(draft.url)) return null;
    return { title: draft.title.trim(), url: draft.url, archetypeHint: draft.archetypeHint === "sos" ? "sos" : "generic" };
  }
  function merge(published, current) {
    const byUrl = new Map();
    for (const value of [...published, ...current]) {
      const draft = normalize(value);
      if (draft && !byUrl.has(draft.url)) byUrl.set(draft.url, draft);
    }
    return [...byUrl.values()];
  }
  const api = { isReviewUrl, normalize, merge };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SetCatalog = api;
})(globalThis);
