const JOURNAL_STORAGE_KEY = "suzy-professional-journal-v1";
const $ = id => document.getElementById(id);
let entries = loadEntries();
let activeGroup = "setup";

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(JOURNAL_STORAGE_KEY));
    return Array.isArray(parsed) ? parsed.map(SuzyJournalCore.normalizeJournalEntry).filter(Boolean) : [];
  } catch (error) {
    console.warn("Não foi possível restaurar o diário.", error);
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
}

function localInputValue(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  drawEquityCurve(sample);
  saveEntries();
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
        <td><button class="delete-entry" data-delete="${escapeHtml(entry.id)}" type="button">Excluir</button></td>
      </tr>`).join("")
    : '<tr><td colspan="10" class="empty-row">Nenhuma operação registrada.</td></tr>';

  document.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => deleteEntry(button.dataset.delete));
  });
}

function renderErrors(sample) {
  const errors = SuzyJournalCore.topProcessErrors(sample, 5);
  $("processErrors").innerHTML = errors.length
    ? errors.map(error => `<li><strong>${escapeHtml(error.name)}</strong> — ${error.total} ocorrência${error.total === 1 ? "" : "s"}</li>`).join("")
    : "<li>Nenhum erro registrado.</li>";
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

function submitEntry(event) {
  event.preventDefault();
  const normalized = SuzyJournalCore.normalizeJournalEntry({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
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
    lesson: $("entryLesson").value
  });

  if (!normalized) {
    setFeedback("Preencha data, ativo, setup e resultado em R corretamente.", "error");
    return;
  }

  entries.push(normalized);
  setFeedback("Operação registrada. Revise a amostra, não apenas o resultado isolado.", "success");
  clearEntryForm(false);
  render();
}

function setFeedback(text, type = "") {
  $("formFeedback").textContent = text;
  $("formFeedback").className = `feedback ${type}`.trim();
}

function clearEntryForm(clearFeedback = true) {
  $("journalForm").reset();
  $("entryTimestamp").value = localInputValue();
  $("entryR").value = "0";
  $("entryQuality").value = "3";
  $("entryFollowedPlan").checked = true;
  if (clearFeedback) setFeedback("");
}

function deleteEntry(id) {
  if (!confirm("Excluir este registro do diário?")) return;
  entries = entries.filter(entry => entry.id !== id);
  render();
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
  if (!entries.length) return alert("Nenhum registro disponível para backup.");
  downloadBlob(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2), `suzy-diario-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
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
  if (!entries.length || !confirm("Apagar definitivamente todos os registros deste navegador?")) return;
  entries = [];
  render();
}

$("journalForm").addEventListener("submit", submitEntry);
$("clearForm").addEventListener("click", () => clearEntryForm());
$("resetFilters").addEventListener("click", resetFilters);
$("exportCsv").addEventListener("click", exportCsv);
$("exportJson").addEventListener("click", exportJson);
$("clearJournal").addEventListener("click", clearJournal);
["filterFrom", "filterTo", "filterAsset", "filterSetup", "filterSession", "filterResult"].forEach(id => $(id).addEventListener("change", render));
document.querySelectorAll("[data-group]").forEach(button => button.addEventListener("click", () => {
  activeGroup = button.dataset.group;
  document.querySelectorAll("[data-group]").forEach(item => item.classList.toggle("active", item === button));
  renderBreakdown(filteredEntries());
}));
window.addEventListener("resize", () => drawEquityCurve(filteredEntries()));

clearEntryForm();
render();
