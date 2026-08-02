const { normalizeJournalEntry } = require("../js/journal-core.js");

const MAX_JOURNAL_ENTRIES = 10_000;

function normalizeJournalPayload(payload) {
  const source = payload?.entries;
  if (!Array.isArray(source)) {
    return { valid: false, entries: [], message: "O campo entries deve ser uma lista." };
  }
  if (source.length > MAX_JOURNAL_ENTRIES) {
    return {
      valid: false,
      entries: [],
      message: `O diário excede o limite de ${MAX_JOURNAL_ENTRIES} registros.`
    };
  }

  const entries = [];
  const ids = new Set();
  for (const candidate of source) {
    const entry = normalizeJournalEntry(candidate);
    if (!entry) {
      return { valid: false, entries: [], message: "O diário contém um registro inválido." };
    }
    if (ids.has(entry.id)) {
      return { valid: false, entries: [], message: "O diário contém identificadores duplicados." };
    }
    ids.add(entry.id);
    entries.push(entry);
  }

  return { valid: true, entries, message: "" };
}

module.exports = { MAX_JOURNAL_ENTRIES, normalizeJournalPayload };
