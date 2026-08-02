(function () {
  const STORAGE_KEY = "suzy.calendar.educational.v1";
  const byId = id => document.getElementById(id);
  let state = loadState();

  function defaultState() {
    return {
      version: SuzyCalendarCore.STORAGE_VERSION,
      sourceName: "",
      sourceUrl: "",
      authorized: false,
      mode: "empty",
      savedAt: "",
      events: []
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const normalized = SuzyCalendarCore.normalizeSnapshot(parsed);
      return {
        ...defaultState(),
        ...normalized,
        mode: parsed.mode === "demo" ? "demo" : (normalized.events.length ? "authorized" : "empty")
      };
    } catch {
      return defaultState();
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: state.version,
        sourceName: state.sourceName,
        sourceUrl: state.sourceUrl,
        authorized: state.authorized,
        mode: state.mode,
        savedAt: new Date().toISOString(),
        events: state.events
      }));
    } catch {
      feedback("Os eventos foram carregados, mas o navegador não permitiu salvar o calendário.", "warning");
    }
  }

  function feedback(message = "", type = "") {
    const element = byId("importFeedback");
    element.textContent = message;
    element.className = `feedback ${type}`.trim();
  }

  function filters() {
    return {
      from: byId("filterFrom").value,
      to: byId("filterTo").value,
      currency: byId("filterCurrency").value,
      impact: byId("filterImpact").value,
      status: byId("filterStatus").value
    };
  }

  function impactLabel(value) {
    return { HIGH: "Alto", MEDIUM: "Médio", LOW: "Baixo" }[value] || value;
  }

  function statusLabel(value) {
    return { PAST: "Encerrado", NOW: "Agora", NEXT: "Próximo", TODAY: "Hoje", FUTURE: "Futuro" }[value] || value;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  function createCell(text = "—") {
    const cell = document.createElement("td");
    cell.textContent = text || "—";
    return cell;
  }

  function renderCurrencies() {
    const select = byId("filterCurrency");
    const current = select.value || "ALL";
    const currencies = [...new Set(state.events.map(event => event.currency))].sort();
    select.replaceChildren(new Option("Todas", "ALL"), ...currencies.map(currency => new Option(currency, currency)));
    select.value = currencies.includes(current) ? current : "ALL";
  }

  function renderMode() {
    const badge = byId("calendarMode");
    badge.className = "mode-badge";
    if (state.mode === "demo") {
      badge.textContent = "EXEMPLO ARTIFICIAL";
      badge.classList.add("demo");
    } else if (state.events.length && state.authorized) {
      badge.textContent = "FONTE DECLARADA PELO USUÁRIO";
      badge.classList.add("authorized");
    } else {
      badge.textContent = "SEM DADOS IMPORTADOS";
    }
  }

  function renderSummary(now = new Date()) {
    const summary = SuzyCalendarCore.summarizeEvents(state.events, now);
    byId("summaryTotal").textContent = String(summary.total);
    byId("summaryUpcoming").textContent = String(summary.upcoming24h);
    byId("summaryHigh").textContent = String(summary.high24h);
    byId("summaryNow").textContent = String(summary.now);
  }

  function renderRows(now = new Date()) {
    const visible = SuzyCalendarCore.filterEvents(state.events, filters(), now);
    const body = byId("calendarBody");
    body.replaceChildren();
    byId("visibleCount").textContent = `${visible.length} exibido${visible.length === 1 ? "" : "s"}`;

    if (!visible.length) {
      const row = document.createElement("tr");
      const cell = createCell(state.events.length ? "Nenhum evento corresponde aos filtros." : "Importe um arquivo autorizado ou carregue o exemplo artificial.");
      cell.colSpan = 10;
      cell.className = "empty-row";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    for (const event of visible) {
      const row = document.createElement("tr");
      row.appendChild(createCell(formatDate(event.datetime)));
      row.appendChild(createCell(formatTime(event.datetime)));
      row.appendChild(createCell(event.currency));

      const titleCell = document.createElement("td");
      const title = document.createElement("span");
      title.className = "event-title";
      title.textContent = event.title;
      titleCell.appendChild(title);
      row.appendChild(titleCell);

      const impactCell = document.createElement("td");
      const impact = document.createElement("span");
      impact.className = `impact-badge impact-${event.impact.toLowerCase()}`;
      impact.textContent = impactLabel(event.impact);
      impactCell.appendChild(impact);
      row.appendChild(impactCell);

      row.appendChild(createCell(event.previous));
      row.appendChild(createCell(event.forecast));
      row.appendChild(createCell(event.actual));

      const statusValue = SuzyCalendarCore.classifyEvent(event, now);
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = `status-badge status-${statusValue.toLowerCase()}`;
      status.textContent = statusLabel(statusValue);
      statusCell.appendChild(status);
      row.appendChild(statusCell);

      const sourceCell = document.createElement("td");
      if (event.sourceUrl) {
        const source = document.createElement("a");
        source.className = "event-source";
        source.href = event.sourceUrl;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        source.textContent = event.source;
        sourceCell.appendChild(source);
      } else {
        sourceCell.textContent = event.source;
      }
      row.appendChild(sourceCell);
      body.appendChild(row);
    }
  }

  function render(now = new Date()) {
    renderCurrencies();
    renderMode();
    renderSummary(now);
    renderRows(now);
    byId("exportCalendar").disabled = !state.events.length;
    byId("clearCalendar").disabled = !state.events.length;
  }

  function download(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function loadDemo() {
    state = {
      ...defaultState(),
      mode: "demo",
      sourceName: "Cenário artificial da Academia Suzy",
      events: SuzyCalendarCore.createDemoEvents(new Date())
    };
    persist();
    render();
    feedback("Exemplo artificial carregado. Estes eventos não representam divulgações reais.", "warning");
  }

  async function importFile() {
    const file = byId("calendarFile").files[0];
    const sourceName = byId("sourceName").value.trim();
    const sourceUrl = byId("sourceUrl").value.trim();

    if (!file) return feedback("Selecione um arquivo CSV ou JSON.", "error");
    if (!byId("sourceAuthorized").checked) return feedback("Confirme a autorização ou o direito de uso da fonte.", "error");
    if (!sourceName) return feedback("Informe o nome da fonte autorizada.", "error");
    if (file.size > SuzyCalendarCore.MAX_FILE_BYTES) return feedback("O arquivo excede o limite de 2 MB.", "error");

    const extension = file.name.split(".").pop().toLowerCase();
    if (!["csv", "json"].includes(extension)) return feedback("Use um arquivo CSV ou JSON.", "error");

    try {
      const result = SuzyCalendarCore.importCalendarText(await file.text(), extension, { sourceName, sourceUrl });
      state = {
        version: SuzyCalendarCore.STORAGE_VERSION,
        sourceName,
        sourceUrl: SuzyCalendarCore.normalizeUrl(sourceUrl) || "",
        authorized: true,
        mode: "authorized",
        savedAt: new Date().toISOString(),
        events: result.events
      };
      persist();
      render();
      byId("calendarFile").value = "";
      const notes = [];
      if (result.rejected.length) notes.push(`${result.rejected.length} linha(s) rejeitada(s)`);
      if (result.duplicates) notes.push(`${result.duplicates} duplicata(s) removida(s)`);
      feedback(`${result.events.length} evento(s) importado(s).${notes.length ? ` ${notes.join("; ")}.` : ""}`, result.rejected.length ? "warning" : "success");
    } catch (error) {
      feedback(error.message, "error");
    }
  }

  function exportNormalized() {
    if (!state.events.length) return;
    const snapshot = {
      version: SuzyCalendarCore.STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      sourceName: state.sourceName,
      sourceUrl: state.sourceUrl,
      authorized: state.authorized,
      mode: state.mode,
      events: state.events
    };
    download(JSON.stringify(snapshot, null, 2), `suzy-calendario-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    feedback("Calendário normalizado exportado em JSON.", "success");
  }

  function downloadTemplate() {
    const csv = [
      "datetime,currency,event,impact,previous,forecast,actual,source,source_url",
      '2026-08-03T13:30:00-03:00,USD,"Evento econômico de exemplo",HIGH,"valor anterior","valor previsto",,"Nome da fonte autorizada",https://exemplo.invalid/'
    ].join("\n");
    download(csv, "modelo-calendario-economico.csv", "text/csv;charset=utf-8");
    feedback("Modelo CSV baixado. Substitua o exemplo por dados que você pode utilizar legalmente.", "success");
  }

  function clearCalendar() {
    if (!state.events.length) return;
    if (!confirm("Remover todos os eventos salvos neste navegador?")) return;
    state = defaultState();
    localStorage.removeItem(STORAGE_KEY);
    byId("sourceName").value = "";
    byId("sourceUrl").value = "";
    byId("sourceAuthorized").checked = false;
    render();
    feedback("Calendário removido deste navegador.", "success");
  }

  function resetFilters() {
    byId("filterFrom").value = "";
    byId("filterTo").value = "";
    byId("filterCurrency").value = "ALL";
    byId("filterImpact").value = "ALL";
    byId("filterStatus").value = "ALL";
    renderRows(new Date());
  }

  byId("importCalendar").addEventListener("click", importFile);
  byId("loadDemo").addEventListener("click", loadDemo);
  byId("downloadTemplate").addEventListener("click", downloadTemplate);
  byId("exportCalendar").addEventListener("click", exportNormalized);
  byId("clearCalendar").addEventListener("click", clearCalendar);
  byId("resetFilters").addEventListener("click", resetFilters);
  ["filterFrom", "filterTo", "filterCurrency", "filterImpact", "filterStatus"].forEach(id => byId(id).addEventListener("change", () => renderRows(new Date())));

  byId("sourceName").value = state.sourceName || "";
  byId("sourceUrl").value = state.sourceUrl || "";
  byId("sourceAuthorized").checked = Boolean(state.authorized);
  render();
  setInterval(() => {
    renderSummary(new Date());
    renderRows(new Date());
  }, 30000);
})();