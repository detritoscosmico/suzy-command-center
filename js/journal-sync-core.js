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
    "behavioralCheckIn",
    "createdAt"
  ];
  const LIFECYCLE_META_PREFIX = "__suzy_lifecycle_v1__";
  const LIFECYCLE_META_ASSET = "SUZY/META";
  const LIFECYCLE_CHUNK_SIZE = 480;
  const MAX_LIFECYCLE_CHARS = 350_000;
  const META_TIMESTAMP = "2000-01-01T00:00:00.000Z";

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function encodeUtf8Base64(value) {
    const text = String(value ?? "");
    if (typeof Buffer !== "undefined") return Buffer.from(text, "utf8").toString("base64");
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 32_768) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
    }
    return btoa(binary);
  }

  function decodeUtf8Base64(value) {
    const encoded = String(value ?? "");
    if (typeof Buffer !== "undefined") return Buffer.from(encoded, "base64").toString("utf8");
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function canonicalEntry(entry = {}) {
    const canonical = {};
    for (const field of JOURNAL_FIELDS) {
      const value = entry[field] ?? null;
      canonical[field] = value && typeof value === "object" ? deepClone(value) : value;
    }
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

  function normalizeTrashSnapshot(trash = []) {
    const unique = new Map();
    if (!Array.isArray(trash)) return [];

    for (const candidate of trash) {
      if (!candidate || typeof candidate !== "object") continue;
      const id = String(candidate.id ?? "").trim();
      const deletedAt = new Date(candidate.deletedAt);
      if (!id || !Number.isFinite(deletedAt.getTime())) continue;
      unique.set(id, {
        ...canonicalEntry({ ...candidate, id }),
        deletedAt: deletedAt.toISOString()
      });
    }

    return [...unique.values()].sort((left, right) =>
      left.id.localeCompare(right.id) || left.deletedAt.localeCompare(right.deletedAt)
    );
  }

  function canonicalRevision(revision = {}) {
    const id = String(revision.id ?? "").trim();
    const savedAt = new Date(revision.savedAt);
    if (!id || !Number.isFinite(savedAt.getTime()) || !revision.entry || typeof revision.entry !== "object") return null;
    const entry = canonicalEntry(revision.entry);
    if (!String(entry.id ?? "").trim()) return null;
    return {
      id,
      savedAt: savedAt.toISOString(),
      reason: String(revision.reason ?? "Versão anterior").trim().slice(0, 80),
      entry
    };
  }

  function normalizeHistorySnapshot(history = {}) {
    const normalized = {};
    if (!history || typeof history !== "object" || Array.isArray(history)) return normalized;

    for (const entryId of Object.keys(history).sort((left, right) => left.localeCompare(right))) {
      if (!Array.isArray(history[entryId])) continue;
      const revisions = history[entryId]
        .map(canonicalRevision)
        .filter(Boolean)
        .sort((left, right) => left.savedAt.localeCompare(right.savedAt) || left.id.localeCompare(right.id));
      if (revisions.length) normalized[String(entryId)] = revisions;
    }
    return normalized;
  }

  function normalizeStateSnapshot(state = {}) {
    return {
      entries: normalizeSnapshot(state.entries),
      trash: normalizeTrashSnapshot(state.trash),
      history: normalizeHistorySnapshot(state.history)
    };
  }

  function fingerprintJournal(entries = []) {
    return JSON.stringify(normalizeSnapshot(entries));
  }

  function fingerprintJournalState(state = {}) {
    return JSON.stringify(normalizeStateSnapshot(state));
  }

  function hasStateData(state = {}) {
    const normalized = normalizeStateSnapshot(state);
    return normalized.entries.length > 0
      || normalized.trash.length > 0
      || Object.values(normalized.history).some(revisions => revisions.length > 0);
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

  function compareJournalStates(localState = {}, remoteState = {}) {
    const localHasData = hasStateData(localState);
    const remoteHasData = hasStateData(remoteState);
    if (!localHasData && !remoteHasData) return "empty";
    if (fingerprintJournalState(localState) === fingerprintJournalState(remoteState)) return "equal";
    if (localHasData && !remoteHasData) return "local-only";
    if (!localHasData && remoteHasData) return "remote-only";
    return "diverged";
  }

  function cloneJournal(entries = []) {
    return normalizeSnapshot(entries).map(deepClone);
  }

  function cloneJournalState(state = {}) {
    return deepClone(normalizeStateSnapshot(state));
  }

  function lifecyclePayload(trash = [], history = {}) {
    const json = JSON.stringify({
      version: 1,
      encoding: "base64-utf8",
      trash: normalizeTrashSnapshot(trash),
      history: normalizeHistorySnapshot(history)
    });
    return encodeUtf8Base64(json);
  }

  function lifecycleEnvelopeRecord(chunk, index, total) {
    return {
      id: `${LIFECYCLE_META_PREFIX}${String(index).padStart(6, "0")}`,
      timestamp: META_TIMESTAMP,
      asset: LIFECYCLE_META_ASSET,
      market: "Sistema",
      session: "SQLite",
      timeframe: "N/A",
      direction: "N/A",
      setup: "Estado interno do diário",
      rMultiple: 0,
      result: "BREAKEVEN",
      followedPlan: true,
      quality: 5,
      emotionBefore: "N/A",
      emotionAfter: "N/A",
      errorType: "Nenhum",
      context: chunk,
      lesson: `Parte ${index + 1} de ${total}`,
      createdAt: META_TIMESTAMP
    };
  }

  function encodeRemoteJournal(entries = [], trash = [], history = {}, options = {}) {
    const payload = lifecyclePayload(trash, history);
    const maximum = Math.max(1_000, Number(options.maxLifecycleChars) || MAX_LIFECYCLE_CHARS);
    if (payload.length > maximum) {
      throw new Error(`Versões e lixeira excedem o limite seguro de ${maximum.toLocaleString("pt-BR")} caracteres para sincronização.`);
    }

    const chunkSize = Math.max(100, Math.min(500, Number(options.chunkSize) || LIFECYCLE_CHUNK_SIZE));
    const chunks = [];
    for (let offset = 0; offset < payload.length; offset += chunkSize) {
      chunks.push(payload.slice(offset, offset + chunkSize));
    }
    if (!chunks.length) chunks.push("");

    return [
      ...cloneJournal(entries),
      ...chunks.map((chunk, index) => lifecycleEnvelopeRecord(chunk, index, chunks.length))
    ];
  }

  function isLifecycleEnvelope(entry = {}) {
    return String(entry.id ?? "").startsWith(LIFECYCLE_META_PREFIX)
      && String(entry.asset ?? "").toUpperCase() === LIFECYCLE_META_ASSET;
  }

  function decodeRemoteJournal(remoteEntries = []) {
    const source = Array.isArray(remoteEntries) ? remoteEntries : [];
    const metadata = source.filter(isLifecycleEnvelope).sort((left, right) => String(left.id).localeCompare(String(right.id)));
    const entries = source.filter(entry => !isLifecycleEnvelope(entry));

    if (!metadata.length) {
      return { entries, trash: [], history: {}, lifecycleFound: false, lifecycleError: null };
    }

    for (let index = 0; index < metadata.length; index += 1) {
      const expectedId = `${LIFECYCLE_META_PREFIX}${String(index).padStart(6, "0")}`;
      if (metadata[index].id !== expectedId) {
        return {
          entries,
          trash: [],
          history: {},
          lifecycleFound: true,
          lifecycleError: "O envelope de versões e lixeira está incompleto ou fora de ordem."
        };
      }
    }

    try {
      const encoded = metadata.map(entry => String(entry.context ?? "")).join("");
      const parsed = JSON.parse(decodeUtf8Base64(encoded));
      if (parsed?.version !== 1 || parsed?.encoding !== "base64-utf8") throw new Error("Versão incompatível.");
      return {
        entries,
        trash: normalizeTrashSnapshot(parsed.trash),
        history: normalizeHistorySnapshot(parsed.history),
        lifecycleFound: true,
        lifecycleError: null
      };
    } catch (error) {
      return {
        entries,
        trash: [],
        history: {},
        lifecycleFound: true,
        lifecycleError: `Não foi possível ler versões e lixeira do SQLite: ${error.message}`
      };
    }
  }

  function countRevisions(history = {}) {
    return Object.values(normalizeHistorySnapshot(history)).reduce((total, revisions) => total + revisions.length, 0);
  }

  return {
    JOURNAL_FIELDS,
    LIFECYCLE_META_PREFIX,
    LIFECYCLE_META_ASSET,
    LIFECYCLE_CHUNK_SIZE,
    MAX_LIFECYCLE_CHARS,
    encodeUtf8Base64,
    decodeUtf8Base64,
    canonicalEntry,
    normalizeSnapshot,
    normalizeTrashSnapshot,
    normalizeHistorySnapshot,
    normalizeStateSnapshot,
    fingerprintJournal,
    fingerprintJournalState,
    compareJournalSnapshots,
    compareJournalStates,
    cloneJournal,
    cloneJournalState,
    encodeRemoteJournal,
    decodeRemoteJournal,
    isLifecycleEnvelope,
    countRevisions
  };
});
