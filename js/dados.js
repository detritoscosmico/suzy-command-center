(function () {
  "use strict";
  const core = window.SuzyProvenanceCore;
  if (!core) return;
  const REGISTRY_KEY = "suzy-data-provenance-v1";
  const MAX_FILE_BYTES = 2 * 1024 * 1024;
  const $ = id => document.getElementById(id);
  let registry = loadRegistry();
  let currentText = "";
  let currentDigest = "";
  let currentLegacyDigest = "";
  let currentInspection = null;
  let loadSequence = 0;

  function loadRegistry() {
    try {
      const state = JSON.parse(localStorage.getItem(REGISTRY_KEY) || "{}");
      return core.normalizeRegistry(state.manifests || []);
    } catch {
      return [];
    }
  }

  function saveRegistry() {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), manifests: registry }));
  }

  async function sha256(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  }

  function renderPreview(rows = []) {
    const body = $("previewBody");
    body.replaceChildren();
    if (!rows.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.className = "empty";
      cell.textContent = "Sem prévia.";
      row.append(cell);
      body.append(row);
      return;
    }
    rows.forEach(item => {
      const row = document.createElement("tr");
      [item.timestamp, item.open, item.high, item.low, item.close].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.append(cell);
      });
      body.append(row);
    });
  }

  function renderInspection() {
    const inspection = currentInspection;
    $("fileDigest").textContent = currentDigest || "—";
    $("fileRows").textContent = String(inspection?.rowCount || 0);
    $("fileInvalid").textContent = String(inspection?.invalidRows || 0);
    $("fileDuplicates").textContent = String(inspection?.duplicateTimestamps || 0);
    $("filePeriod").textContent = inspection?.periodStart ? `Período detectado: ${inspection.periodStart} → ${inspection.periodEnd}` : "Período: —";
    $("inspectionStatus").textContent = inspection ? (inspection.valid ? "PASS — estrutura OHLC íntegra e sem timestamps duplicados." : `REPROVADO — ${inspection.error}`) : "Aguardando arquivo.";
    $("inspectionStatus").className = `status-line ${inspection ? (inspection.valid ? "pass" : "fail") : ""}`;
    $("kpiFileState").textContent = inspection ? (inspection.valid ? "VALIDADO" : "REPROVADO") : "NENHUM";
    $("kpiFileState").className = inspection ? (inspection.valid ? "pass" : "fail") : "";
    $("kpiFileDetail").textContent = inspection ? `${inspection.validRows || 0} linha(s) válida(s)` : "selecione um CSV";
    renderPreview(inspection?.rows || []);
  }

  async function loadFile() {
    const requestId = ++loadSequence;
    const file = $("datasetFile").files[0];
    const feedback = $("datasetFeedback");
    currentText = "";
    currentDigest = "";
    currentLegacyDigest = "";
    currentInspection = null;
    if (!file) { renderInspection(); return; }
    if (file.size > MAX_FILE_BYTES) {
      feedback.textContent = "Arquivo acima do limite local de 2 MB.";
      feedback.className = "feedback wide error";
      renderInspection();
      return;
    }
    const bytes = await file.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(bytes);
    const [digest, legacyDigest] = await Promise.all([
      sha256(bytes),
      sha256(new TextEncoder().encode(text))
    ]);
    if (requestId !== loadSequence || $("datasetFile").files[0] !== file) return;
    const inspection = core.inspectCsv(text, { timezone: $("sourceTimezone").value });
    currentText = text;
    currentDigest = digest;
    currentLegacyDigest = legacyDigest;
    currentInspection = inspection;
    feedback.textContent = currentInspection.valid ? "Arquivo lido localmente. Revise os metadados e crie o manifesto." : currentInspection.error;
    feedback.className = `feedback wide ${currentInspection.valid ? "success" : "error"}`;
    renderInspection();
  }

  function metadataFromForm() {
    return {
      datasetName: $("datasetName").value,
      sourceType: $("sourceType").value,
      sourceName: $("sourceName").value,
      sourceUrl: $("sourceUrl").value,
      license: $("sourceLicense").value,
      timezone: $("sourceTimezone").value,
      instrument: $("sourceInstrument").value,
      timeframe: $("sourceTimeframe").value,
      authorizationConfirmed: $("authorizationConfirmed").checked
    };
  }

  function refreshInspectionTimezone() {
    if (!currentText) return;
    currentInspection = core.inspectCsv(currentText, { timezone: $("sourceTimezone").value });
    renderInspection();
  }

  function syncSourceType() {
    const artificial = $("sourceType").value === "ARTIFICIAL";
    $("sourceLicense").disabled = artificial;
    $("authorizationConfirmed").disabled = artificial;
    $("classificationBanner").textContent = artificial ? "DADO ARTIFICIAL — ETIQUETA PERMANENTE" : "DADO AUTORIZADO — ARQUIVO LOCAL";
    $("classificationBanner").className = `wide classification-banner ${artificial ? "artificial" : ""}`;
  }

  function renderRegistry() {
    $("kpiDatasets").textContent = String(registry.length);
    $("kpiAuthorized").textContent = String(registry.filter(item => item.classification === "AUTHORIZED_LOCAL").length);
    $("kpiArtificial").textContent = String(registry.filter(item => item.classification === "ARTIFICIAL_PERMANENT").length);
    const body = $("registryBody");
    body.replaceChildren();
    if (!registry.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.className = "empty";
      cell.textContent = "Nenhum manifesto registrado.";
      row.append(cell);
      body.append(row);
    } else {
      registry.forEach(manifest => {
        const row = document.createElement("tr");
        const values = [manifest.metadata.datasetName, manifest.permanentLabel, manifest.metadata.sourceName, `${manifest.metadata.instrument} • ${manifest.metadata.timeframe}`, `${manifest.integrity.periodStart} → ${manifest.integrity.periodEnd}`, manifest.integrity.rows, `${manifest.integrity.sha256.slice(0, 16)}…`];
        values.forEach((value, index) => {
          const cell = document.createElement("td");
          cell.textContent = String(value);
          if (index === 6) cell.className = "digest-short";
          row.append(cell);
        });
        body.append(row);
      });
    }
    const select = $("verifyManifest");
    const selected = select.value;
    select.replaceChildren();
    registry.forEach(manifest => {
      const option = document.createElement("option");
      option.value = manifest.id;
      option.textContent = `${manifest.metadata.datasetName} • ${manifest.integrity.sha256.slice(0, 12)}`;
      select.append(option);
    });
    if (registry.some(item => item.id === selected)) select.value = selected;
  }

  function createManifest(event) {
    event.preventDefault();
    const feedback = $("datasetFeedback");
    try {
      if (!currentText || !currentDigest) throw new Error("Selecione e valide um arquivo CSV local primeiro.");
      const metadata = metadataFromForm();
      currentInspection = core.inspectCsv(currentText, { timezone: metadata.timezone });
      renderInspection();
      const manifest = core.createManifest(metadata, currentInspection, currentDigest);
      if (registry.some(item => core.verifyDigest(item, currentDigest, currentLegacyDigest).valid)) throw new Error("Este arquivo já possui manifesto registrado pelo mesmo SHA-256.");
      registry = core.normalizeRegistry([manifest, ...registry]);
      saveRegistry();
      renderRegistry();
      feedback.textContent = `Manifesto criado: ${manifest.permanentLabel}. O CSV bruto não foi salvo.`;
      feedback.className = "feedback wide success";
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = "feedback wide error";
    }
  }

  function verifyCurrentFile() {
    const manifest = registry.find(item => item.id === $("verifyManifest").value);
    const result = core.verifyDigest(manifest, currentDigest, currentLegacyDigest);
    $("verifyStatus").textContent = result.status;
    $("verifyStatus").className = result.valid ? "pass" : "fail";
    $("datasetFeedback").textContent = result.message;
    $("datasetFeedback").className = `feedback wide ${result.valid ? "success" : "error"}`;
  }

  function exportRegistry() {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), notice: "Manifestos de proveniência. CSV bruto e credenciais não são incluídos.", manifests: registry };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `suzy-proveniencia-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  $("datasetFile").addEventListener("change", loadFile);
  $("sourceTimezone").addEventListener("change", refreshInspectionTimezone);
  $("sourceType").addEventListener("change", syncSourceType);
  $("datasetForm").addEventListener("submit", createManifest);
  $("verifyFile").addEventListener("click", verifyCurrentFile);
  $("exportRegistry").addEventListener("click", exportRegistry);
  syncSourceType();
  renderRegistry();
  renderInspection();
})();
