const REPLAY_STORAGE_KEY = "suzy-replay-lab-v2";
const LEGACY_REPLAY_STORAGE_KEY = "suzy-replay-lab-v1";
const REPLAY_BASE_PRICE = 1.08742;
const REPLAY_ASSET = "EUR/USD DEMO";
const REPLAY_TIMEFRAME = "M5";
const MAX_HISTORY_FILE_BYTES = 2 * 1024 * 1024;
const MAX_HISTORY_ROWS = 5000;

const $ = id => document.getElementById(id);
let replayState = loadReplayState() || createNewReplayState();

function createNewReplayState() {
  const candles = SuzyCore.generateDemoCandles({
    basePrice: REPLAY_BASE_PRICE,
    count: 120,
    intervalMinutes: 5
  });

  return SuzyReplayCore.createReplaySession(candles, {
    asset: REPLAY_ASSET,
    timeframe: REPLAY_TIMEFRAME,
    initialVisible: 30,
    source: "ARTIFICIAL",
    sourceName: "Cenário artificial gerado localmente pela Suzy"
  });
}

function loadReplayState() {
  try {
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY) || localStorage.getItem(LEGACY_REPLAY_STORAGE_KEY);
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.candles) || saved.candles.length < 20) return null;

    const validCandles = saved.candles.map(SuzyReplayCore.normalizeCandle).filter(Boolean);
    if (validCandles.length !== saved.candles.length) return null;

    return {
      ...saved,
      version: 2,
      source: saved.source || "ARTIFICIAL",
      sourceName: saved.sourceName || "Sessão restaurada do navegador",
      candles: validCandles,
      cursor: Math.min(Math.max(20, Number(saved.cursor) || 30), validCandles.length),
      trades: Array.isArray(saved.trades) ? saved.trades : [],
      openTrade: saved.openTrade || null,
      complete: Boolean(saved.complete)
    };
  } catch (error) {
    console.warn("Não foi possível restaurar o replay.", error);
    return null;
  }
}

function saveReplayState() {
  try {
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replayState));
    localStorage.removeItem(LEGACY_REPLAY_STORAGE_KEY);
  } catch (error) {
    console.warn("Não foi possível salvar o replay no navegador.", error);
  }
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

function priceDecimals(value) {
  const absolute = Math.abs(Number(value) || 0);
  if (absolute >= 1000) return 2;
  if (absolute >= 10) return 3;
  if (absolute >= 1) return 5;
  return 8;
}

function price(value) {
  return Number(value).toFixed(priceDecimals(value));
}

function signedR(value) {
  const number = Number(value) || 0;
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}R`;
}

function setMessage(text, type = "") {
  $("replayMessage").textContent = text;
  $("replayMessage").className = `message ${type}`.trim();
}

function setImportFeedback(text, type = "") {
  $("importFeedback").textContent = text;
  $("importFeedback").className = `import-feedback ${type}`.trim();
}

function currentCandle() {
  const visible = SuzyReplayCore.visibleCandles(replayState);
  return visible.at(-1) || null;
}

function renderReplay() {
  const visible = SuzyReplayCore.visibleCandles(replayState);
  const candle = visible.at(-1);
  const summary = SuzyReplayCore.summarizeReplay(replayState.trades);
  const imported = replayState.source === "CSV_IMPORT";

  $("replayTitle").textContent = `${replayState.asset} • ${replayState.timeframe}`;
  $("replaySource").textContent = imported ? "HISTÓRICO IMPORTADO" : "CENÁRIO ARTIFICIAL";
  $("replaySource").className = imported ? "green" : "orange";
  $("replaySourceName").textContent = replayState.sourceName || "Origem não informada";
  $("replayProgress").textContent = `${replayState.cursor}/${replayState.candles.length}`;
  $("replayTrades").textContent = summary.total;
  $("replayTotalR").textContent = signedR(summary.totalR);
  $("replayTotalR").className = summary.totalR > 0 ? "green" : summary.totalR < 0 ? "red" : "";
  $("replayExpectancy").textContent = signedR(summary.expectancy);
  $("replayDrawdown").textContent = `${summary.maxDrawdown.toFixed(2)}R`;

  if (candle) {
    $("replayOpen").textContent = price(candle.open);
    $("replayHigh").textContent = price(candle.high);
    $("replayLow").textContent = price(candle.low);
    $("replayClose").textContent = price(candle.close);
  }

  const hasOpenTrade = Boolean(replayState.openTrade);
  $("openLong").disabled = hasOpenTrade || replayState.complete;
  $("openShort").disabled = hasOpenTrade || replayState.complete;
  $("advanceCandle").disabled = replayState.complete;
  $("advanceCandle").textContent = replayState.complete ? "REPLAY CONCLUÍDO" : "AVANÇAR 1 CANDLE";

  renderPosition();
  renderResults();
  drawReplayChart(visible);
  saveReplayState();
}

function renderPosition() {
  const trade = replayState.openTrade;
  $("positionEmpty").hidden = Boolean(trade);
  $("positionDetails").hidden = !trade;

  if (!trade) return;

  $("positionDirection").textContent = trade.direction === "LONG" ? "COMPRADO" : "VENDIDO";
  $("positionDirection").className = trade.direction === "LONG" ? "green" : "red";
  $("positionEntry").textContent = price(trade.entry);
  $("positionStop").textContent = price(trade.stop);
  $("positionTarget").textContent = price(trade.target);
}

function renderResults() {
  const rows = [...replayState.trades].reverse();

  $("replayResults").innerHTML = rows.length
    ? rows.map((trade, index) => `
      <tr>
        <td>${rows.length - index}</td>
        <td>${trade.direction === "LONG" ? "COMPRADO" : "VENDIDO"}</td>
        <td>${price(trade.entry)}</td>
        <td>${price(trade.stop)}</td>
        <td>${price(trade.target)}</td>
        <td class="${trade.result === "WIN" ? "green" : trade.result === "LOSS" ? "red" : "orange"}">${trade.result}</td>
        <td class="${trade.rMultiple > 0 ? "green" : trade.rMultiple < 0 ? "red" : ""}">${signedR(trade.rMultiple)}</td>
        <td>${escapeHtml(trade.note || trade.reason || "Sem observação")}</td>
      </tr>`).join("")
    : '<tr><td colspan="8" class="empty-row">Nenhum trade concluído.</td></tr>';
}

function openTrade(direction) {
  const result = SuzyReplayCore.openReplayTrade(replayState, {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${replayState.cursor}`,
    direction,
    stopDistancePct: $("stopDistance").value,
    riskReward: $("riskReward").value,
    note: $("tradeNote").value
  });

  if (result.error) {
    setMessage(result.error, "error");
    return;
  }

  replayState = result.state;
  $("tradeNote").value = "";
  setMessage(`${direction === "LONG" ? "Compra" : "Venda"} registrada. Avance os candles sem alterar o plano.`, "success");
  renderReplay();
}

function advanceOneCandle() {
  const result = SuzyReplayCore.advanceReplay(replayState);
  replayState = result.state;

  if (result.event.type === "TRADE_CLOSED") {
    const trade = result.event.trade;
    setMessage(`${trade.result}: ${signedR(trade.rMultiple)}. ${trade.reason}`, trade.result === "WIN" ? "success" : "error");
  } else if (replayState.complete) {
    setMessage("Replay concluído. Revise o diário e a expectativa da sessão.", "success");
  } else {
    setMessage("Um novo candle foi revelado. Analise somente os dados visíveis.");
  }

  renderReplay();
}

function startNewSession() {
  const hasActivity = replayState.trades.length || replayState.openTrade || replayState.cursor > 30 || replayState.source === "CSV_IMPORT";
  if (hasActivity && !confirm("Iniciar uma nova sessão artificial e apagar o replay atual?")) return;

  replayState = createNewReplayState();
  setImportFeedback("");
  setMessage("Nova sessão artificial criada. Os candles futuros continuam ocultos.", "success");
  renderReplay();
}

async function importHistoricalFile() {
  const file = $("historyFile").files?.[0];
  if (!file) {
    setImportFeedback("Selecione um arquivo CSV.", "error");
    return;
  }
  if (file.size > MAX_HISTORY_FILE_BYTES) {
    setImportFeedback("Arquivo acima do limite de 2 MB.", "error");
    return;
  }

  $("importHistory").disabled = true;
  setImportFeedback("Validando o histórico...");

  try {
    const text = await file.text();
    const parsed = SuzyReplayCore.parseHistoricalCsv(text, {
      maximumRows: MAX_HISTORY_ROWS,
      minimumCandles: 30
    });

    if (!parsed.valid) {
      setImportFeedback(parsed.errors.slice(0, 3).join(" ") || "Histórico inválido.", "error");
      return;
    }

    const hasActivity = replayState.trades.length || replayState.openTrade || replayState.cursor > 30;
    if (hasActivity && !confirm("Importar este histórico e substituir a sessão atual?")) {
      setImportFeedback("Importação cancelada.");
      return;
    }

    const initialVisible = Math.min(50, Math.max(20, Math.floor(parsed.candles.length * 0.25)));
    replayState = SuzyReplayCore.createReplaySession(parsed.candles, {
      asset: $("importAsset").value,
      timeframe: $("importTimeframe").value,
      initialVisible,
      source: "CSV_IMPORT",
      sourceName: file.name
    });

    const notes = [];
    if (parsed.invalidRows) notes.push(`${parsed.invalidRows} linhas inválidas descartadas`);
    if (parsed.duplicateRows) notes.push(`${parsed.duplicateRows} duplicadas descartadas`);
    notes.push(...parsed.warnings);

    setImportFeedback(
      `${parsed.validRows} candles importados com segurança.${notes.length ? ` ${[...new Set(notes)].join("; ")}.` : ""}`,
      "success"
    );
    setMessage("Histórico importado. Os candles futuros permanecem ocultos.", "success");
    renderReplay();
  } catch (error) {
    console.error("Falha ao importar histórico.", error);
    setImportFeedback("Não foi possível ler o arquivo selecionado.", "error");
  } finally {
    $("importHistory").disabled = false;
  }
}

function downloadCsvTemplate() {
  const candles = SuzyCore.generateDemoCandles({
    basePrice: 1.08742,
    count: 40,
    intervalMinutes: 5,
    endTime: Date.UTC(2026, 0, 2, 15, 0, 0)
  });
  const rows = candles.map(candle => [
    new Date(candle.time).toISOString(),
    candle.open,
    candle.high,
    candle.low,
    candle.close
  ]);
  const csv = SuzyCore.serializeCsv([["time", "open", "high", "low", "close"], ...rows], ",");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-historico-replay.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportReplayCsv() {
  if (!replayState.trades.length) {
    alert("Nenhum trade concluído para exportar.");
    return;
  }

  const header = ["origem", "ativo", "timeframe", "direcao", "entrada", "stop", "alvo", "resultado", "r_multiplo", "motivo", "observacao"];
  const rows = replayState.trades.map(trade => [
    replayState.source,
    replayState.asset,
    replayState.timeframe,
    trade.direction,
    trade.entry,
    trade.stop,
    trade.target,
    trade.result,
    trade.rMultiple,
    trade.reason,
    trade.note
  ]);
  const csv = SuzyCore.serializeCsv([header, ...rows]);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `suzy-replay-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawReplayChart(candles) {
  const canvas = $("replayChart");
  if (!canvas || !candles.length) return;

  const width = Math.max(canvas.parentElement.clientWidth, 320);
  const height = canvas.parentElement.clientHeight || 470;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.fillStyle = "#06101d";
  ctx.fillRect(0, 0, width, height);

  const margin = { top: 22, right: 90, bottom: 34, left: 15 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = candles.flatMap(candle => [candle.high, candle.low]);

  if (replayState.openTrade) {
    values.push(replayState.openTrade.entry, replayState.openTrade.stop, replayState.openTrade.target);
  }

  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const padding = (highest - lowest || highest * 0.01) * 0.08;
  const maximum = highest + padding;
  const minimum = lowest - padding;
  const y = value => margin.top + ((maximum - value) / (maximum - minimum)) * plotHeight;
  const step = plotWidth / candles.length;
  const bodyWidth = Math.max(2, Math.min(10, step * 0.62));

  ctx.strokeStyle = "rgba(143,164,189,.16)";
  ctx.fillStyle = "#8fa4bd";
  ctx.lineWidth = 1;
  ctx.font = "11px Segoe UI";
  ctx.textAlign = "left";

  for (let line = 0; line <= 5; line += 1) {
    const py = margin.top + (plotHeight / 5) * line;
    ctx.beginPath();
    ctx.moveTo(margin.left, py);
    ctx.lineTo(width - margin.right, py);
    ctx.stroke();
    ctx.fillText(price(maximum - ((maximum - minimum) / 5) * line), width - margin.right + 8, py + 4);
  }

  candles.forEach((candle, index) => {
    const x = margin.left + step * index + step / 2;
    const rising = candle.close >= candle.open;
    const color = rising ? "#22e582" : "#ff6262";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y(candle.high));
    ctx.lineTo(x, y(candle.low));
    ctx.stroke();
    const top = y(Math.max(candle.open, candle.close));
    const bottom = y(Math.min(candle.open, candle.close));
    ctx.fillRect(x - bodyWidth / 2, top, bodyWidth, Math.max(1, bottom - top));
  });

  drawEma(ctx, candles, 9, "#38bdf8", margin, step, y);
  drawEma(ctx, candles, 21, "#ff5ec7", margin, step, y);

  if (replayState.openTrade) {
    drawLevel(ctx, y(replayState.openTrade.entry), width, margin, "#38bdf8", `ENTRADA ${price(replayState.openTrade.entry)}`);
    drawLevel(ctx, y(replayState.openTrade.stop), width, margin, "#ff6262", `STOP ${price(replayState.openTrade.stop)}`);
    drawLevel(ctx, y(replayState.openTrade.target), width, margin, "#22e582", `ALVO ${price(replayState.openTrade.target)}`);
  }

  ctx.fillStyle = "#8fa4bd";
  ctx.textAlign = "center";
  const labelStep = Math.max(1, Math.floor(candles.length / 5));
  for (let index = 0; index < candles.length; index += labelStep) {
    const candle = candles[index];
    const x = margin.left + step * index + step / 2;
    ctx.fillText(new Date(candle.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), x, height - 12);
  }
}

function drawEma(ctx, candles, period, color, margin, step, y) {
  const values = SuzyCore.calculateEma(candles.map(candle => candle.close), period);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = margin.left + step * index + step / 2;
    const py = y(value);
    if (index === 0) ctx.moveTo(x, py);
    else ctx.lineTo(x, py);
  });
  ctx.stroke();
}

function drawLevel(ctx, py, width, margin, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(margin.left, py);
  ctx.lineTo(width - margin.right, py);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = "right";
  ctx.font = "10px Segoe UI";
  ctx.fillText(label, width - margin.right - 5, py - 4);
  ctx.restore();
}

$("openLong").onclick = () => openTrade("LONG");
$("openShort").onclick = () => openTrade("SHORT");
$("advanceCandle").onclick = advanceOneCandle;
$("newSession").onclick = startNewSession;
$("importHistory").onclick = importHistoricalFile;
$("downloadTemplate").onclick = downloadCsvTemplate;
$("exportReplay").onclick = exportReplayCsv;
window.addEventListener("resize", () => drawReplayChart(SuzyReplayCore.visibleCandles(replayState)));

renderReplay();
