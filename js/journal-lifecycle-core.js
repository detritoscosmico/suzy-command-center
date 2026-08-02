(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyJournalLifecycleCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_HISTORY_LIMIT = 20;

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validIso(value, fallback = null) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback;
  }

  function createRevision(entry, reason = "Versão anterior", savedAt = new Date().toISOString(), revisionId) {
    if (!entry || typeof entry !== "object" || !String(entry.id || "").trim()) return null;
    const timestamp = validIso(savedAt, new Date().toISOString());
    return {
      id: String(revisionId || `${entry.id}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 180),
      savedAt: timestamp,
      reason: String(reason || "Versão anterior").trim().slice(0, 80),
      entry: deepClone(entry)
    };
  }

  function normalizeRevision(revision) {
    if (!revision || typeof revision !== "object") return null;
    const savedAt = validIso(revision.savedAt);
    const entry = revision.entry && typeof revision.entry === "object" ? deepClone(revision.entry) : null;
    if (!savedAt || !entry || !String(entry.id || "").trim()) return null;
    return {
      id: String(revision.id || `${entry.id}-${savedAt}`).slice(0, 180),
      savedAt,
      reason: String(revision.reason || "Versão anterior").trim().slice(0, 80),
      entry
    };
  }

  function normalizeHistoryMap(history = {}, limit = DEFAULT_HISTORY_LIMIT) {
    const normalized = {};
    if (!history || typeof history !== "object" || Array.isArray(history)) return normalized;
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || DEFAULT_HISTORY_LIMIT));

    for (const [entryId, revisions] of Object.entries(history)) {
      if (!Array.isArray(revisions)) continue;
      const clean = revisions
        .map(normalizeRevision)
        .filter(Boolean)
        .sort((left, right) => new Date(left.savedAt) - new Date(right.savedAt))
        .slice(-safeLimit);
      if (clean.length) normalized[String(entryId)] = clean;
    }
    return normalized;
  }

  function appendRevision(history, entry, reason, options = {}) {
    const limit = Math.max(1, Math.min(100, Number(options.limit) || DEFAULT_HISTORY_LIMIT));
    const revision = createRevision(entry, reason, options.savedAt, options.revisionId);
    const normalized = normalizeHistoryMap(history, limit);
    if (!revision) return normalized;
    const entryId = String(entry.id);
    normalized[entryId] = [...(normalized[entryId] || []), revision].slice(-limit);
    return normalized;
  }

  function moveToTrash(entries = [], trash = [], entryId, deletedAt = new Date().toISOString()) {
    const id = String(entryId || "");
    const index = entries.findIndex(entry => String(entry?.id) === id);
    if (index < 0) return { entries: [...entries], trash: [...trash], moved: null };
    const moved = { ...deepClone(entries[index]), deletedAt: validIso(deletedAt, new Date().toISOString()) };
    return {
      entries: entries.filter((_, currentIndex) => currentIndex !== index),
      trash: [...trash.filter(entry => String(entry?.id) !== id), moved],
      moved
    };
  }

  function restoreFromTrash(entries = [], trash = [], entryId, replacementId) {
    const id = String(entryId || "");
    const index = trash.findIndex(entry => String(entry?.id) === id);
    if (index < 0) return { entries: [...entries], trash: [...trash], restored: null };
    const restored = deepClone(trash[index]);
    delete restored.deletedAt;
    if (entries.some(entry => String(entry?.id) === id)) {
      restored.id = String(replacementId || `${id}-restored-${Date.now()}`).slice(0, 180);
    }
    return {
      entries: [...entries, restored],
      trash: trash.filter((_, currentIndex) => currentIndex !== index),
      restored
    };
  }

  function permanentlyDelete(trash = [], entryId) {
    const id = String(entryId || "");
    return trash.filter(entry => String(entry?.id) !== id);
  }

  return {
    DEFAULT_HISTORY_LIMIT,
    deepClone,
    validIso,
    createRevision,
    normalizeRevision,
    normalizeHistoryMap,
    appendRevision,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete
  };
});
