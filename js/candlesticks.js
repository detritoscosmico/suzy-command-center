(function () {
  const data = globalThis.SuzyCandlestickStudyData;
  const entries = Array.isArray(data?.entries) ? data.entries : [];

  const elements = {
    search: document.querySelector("#studySearch"),
    section: document.querySelector("#studySection"),
    asset: document.querySelector("#studyAsset"),
    timeframe: document.querySelector("#studyTimeframe"),
    indication: document.querySelector("#studyIndication"),
    reliability: document.querySelector("#studyReliability"),
    clear: document.querySelector("#clearStudyFilters"),
    results: document.querySelector("#studyResults"),
    resultCount: document.querySelector("#studyResultCount"),
    metricTotal: document.querySelector("#metricTotal"),
    metricPatterns: document.querySelector("#metricPatterns"),
    metricAssets: document.querySelector("#metricAssets"),
    metricTimeframes: document.querySelector("#metricTimeframes")
  };

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function unique(field) {
    return [...new Set(entries.map(entry => entry[field]).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { numeric: true }));
  }

  function addOptions(select, values) {
    if (!select) return;
    for (const value of values) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
  }

  function safeSourceUrl(value) {
    try {
      const url = new URL(String(value));
      if (url.protocol !== "https:") return "";
      if (!(url.hostname === "investing.com" || url.hostname.endsWith(".investing.com"))) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function textLine(label, value) {
    const row = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    row.append(strong, document.createTextNode(value || "Não informado na captura"));
    return row;
  }

  function badge(label, className = "") {
    const span = document.createElement("span");
    span.className = `study-badge ${className}`.trim();
    span.textContent = label;
    return span;
  }

  function indicationClass(value) {
    const normalized = normalize(value);
    if (normalized.includes("altista")) return "bullish";
    if (normalized.includes("baixista") || normalized.includes("baixa")) return "bearish";
    return "neutral";
  }

  function createCard(entry) {
    const article = document.createElement("article");
    article.className = "study-card";
    article.dataset.entry = "candlestick";

    const top = document.createElement("div");
    top.className = "study-card-top";
    const headingWrap = document.createElement("div");
    const eyebrow = document.createElement("span");
    eyebrow.className = "study-card-eyebrow";
    eyebrow.textContent = `${entry.asset} • ${entry.timeframe}`;
    const heading = document.createElement("h2");
    heading.textContent = entry.pattern;
    headingWrap.append(eyebrow, heading);

    const sectionBadge = badge(entry.section === "emergente" ? "EMERGENTE NA CAPTURA" : `OCORRÊNCIA ${entry.status || "—"}`, entry.section === "emergente" ? "emerging" : "complete");
    top.append(headingWrap, sectionBadge);

    const badges = document.createElement("div");
    badges.className = "study-badges";
    if (entry.indication) badges.append(badge(entry.indication, indicationClass(entry.indication)));
    if (entry.reliability) badges.append(badge(`Confiabilidade: ${entry.reliability}`, "reliability"));
    if (!entry.indication && !entry.reliability) badges.append(badge("Classificação detalhada não informada", "neutral"));

    const details = document.createElement("div");
    details.className = "study-card-details";
    if (entry.reference) details.append(textLine("Referência temporal da captura", entry.reference));
    details.append(textLine("Descrição extensa", entry.hasDescription ? "Disponível na fonte original; não republicada nesta biblioteca" : "Não fornecida para esta ocorrência"));

    const footer = document.createElement("div");
    footer.className = "study-card-footer";
    const line = document.createElement("span");
    line.textContent = `Linha de origem na base: ${entry.sourceLine}`;
    const sourceUrl = safeSourceUrl(entry.sourceUrl);
    if (sourceUrl) {
      const link = document.createElement("a");
      link.href = sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "ABRIR REFERÊNCIA DE ORIGEM";
      footer.append(line, link);
    } else {
      footer.append(line);
    }

    article.append(top, badges, details, footer);
    return article;
  }

  function matches(entry) {
    const query = normalize(elements.search?.value);
    const section = elements.section?.value || "";
    const asset = elements.asset?.value || "";
    const timeframe = elements.timeframe?.value || "";
    const indication = elements.indication?.value || "";
    const reliability = elements.reliability?.value || "";

    const haystack = normalize([
      entry.asset,
      entry.timeframe,
      entry.pattern,
      entry.indication,
      entry.reliability,
      entry.reference
    ].join(" "));

    return (!query || haystack.includes(query))
      && (!section || entry.section === section)
      && (!asset || entry.asset === asset)
      && (!timeframe || entry.timeframe === timeframe)
      && (!indication || entry.indication === indication)
      && (!reliability || entry.reliability === reliability);
  }

  function render() {
    if (!elements.results) return;
    const filtered = entries.filter(matches);
    elements.results.replaceChildren(...filtered.map(createCard));
    if (elements.resultCount) elements.resultCount.textContent = `${filtered.length} de ${entries.length} registros exibidos`;

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "study-empty";
      empty.textContent = "Nenhum registro corresponde aos filtros atuais.";
      elements.results.append(empty);
    }
  }

  function clearFilters() {
    if (elements.search) elements.search.value = "";
    for (const select of [elements.section, elements.asset, elements.timeframe, elements.indication, elements.reliability]) {
      if (select) select.value = "";
    }
    render();
    elements.search?.focus();
  }

  addOptions(elements.asset, unique("asset"));
  addOptions(elements.timeframe, unique("timeframe"));
  addOptions(elements.indication, unique("indication"));
  addOptions(elements.reliability, unique("reliability"));

  if (elements.metricTotal) elements.metricTotal.textContent = String(entries.length);
  if (elements.metricPatterns) elements.metricPatterns.textContent = String(new Set(entries.map(entry => entry.pattern)).size);
  if (elements.metricAssets) elements.metricAssets.textContent = String(new Set(entries.map(entry => entry.asset)).size);
  if (elements.metricTimeframes) elements.metricTimeframes.textContent = String(new Set(entries.map(entry => entry.timeframe)).size);

  for (const control of [elements.search, elements.section, elements.asset, elements.timeframe, elements.indication, elements.reliability]) {
    control?.addEventListener(control === elements.search ? "input" : "change", render);
  }
  elements.clear?.addEventListener("click", clearFilters);

  render();
})();
