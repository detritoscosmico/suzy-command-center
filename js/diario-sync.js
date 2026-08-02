(function () {
  const byId = id => document.getElementById(id);
  const syncState = {
    available: false,
    authenticated: false,
    csrfToken: null,
    username: null,
    remoteEntries: [],
    automatic: false,
    busy: false
  };
  let queue = Promise.resolve();

  function normalizedEntries(source) {
    if (!Array.isArray(source)) return [];
    return source.map(SuzyJournalCore.normalizeJournalEntry).filter(Boolean);
  }

  function localFingerprint() {
    return SuzyJournalSyncCore.fingerprintJournal(entries);
  }

  function remoteFingerprint() {
    return SuzyJournalSyncCore.fingerprintJournal(syncState.remoteEntries);
  }

  function snapshotsState() {
    return SuzyJournalSyncCore.compareJournalSnapshots(entries, syncState.remoteEntries);
  }

  function setFeedback(message = "", type = "") {
    const element = byId("syncFeedback");
    element.textContent = message;
    element.className = `sync-feedback ${type}`.trim();
  }

  function setStatus(title, details, type = "") {
    const status = byId("syncStatus");
    status.textContent = title;
    status.className = `sync-status ${type}`.trim();
    byId("syncDetails").textContent = details;
  }

  function setStorageNotice(title, details, mode = "") {
    byId("storageNoticeTitle").textContent = title;
    byId("storageNoticeText").textContent = details;
    byId("storageNotice").className = `local-warning ${mode}`.trim();
  }

  function renderSyncUi() {
    const canUseServer = syncState.available && syncState.authenticated;
    byId("syncToServer").disabled = syncState.busy || !canUseServer;
    byId("restoreFromServer").disabled = syncState.busy || !canUseServer;

    if (!syncState.available) {
      byId("storageModeBadge").textContent = "PROCESSO • SOMENTE NAVEGADOR";
      setStatus("Somente neste navegador", "Inicie o modo local seguro para ativar o SQLite.", "warning");
      setStorageNotice("ARMAZENAMENTO LOCAL", "Registros, versões e lixeira permanecem neste navegador. O GitHub Pages não executa o backend.");
      return;
    }

    if (!syncState.authenticated) {
      byId("storageModeBadge").textContent = "PROCESSO • LOGIN NECESSÁRIO";
      setStatus("Conta local desconectada", "Entre na conta para sincronizar diretamente com o SQLite.", "warning");
      setStorageNotice("SERVIDOR LOCAL ATIVO", "O SQLite está disponível para os registros ativos; versões e lixeira continuam locais.", "conflict");
      return;
    }

    byId("storageModeBadge").textContent = `PROCESSO • SQLITE • ${syncState.username}`;
    const comparison = snapshotsState();
    if (syncState.automatic && ["equal", "empty"].includes(comparison)) {
      setStatus("Sincronização automática ativa", `${entries.length} registro${entries.length === 1 ? "" : "s"} ativo${entries.length === 1 ? "" : "s"} protegido${entries.length === 1 ? "" : "s"} no navegador e no SQLite.`, "success");
      setStorageNotice("SQLITE SINCRONIZADO", "Registros ativos são sincronizados. Versões e lixeira entram no backup JSON local.", "sqlite");
      return;
    }

    if (comparison === "local-only") {
      setStatus("Dados aguardando envio", "Este navegador possui registros ativos e o SQLite está vazio.", "warning");
    } else if (comparison === "remote-only") {
      setStatus("Backup disponível no SQLite", "Use “Restaurar do SQLite” para recuperar os registros ativos neste navegador.", "warning");
    } else if (comparison === "diverged") {
      setStatus("Versões diferentes detectadas", "Escolha explicitamente qual conjunto de registros ativos deve prevalecer.", "warning");
    } else {
      setStatus("Pronto para sincronizar", "Escolha salvar no SQLite ou restaurar a cópia persistida.", "warning");
    }
    setStorageNotice("REVISÃO NECESSÁRIA", "Nenhum registro ativo foi substituído automaticamente. Versões e lixeira permanecem locais.", "conflict");
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      const error = new Error(payload.error || `Falha HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function handleApiError(error) {
    if (error.status === 401) {
      syncState.authenticated = false;
      syncState.csrfToken = null;
      syncState.automatic = false;
      setFeedback("A sessão expirou. Entre novamente na conta local.", "error");
    } else {
      syncState.automatic = false;
      setFeedback(error.message || "Não foi possível sincronizar.", "error");
    }
    renderSyncUi();
  }

  async function fetchRemoteJournal() {
    const payload = await requestJson("/api/journal");
    syncState.remoteEntries = normalizedEntries(payload.entries);
    return syncState.remoteEntries;
  }

  async function detectBackend() {
    try {
      const health = await requestJson("/api/health");
      if (health.status !== "ok" || health.storage !== "sqlite-local") throw new Error("Backend incompatível.");
      syncState.available = true;

      const auth = await requestJson("/api/auth/status");
      syncState.authenticated = Boolean(auth.authenticated);
      syncState.csrfToken = auth.csrfToken || null;
      syncState.username = auth.username || null;

      if (syncState.authenticated) {
        await fetchRemoteJournal();
        const comparison = snapshotsState();
        syncState.automatic = comparison === "equal" || comparison === "empty";
      }
    } catch {
      syncState.available = false;
      syncState.authenticated = false;
      syncState.csrfToken = null;
      syncState.automatic = false;
    }
    renderSyncUi();
  }

  async function putCurrentJournal() {
    const payload = await requestJson("/api/journal", {
      method: "PUT",
      headers: { "X-CSRF-Token": syncState.csrfToken },
      body: JSON.stringify({ entries })
    });
    syncState.remoteEntries = SuzyJournalSyncCore.cloneJournal(entries);
    syncState.automatic = true;
    setFeedback(`${payload.total} registro${payload.total === 1 ? "" : "s"} ativo${payload.total === 1 ? "" : "s"} salvo${payload.total === 1 ? "" : "s"} no SQLite.`, "success");
    renderSyncUi();
  }

  async function synchronizeCurrentSafely() {
    const knownRemoteFingerprint = remoteFingerprint();
    const currentLocalFingerprint = localFingerprint();
    await fetchRemoteJournal();
    const freshRemoteFingerprint = remoteFingerprint();

    if (freshRemoteFingerprint !== knownRemoteFingerprint && freshRemoteFingerprint !== currentLocalFingerprint) {
      syncState.automatic = false;
      setFeedback("O SQLite foi alterado em outra aba. A sincronização automática foi pausada para evitar sobrescrita.", "warning");
      renderSyncUi();
      return;
    }

    if (freshRemoteFingerprint === currentLocalFingerprint) {
      syncState.automatic = true;
      renderSyncUi();
      return;
    }

    await putCurrentJournal();
  }

  function enqueue(task) {
    queue = queue.then(task, task);
    return queue;
  }

  async function saveToSqlite() {
    if (!syncState.authenticated) return;
    const freshRemote = await fetchRemoteJournal();
    const different = SuzyJournalSyncCore.fingerprintJournal(freshRemote) !== localFingerprint();
    if (freshRemote.length && different) {
      const confirmed = confirm(`O SQLite possui ${freshRemote.length} registro${freshRemote.length === 1 ? "" : "s"} ativo${freshRemote.length === 1 ? "" : "s"} diferente${freshRemote.length === 1 ? "" : "s"}. Substituir pela versão deste navegador?`);
      if (!confirmed) {
        setFeedback("Envio cancelado. Nenhum dado foi substituído.", "warning");
        renderSyncUi();
        return;
      }
    }
    await putCurrentJournal();
  }

  async function restoreFromSqlite() {
    if (!syncState.authenticated) return;
    const remote = await fetchRemoteJournal();
    const different = remoteFingerprint() !== localFingerprint();
    if (entries.length && different) {
      const confirmed = confirm(`A restauração substituirá ${entries.length} registro${entries.length === 1 ? "" : "s"} ativo${entries.length === 1 ? "" : "s"} deste navegador pela cópia do SQLite. A lixeira e o histórico local não serão apagados. Continuar?`);
      if (!confirmed) {
        setFeedback("Restauração cancelada. Nenhum dado foi substituído.", "warning");
        renderSyncUi();
        return;
      }
    }

    entries = normalizedEntries(remote);
    render();
    syncState.remoteEntries = SuzyJournalSyncCore.cloneJournal(entries);
    syncState.automatic = true;
    setFeedback(`${entries.length} registro${entries.length === 1 ? "" : "s"} ativo${entries.length === 1 ? "" : "s"} restaurado${entries.length === 1 ? "" : "s"} do SQLite.`, "success");
    renderSyncUi();
  }

  async function runBusy(task) {
    if (syncState.busy) return;
    syncState.busy = true;
    renderSyncUi();
    setFeedback("Processando...", "");
    try {
      await task();
    } catch (error) {
      handleApiError(error);
    } finally {
      syncState.busy = false;
      renderSyncUi();
    }
  }

  function synchronizeMutation() {
    setTimeout(() => {
      if (!syncState.authenticated) return;
      if (!syncState.automatic) {
        setFeedback("Alteração nos registros ativos salva somente no navegador até você escolher a direção da sincronização.", "warning");
        renderSyncUi();
        return;
      }
      if (localFingerprint() === remoteFingerprint()) return;
      enqueue(() => runBusy(synchronizeCurrentSafely));
    }, 0);
  }

  byId("syncToServer").addEventListener("click", () => enqueue(() => runBusy(saveToSqlite)));
  byId("restoreFromServer").addEventListener("click", () => enqueue(() => runBusy(restoreFromSqlite)));
  document.addEventListener("journal:mutated", synchronizeMutation);

  detectBackend();
})();
