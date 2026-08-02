(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyJournalSyncCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const JOURNAL_FIELDS = [
    "id",
    "timestamp",
    "asset",
    "market",
    "session",
    "timeframe",
    "direction",
    "setup",
    "rMultiple",
    "result",
    "followedPlan",
    "quality",
    "emotionBefore",
    "emotionAfter",
    "errorType",
    "context",
    "lesson",
    "createdAt"
  ];

  function canonicalEntry(entry = {}) {
    const canonical = {};
    for (const field of JOURNAL_FIELDS) canonical[field] = entry[field] ?? null;
    return canonical;
  }

  function normalizeSnapshot(entries = []) {
    const unique = new Map();
    if (!Array.isArray(entries)) return [];

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      const id = String(entry.id ?? "").trim();
      if (!id) continue;
      unique.set(id, canonicalEntry({ ...entry, id }));
    }

    return [...unique.values()].sort((left, right) => left.id.localeCompare(right.id));
  }

  function fingerprintJournal(entries = []) {
    return JSON.stringify(normalizeSnapshot(entries));
  }

  function compareJournalSnapshots(localEntries = [], remoteEntries = []) {
    const local = normalizeSnapshot(localEntries);
    const remote = normalizeSnapshot(remoteEntries);

    if (!local.length && !remote.length) return "empty";
    if (fingerprintJournal(local) === fingerprintJournal(remote)) return "equal";
    if (local.length && !remote.length) return "local-only";
    if (!local.length && remote.length) return "remote-only";
    return "diverged";
  }

  function cloneJournal(entries = []) {
    return normalizeSnapshot(entries).map(entry => ({ ...entry }));
  }

  return {
    JOURNAL_FIELDS,
    canonicalEntry,
    normalizeSnapshot,
    fingerprintJournal,
    compareJournalSnapshots,
    cloneJournal
  };
});