const authState = { csrfToken: null, authenticated: false };
const byId = id => document.getElementById(id);

function feedback(message, type = "") {
  byId("authFeedback").textContent = message;
  byId("authFeedback").className = `feedback ${type}`.trim();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok) throw new Error(payload.error || `Falha HTTP ${response.status}.`);
  return payload;
}

function showMode(mode) {
  byId("setupForm").hidden = mode !== "setup";
  byId("loginForm").hidden = mode !== "login";
  byId("sessionPanel").hidden = mode !== "session";
}

async function refreshRemoteSummary() {
  if (!authState.authenticated) return;
  const journal = await api("/api/journal", { method: "GET", headers: {} });
  byId("remoteJournalCount").textContent = String(journal.total);
}

async function refreshStatus() {
  try {
    const status = await api("/api/auth/status", { method: "GET", headers: {} });
    byId("serverNotice").className = "server-notice";
    byId("serverNotice").textContent = "Servidor local ativo em 127.0.0.1. Dados protegidos pelo banco SQLite local.";
    authState.csrfToken = status.csrfToken;
    authState.authenticated = status.authenticated;
    if (status.authenticated) {
      byId("sessionUsername").textContent = status.username;
      showMode("session");
      await refreshRemoteSummary();
    } else {
      showMode(status.configured ? "login" : "setup");
    }
  } catch {
    authState.csrfToken = null;
    authState.authenticated = false;
    showMode("none");
    byId("serverNotice").className = "server-notice offline";
    byId("serverNotice").textContent = "Modo público detectado. O GitHub Pages não executa backend. No computador, rode npm run serve:secure e abra o endereço local informado no terminal.";
  }
}

function downloadJson(payload, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

byId("setupForm").addEventListener("submit", async event => {
  event.preventDefault();
  const password = byId("setupPassword").value;
  if (password !== byId("setupPasswordConfirm").value) {
    feedback("As senhas não coincidem.", "error");
    return;
  }
  try {
    const result = await api("/api/auth/setup", {
      method: "POST",
      body: JSON.stringify({ username: byId("setupUsername").value, password })
    });
    authState.csrfToken = result.csrfToken;
    feedback("Conta local criada com sucesso.", "success");
    await refreshStatus();
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: byId("loginUsername").value,
        password: byId("loginPassword").value
      })
    });
    authState.csrfToken = result.csrfToken;
    byId("loginPassword").value = "";
    feedback("Sessão iniciada.", "success");
    await refreshStatus();
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("logoutButton").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": authState.csrfToken || "" },
      body: "{}"
    });
    authState.csrfToken = null;
    authState.authenticated = false;
    feedback("Sessão encerrada.", "success");
    await refreshStatus();
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("uploadBackup").addEventListener("click", async () => {
  const file = byId("backupFile").files[0];
  if (!file) return feedback("Selecione um backup JSON do diário.", "error");
  if (file.size > 2 * 1024 * 1024) return feedback("O arquivo excede o limite de 2 MB.", "error");
  try {
    const parsed = JSON.parse(await file.text());
    const entries = Array.isArray(parsed) ? parsed : parsed.entries;
    if (!Array.isArray(entries)) throw new Error("O arquivo não contém uma lista de registros.");
    if (!confirm(`Importar ${entries.length} registro(s)? O histórico atualmente salvo no banco será substituído.`)) return;
    const result = await api("/api/journal", {
      method: "PUT",
      headers: { "X-CSRF-Token": authState.csrfToken || "" },
      body: JSON.stringify({ entries })
    });
    byId("backupFile").value = "";
    byId("remoteJournalCount").textContent = String(result.total);
    feedback(`${result.total} registro(s) persistidos no banco local.`, "success");
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("downloadBackup").addEventListener("click", async () => {
  try {
    const result = await api("/api/journal", { method: "GET", headers: {} });
    downloadJson({ version: 1, exportedAt: new Date().toISOString(), entries: result.entries }, `suzy-diario-sqlite-${new Date().toISOString().slice(0, 10)}.json`);
    feedback(`${result.total} registro(s) exportados do banco local.`, "success");
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("clearRemoteJournal").addEventListener("click", async () => {
  if (!confirm("Apagar definitivamente o histórico persistido no banco local?")) return;
  try {
    const result = await api("/api/journal", {
      method: "PUT",
      headers: { "X-CSRF-Token": authState.csrfToken || "" },
      body: JSON.stringify({ entries: [] })
    });
    byId("remoteJournalCount").textContent = String(result.total);
    feedback("Histórico remoto apagado.", "success");
  } catch (error) {
    feedback(error.message, "error");
  }
});

refreshStatus();
