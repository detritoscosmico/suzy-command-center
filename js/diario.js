const JOURNAL_STORAGE_KEY = "suzy-professional-journal-v1";
const JOURNAL_TRASH_KEY = "suzy-professional-journal-trash-v1";
const JOURNAL_HISTORY_KEY = "suzy-professional-journal-history-v1";
const $ = id => document.getElementById(id);

let entries = loadEntries();
let trashEntries = loadTrash();
let versionHistory = loadHistory();
let activeGroup = "setup";
let editingEntryId = null;
let selectedHistoryEntryId = null;

function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`Não foi possível restaurar ${key}.`, error);
    return fallback;
  }
}

function loadEntries() {
  const parsed = loadJson(JOURNAL_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.map(SuzyJournalCore.normalizeJournalEntry).filter(Boolean) : [];
}

function loadTrash() {
  const parsed = loadJson(JOURNAL_TRASH_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(candidate => {
    const normalized = SuzyJournalCore.normalizeJournalEntry(candidate);
    const deletedAt = SuzyJournalLifecycleCore.validIso(candidate?.deletedAt);
    return normalized && deletedAt ? { ...normalized, deletedAt } : null;
  }).filter(Boolean);
}

function loadHistory() {
  return SuzyJournalLifecycleCore.normalizeHistoryMap(loadJson(JOURNAL_HISTORY_KEY, {}));
}

function saveState() {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  localStorage.setItem(JOURNAL_TRASH_KEY, JSON.stringify(trashEntries));
  localStorage.setItem(JOURNAL_HISTORY_KEY, JSON.stringify(versionHistory));
}

function notifyMutation() {
  document.dispatchEvent(new CustomEvent("journal:mutated"));
}

function localInputValue(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isoToLocalInput(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? localInputValue(date) : localInputValue();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  }[char]));
}

function signedR(value) {
  const number = Number(value) || 0;
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}R`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function filteredEntries() {
  return SuzyJournalCore.filterJournal(entries, {
    from: $("filterFrom").value,
    to: $("filterTo").value,
    asset: $("filterAsset").value,
    setup: $("filterSetup").value,
    session: $("filterSession").value,
    result: $("filterResult").value
  });
}

function render() {
  const sample = filteredEntries();
  const summary = SuzyJournalCore.summarizeJournal(sample);

  $("kpiTotal").textContent = summary.total;
  $("kpiTotalR").textContent = signedR(summary.totalR);
  $("kpiTotalR").className = summary.totalR > 0 ? "green" : summary.totalR < 0 ? "red" : "";
  $("kpiExpectancy").textContent = signedR(summary.expectancy);
  $("kpiExpectancy").className = summary.expectancy > 0 ? "green" : summary.expectancy < 0 ? "red" : "";
  $("kpiProfitFactor").textContent = summary.profitFactor === null ? "∞" : summary.profitFactor.toFixed(2);
  $("kpiDrawdown").textContent = `${summary.maxDrawdown.toFixed(2)}R`;
  $("kpiAdherence").textContent = formatPercent(summary.adherence);

  renderFilterOptions();
  renderBreakdown(sample);
  renderHistory(sample);
  renderErrors(sample);
  renderTrash();
  renderVersionHistory();
  drawEquityCurve(sample);
  saveState();
}

function renderFilterOptions() {
  const definitions = [
    ["filterAsset", "asset", "Todos"],
    ["filterSetup", "setup", "Todos"],
    ["filterSession", "session", "Todas"]
  ];

  for (const [elementId, field, placeholder] of definitions) {
    const select = $(elementId);
    const selected = select.value;
    const values = [...new Set(entries.map(entry => entry[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = `<option value="">${placeholder}</option>` + values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    if (values.includes(selected)) select.value = selected;
  }
}

function renderBreakdown(sample) {
  const groups = SuzyJournalCore.groupJournal(sample, activeGroup);
  $("breakdownBody").innerHTML = groups.length
    ? groups.map(group => `
      <tr>
        <td>${escapeHtml(group.name)}</td>
        <td>${group.total}</td>
        <td>${formatPercent(group.winrate)}</td>
        <td class="${group.totalR > 0 ? "green" : group.totalR < 0 ? "red" : ""}">${signedR(group.totalR)}</td>
        <td class="${group.expectancy > 0 ? "green" : group.expectancy < 0 ? "red" : ""}">${signedR(group.expectancy)}</td>
        <td>${group.profitFactor === null ? "∞" : group.profitFactor.toFixed(2)}</td>
        <td>${formatPercent(group.adherence)}</td>
      </tr>`).join("")
    : '<tr><td colspan="7" class="empty-row">Nenhum dado disponível.</td></tr>';
}

function renderHistory(sample) {
  const rows = [...sample].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
  $("historyBody").innerHTML = rows.length
    ? rows.map(entry => `
      <tr>
        <td>${new Date(entry.timestamp).toLocaleString("pt-BR")}</td>
        <td>${escapeHtml(entry.asset)}</td>
        <td>${escapeHtml(entry.setup)}</td>
        <td>${escapeHtml(entry.session)}</td>
        <td>${escapeHtml(entry.direction)}</td>
        <td class="${entry.result === "WIN" ? "green" : entry.result === "LOSS" ? "red" : "orange"}">${entry.result}</td>
        <td class="${entry.rMultiple > 0 ? "green" : entry.rMultiple < 0 ? "red" : ""}">${signedR(entry.rMultiple)}</td>
        <td>${entry.followedPlan ? "SIM" : "NÃO"}</td>
        <td>${entry.quality}/5</td>
        <td>
          <div class="row-actions">
            <button data-edit="${escapeHtml(entry.id)}" type="button">Editar</button>
            <button data-versions="${escapeHtml(entry.id)}" type="button">Versões</button>
            <button class="danger-action" data-delete="${escapeHtml(entry.id)}" type="button">Lixeira</button>
          </div>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="10" class="empty-row">Nenhuma operação registrada.</td></tr>';
}

function renderErrors(sample) {
  const errors = SuzyJournalCore.topProcessErrors(sample, 5);
  $("processErrors").innerHTML = errors.length
    ? errors.map(error => `<li><strong>${escapeHtml(error.name)}</strong> — ${error.total} ocorrência${error.total === 1 ? "" : "s"}</li>`).join("")
    : "<li>Nenhum erro registrado.</li>";
}

function renderTrash() {
  $("trashCount").textContent = trashEntries.length;
  $("emptyTrash").disabled = trashEntries.length === 0;
  const rows = [...trashEntries].sort((left, right) => new Date(right.deletedAt) - new Date(left.deletedAt));
  $("trashBody").innerHTML = rows.length
    ? rows.map(entry => `
      <tr>
        <td>${new Date(entry.deletedAt).toLocaleString("pt-BR")}</td>
        <td>${new Date(entry.timestamp).toLocaleString("pt-BR")}</td>
        <td>${escapeHtml(entry.asset)}</td>
        <td>${escapeHtml(entry.setup)}</td>
        <td class="${entry.rMultiple > 0 ? "green" : entry.rMultiple < 0 ? "red" : ""}">${signedR(entry.rMultiple)}</td>
        <td>
          <div class="row-actions">
            <button data-restore-trash="${escapeHtml(entry.id)}" type="button">Restaurar</button>
            <button class="danger-action" data-purge="${escapeHtml(entry.id)}" type="button">Excluir definitivamente</button>
          </div>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" class="empty-row">A lixeira está vazia.</td></tr>';
}

function renderVersionHistory() {
  const entry = entries.find(candidate => candidate.id === selectedHistoryEntryId)
    || trashEntries.find(candidate => candidate.id === selectedHistoryEntryId);
  const revisions = entry ? (versionHistory[entry.id] || []) : [];

  $("versionEntryTitle").textContent = entry
    ? `${entry.asset} • ${entry.setup}`
    : "Selecione “Versões” em uma operação";
  $("versionCount").textContent = revisions.length;

  $("versionBody").innerHTML = revisions.length
    ? [...revisions].reverse().map(revision => `
      <tr>
        <td>${new Date(revision.savedAt).toLocaleString("pt-BR")}</td>
        <td>${escapeHtml(revision.reason)}</td>
        <td>${escapeHtml(revision.entry.asset)}</td>
        <td>${escapeHtml(revision.entry.setup)}</td>
        <td>${signedR(revision.entry.rMultiple)}</td>
        <td>${entries.some(candidate => candidate.id === entry.id)
          ? `<button data-restore-version="${escapeHtml(revision.id)}" type="button">Restaurar esta versão</button>`
          : "Restaure o item da lixeira primeiro"}</td>
      </tr>`).join("")
    : '<tr><td colspan="6" class="empty-row">Nenhuma versão anterior registrada.</td></tr>';
}

function drawEquityCurve(sample) {
  const canvas = $("equityChart");
  const points = SuzyJournalCore.equityCurve(sample);
  const width = Math.max(canvas.parentElement.clientWidth, 300);
  const height = canvas.parentElement.clientHeight || 300;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.fillStyle = "#06101d";
  ctx.fillRect(0, 0, width, height);

  if (!points.length) {
    ctx.fillStyle = "#92a7bf";
    ctx.font = "14px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("Registre operações para gerar a curva.", width / 2, height / 2);
    return;
  }

  const margin = { top: 20, right: 25, bottom: 30, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = [0, ...points.map(point => point.equity)];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const padding = Math.max(0.5, (max - min) * 0.12);
  const upper = max + padding;
  const lower = min - padding;
  const x = index => margin.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = value => margin.top + ((upper - value) / (upper - lower)) * plotHeight;

  ctx.strokeStyle = "rgba(146,167,191,.18)";
  ctx.fillStyle = "#92a7bf";
  ctx.font = "10px Segoe UI";
  ctx.textAlign = "right";
  for (let line = 0; line <= 4; line += 1) {
    const value = upper - ((upper - lower) / 4) * line;
    const py = y(value);
    ctx.beginPath();
    ctx.moveTo(margin.left, py);
    ctx.lineTo(width - margin.right, py);
    ctx.stroke();
    ctx.fillText(`${value.toFixed(1)}R`, margin.left - 7, py + 3);
  }

  if (lower <= 0 && upper >= 0) {
    ctx.strokeStyle = "rgba(255,159,47,.55)";
    ctx.beginPath();
    ctx.moveTo(margin.left, y(0));
    ctx.lineTo(width - margin.right, y(0));
    ctx.stroke();
  }

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const px = x(index);
    const py = y(point.equity);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(x(index), y(point.equity), 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function entryFromForm(existingEntry) {
  return SuzyJournalCore.normalizeJournalEntry({
    id: existingEntry?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    timestamp: $("entryTimestamp").value,
    asset: $("entryAsset").value,
    market: $("entryMarket").value,
    session: $("entrySession").value,
    timeframe: $("entryTimeframe").value,
    direction: $("entryDirection").value,
    setup: $("entrySetup").value,
    rMultiple: $("entryR").value,
    followedPlan: $("entryFollowedPlan").checked,
    quality: $("entryQuality").value,
    emotionBefore: $("entryEmotionBefore").value,
    emotionAfter: $("entryEmotionAfter").value,
    errorType: $("entryError").value,
    context: $("entryContext").value,
    lesson: $("entryLesson").value,
    createdAt: existingEntry?.createdAt
  });
}

function submitEntry(event) {
  event.preventDefault();
  const current = editingEntryId ? entries.find(entry => entry.id === editingEntryId) : null;
  const normalized = entryFromForm(current);

  if (!normalized) {
    setFeedback("Preencha data, ativo, setup e resultado em R corretamente.", "error");
    return;
  }

  if (current) {
    versionHistory = SuzyJournalLifecycleCore.appendRevision(versionHistory, current, "Antes da edição");
    entries = entries.map(entry => entry.id === current.id ? normalized : entry);
    selectedHistoryEntryId = current.id;
    setFeedback("Registro atualizado. A versão anterior foi preservada.", "success");
  } else {
    entries.push(normalized);
    setFeedback("Operação registrada. Revise a amostra, não apenas o resultado isolado.", "success");
  }

  clearEntryForm(false);
  render();
  notifyMutation();
}

function setFeedback(text, type = "") {
  $("formFeedback").textContent = text;
  $("formFeedback").className = `feedback ${type}`.trim();
}

function clearEntryForm(clearFeedback = true) {
  editingEntryId = null;
  $("journalForm").reset();
  $("entryTimestamp").value = localInputValue();
  $("entryR").value = "0";
  $("entryQuality").value = "3";
  $("entryFollowedPlan").checked = true;
  $("submitEntryButton").textContent = "SALVAR REGISTRO";
  $("formMode").textContent = "NOVO REGISTRO";
  $("cancelEdit").hidden = true;
  if (clearFeedback) setFeedback("");
}

function editEntry(id) {
  const entry = entries.find(candidate => candidate.id === id);
  if (!entry) return;
  editingEntryId = id;
  selectedHistoryEntryId = id;
  $("entryTimestamp").value = isoToLocalInput(entry.timestamp);
  $("entryAsset").value = entry.asset;
  $("entryMarket").value = entry.market;
  $("entrySession").value = entry.session;
  $("entryTimeframe").value = entry.timeframe;
  $("entryDirection").value = entry.direction;
  $("entrySetup").value = entry.setup;
  $("entryR").value = entry.rMultiple;
  $("entryQuality").value = String(entry.quality);
  $("entryError").value = entry.errorType;
  $("entryEmotionBefore").value = entry.emotionBefore === "Não informada" ? "" : entry.emotionBefore;
  $("entryEmotionAfter").value = entry.emotionAfter === "Não informada" ? "" : entry.emotionAfter;
  $("entryFollowedPlan").checked = entry.followedPlan;
  $("entryContext").value = entry.context;
  $("entryLesson").value = entry.lesson;
  $("submitEntryButton").textContent = "SALVAR ALTERAÇÕES";
  $("formMode").textContent = "EDITANDO REGISTRO";
  $("cancelEdit").hidden = false;
  setFeedback("Edite os campos e salve. A versão atual será mantida no histórico.", "");
  $("journalForm").scrollIntoView({ behavior: "smooth", block: "start" });
  renderVersionHistory();
}

function moveEntryToTrash(id) {
  const entry = entries.find(candidate => candidate.id === id);
  if (!entry || !confirm(`Mover ${entry.asset} — ${entry.setup} para a lixeira?`)) return;
  const result = SuzyJournalLifecycleCore.moveToTrash(entries, trashEntries, id);
  entries = result.entries;
  trashEntries = result.trash;
  if (editingEntryId === id) clearEntryForm();
  selectedHistoryEntryId = id;
  render();
  notifyMutation();
}

function restoreTrashEntry(id) {
  const replacementId = crypto.randomUUID ? crypto.randomUUID() : `${id}-restored-${Date.now()}`;
  const result = SuzyJournalLifecycleCore.restoreFromTrash(entries, trashEntries, id, replacementId);
  if (!result.restored) return;
  const normalized = SuzyJournalCore.normalizeJournalEntry(result.restored);
  if (!normalized) return;
  entries = [...result.entries.filter(entry => entry.id !== result.restored.id), normalized];
  trashEntries = result.trash;
  if (result.restored.id !== id && versionHistory[id]) {
    versionHistory[result.restored.id] = versionHistory[id];
    delete versionHistory[id];
  }
  selectedHistoryEntryId = normalized.id;
  render();
  notifyMutation();
}

function purgeTrashEntry(id) {
  const entry = trashEntries.find(candidate => candidate.id === id);
  if (!entry || !confirm(`Excluir definitivamente ${entry.asset} — ${entry.setup}? Esta ação não pode ser desfeita.`)) return;
  trashEntries = SuzyJournalLifecycleCore.permanentlyDelete(trashEntries, id);
  delete versionHistory[id];
  if (selectedHistoryEntryId === id) selectedHistoryEntryId = null;
  render();
}

function emptyTrash() {
  if (!trashEntries.length || !confirm(`Excluir definitivamente ${trashEntries.length} item(ns) da lixeira?`)) return;
  for (const entry of trashEntries) delete versionHistory[entry.id];
  trashEntries = [];
  selectedHistoryEntryId = null;
  render();
}

function restoreVersion(revisionId) {
  const current = entries.find(entry => entry.id === selectedHistoryEntryId);
  const revision = current && (versionHistory[current.id] || []).find(item => item.id === revisionId);
  if (!current || !revision) return;
  if (!confirm(`Restaurar a versão de ${new Date(revision.savedAt).toLocaleString("pt-BR")}? A versão atual também será preservada.`)) return;

  versionHistory = SuzyJournalLifecycleCore.appendRevision(versionHistory, current, "Antes da restauração");
  const restored = SuzyJournalCore.normalizeJournalEntry({
    ...revision.entry,
    id: current.id,
    createdAt: current.createdAt
  });
  if (!restored) return;
  entries = entries.map(entry => entry.id === current.id ? restored : entry);
  render();
  notifyMutation();
}

function resetFilters() {
  ["filterFrom", "filterTo", "filterAsset", "filterSetup", "filterSession", "filterResult"].forEach(id => { $(id).value = ""; });
  render();
}

function exportCsv() {
  const sample = filteredEntries();
  if (!sample.length) return alert("Nenhum registro disponível para exportar.");
  const header = ["data", "ativo", "mercado", "sessao", "timeframe", "direcao", "setup", "resultado", "r_multiplo", "seguiu_plano", "qualidade", "emocao_antes", "emocao_depois", "erro", "contexto", "licao"];
  const rows = sample.map(entry => [entry.timestamp, entry.asset, entry.market, entry.session, entry.timeframe, entry.direction, entry.setup, entry.result, entry.rMultiple, entry.followedPlan ? "SIM" : "NAO", entry.quality, entry.emotionBefore, entry.emotionAfter, entry.errorType, entry.context, entry.lesson]);
  downloadBlob("\ufeff" + SuzyCore.serializeCsv([header, ...rows]), `suzy-diario-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
}

function exportJson() {
  if (!entries.length && !trashEntries.length) return alert("Nenhum registro disponível para backup.");
  downloadBlob(JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    entries,
    trash: trashEntries,
    history: versionHistory
  }, null, 2), `suzy-diario-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
}

function downloadBlob(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function clearJournal() {
  if (!entries.length || !confirm(`Mover ${entries.length} registro(s) para a lixeira?`)) return;
  for (const entry of [...entries]) {
    const result = SuzyJournalLifecycleCore.moveToTrash(entries, trashEntries, entry.id);
    entries = result.entries;
    trashEntries = result.trash;
  }
  clearEntryForm();
  render();
  notifyMutation();
}

$("journalForm").addEventListener("submit", submitEntry);
$("clearForm").addEventListener("click", () => clearEntryForm());
$("cancelEdit").addEventListener("click", () => clearEntryForm());
$("resetFilters").addEventListener("click", resetFilters);
$("exportCsv").addEventListener("click", exportCsv);
$("exportJson").addEventListener("click", exportJson);
$("clearJournal").addEventListener("click", clearJournal);
$("emptyTrash").addEventListener("click", emptyTrash);

$("historyBody").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  const versionsButton = event.target.closest("[data-versions]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editEntry(editButton.dataset.edit);
  if (versionsButton) {
    selectedHistoryEntryId = versionsButton.dataset.versions;
    renderVersionHistory();
    $("versionsCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (deleteButton) moveEntryToTrash(deleteButton.dataset.delete);
});

$("trashBody").addEventListener("click", event => {
  const restoreButton = event.target.closest("[data-restore-trash]");
  const purgeButton = event.target.closest("[data-purge]");
  if (restoreButton) restoreTrashEntry(restoreButton.dataset.restoreTrash);
  if (purgeButton) purgeTrashEntry(purgeButton.dataset.purge);
});

$("versionBody").addEventListener("click", event => {
  const restoreButton = event.target.closest("[data-restore-version]");
  if (restoreButton) restoreVersion(restoreButton.dataset.restoreVersion);
});

["filterFrom", "filterTo", "filterAsset", "filterSetup", "filterSession", "filterResult"].forEach(id => $(id).addEventListener("change", render));
document.querySelectorAll("[data-group]").forEach(button => button.addEventListener("click", () => {
  activeGroup = button.dataset.group;
  document.querySelectorAll("[data-group]").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  renderBreakdown(filteredEntries());
}));
window.addEventListener("resize", () => drawEquityCurve(filteredEntries()));

clearEntryForm();
render();
