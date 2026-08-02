const authState = {
  csrfToken: null,
  authenticated: false,
  recoveryConfigured: false,
  recoveryKey: null
};
const byId = id => document.getElementById(id);

function feedback(message, type = "") {
  byId("authFeedback").textContent = message;
  byId("authFeedback").className = `feedback ${type}`.trim();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok) {
    const error = new Error(payload.error || `Falha HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showMode(mode) {
  byId("setupForm").hidden = mode !== "setup";
  byId("loginForm").hidden = mode !== "login";
  byId("recoveryForm").hidden = mode !== "recovery";
  byId("sessionPanel").hidden = mode !== "session";
}

function clearSensitiveInputs() {
  [
    "setupPassword",
    "setupPasswordConfirm",
    "loginPassword",
    "recoveryKey",
    "recoveryPassword",
    "recoveryPasswordConfirm",
    "recoveryCurrentPassword",
    "changeCurrentPassword",
    "changeNewPassword",
    "changeNewPasswordConfirm"
  ].forEach(id => { byId(id).value = ""; });
}

function updateRecoveryStatus() {
  byId("recoveryStatus").textContent = authState.recoveryConfigured
    ? "Uma chave de recuperação está configurada. Gerar outra invalida imediatamente a anterior."
    : "Esta conta foi criada antes da recuperação por chave. Gere uma chave agora e guarde-a fora do computador.";
}

function showRecoveryKey(recoveryKey) {
  authState.recoveryKey = String(recoveryKey || "");
  byId("recoveryKeyValue").textContent = authState.recoveryKey || "—";
  byId("recoveryKeyPanel").hidden = !authState.recoveryKey;
  if (authState.recoveryKey) {
    authState.recoveryConfigured = true;
    updateRecoveryStatus();
    byId("recoveryKeyPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function dismissRecoveryKey() {
  authState.recoveryKey = null;
  byId("recoveryKeyValue").textContent = "—";
  byId("recoveryKeyPanel").hidden = true;
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
    authState.recoveryConfigured = Boolean(status.recoveryConfigured);
    if (status.authenticated) {
      byId("sessionUsername").textContent = status.username;
      updateRecoveryStatus();
      showMode("session");
      await refreshRemoteSummary();
    } else {
      showMode(status.configured ? "login" : "setup");
    }
  } catch {
    authState.csrfToken = null;
    authState.authenticated = false;
    authState.recoveryConfigured = false;
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

function downloadText(content, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
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
    authState.authenticated = true;
    clearSensitiveInputs();
    showRecoveryKey(result.recoveryKey);
    feedback("Conta criada. Guarde a chave de recuperação antes de fechar a página.", "warning");
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
    authState.authenticated = true;
    authState.recoveryConfigured = Boolean(result.recoveryConfigured);
    byId("loginPassword").value = "";
    feedback("Sessão iniciada.", "success");
    await refreshStatus();
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("showRecoveryForm").addEventListener("click", () => {
  byId("recoveryUsername").value = byId("loginUsername").value;
  feedback("");
  showMode("recovery");
});

byId("cancelRecovery").addEventListener("click", () => {
  clearSensitiveInputs();
  feedback("");
  showMode("login");
});

byId("recoveryForm").addEventListener("submit", async event => {
  event.preventDefault();
  const newPassword = byId("recoveryPassword").value;
  if (newPassword !== byId("recoveryPasswordConfirm").value) {
    feedback("As novas senhas não coincidem.", "error");
    return;
  }
  try {
    const result = await api("/api/auth/recover", {
      method: "POST",
      body: JSON.stringify({
        username: byId("recoveryUsername").value,
        recoveryKey: byId("recoveryKey").value,
        newPassword
      })
    });
    authState.csrfToken = result.csrfToken;
    authState.authenticated = true;
    clearSensitiveInputs();
    showRecoveryKey(result.recoveryKey);
    feedback("Senha redefinida. Todas as sessões anteriores foram encerradas. Guarde a nova chave.", "warning");
    await refreshStatus();
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("recoveryKeyForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const result = await api("/api/auth/recovery-key", {
      method: "POST",
      headers: { "X-CSRF-Token": authState.csrfToken || "" },
      body: JSON.stringify({ currentPassword: byId("recoveryCurrentPassword").value })
    });
    byId("recoveryCurrentPassword").value = "";
    showRecoveryKey(result.recoveryKey);
    feedback("Nova chave gerada. A chave anterior não funciona mais.", "warning");
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("changePasswordForm").addEventListener("submit", async event => {
  event.preventDefault();
  const newPassword = byId("changeNewPassword").value;
  if (newPassword !== byId("changeNewPasswordConfirm").value) {
    feedback("As novas senhas não coincidem.", "error");
    return;
  }
  try {
    const result = await api("/api/auth/change-password", {
      method: "POST",
      headers: { "X-CSRF-Token": authState.csrfToken || "" },
      body: JSON.stringify({
        currentPassword: byId("changeCurrentPassword").value,
        newPassword
      })
    });
    authState.csrfToken = result.csrfToken;
    clearSensitiveInputs();
    showRecoveryKey(result.recoveryKey);
    feedback("Senha alterada. As sessões anteriores foram encerradas e a chave foi trocada.", "warning");
    await refreshStatus();
  } catch (error) {
    feedback(error.message, "error");
  }
});

byId("copyRecoveryKey").addEventListener("click", async () => {
  if (!authState.recoveryKey) return;
  try {
    await navigator.clipboard.writeText(authState.recoveryKey);
    feedback("Chave copiada. Guarde-a em local seguro.", "success");
  } catch {
    feedback("Não foi possível copiar automaticamente. Selecione a chave e copie manualmente.", "error");
  }
});

byId("downloadRecoveryKey").addEventListener("click", () => {
  if (!authState.recoveryKey) return;
  downloadText(
    `SUZY COMMAND CENTER — CHAVE DE RECUPERAÇÃO\n\n${authState.recoveryKey}\n\nGuarde este arquivo fora da pasta do projeto. A chave anterior deixa de funcionar quando uma nova é gerada.\n`,
    `suzy-chave-recuperacao-${new Date().toISOString().slice(0, 10)}.txt`
  );
  feedback("Arquivo da chave baixado. Confirme onde ele foi salvo.", "success");
});

byId("dismissRecoveryKey").addEventListener("click", () => {
  if (!confirm("Confirma que guardou a chave? Ela não será exibida novamente.")) return;
  dismissRecoveryKey();
  feedback("Chave removida da tela.", "success");
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
    clearSensitiveInputs();
    dismissRecoveryKey();
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
