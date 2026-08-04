(function () {
  const byId = id => document.getElementById(id);
  const syncState = {
    available: false,
    authenticated: false,
    csrfToken: null,
    username: null,
    remote: { entries: [], trash: [], history: {}, lifecycleFound: false, lifecycleError: null },
    automatic: false,
    busy: false
  };
  let queue = Promise.resolve();

  function normalizedEntries(source) {
    if (!Array.isArray(source)) return [];
    return source.map(SuzyJournalCore.normalizeJournalEntry).filter(Boolean);
  }

  function normalizedTrash(source) {
    if (!Array.isArray(source)) return [];
    return source.map(candidate => {
      const normalized = SuzyJournalCore.normalizeJournalEntry(candidate);
      const deletedAt = SuzyJournalLifecycleCore.validIso(candidate?.deletedAt);
      return normalized && deletedAt ? { ...normalized, deletedAt } : null;
    }).filter(Boolean);
  }

  function normalizedHistory(source) {
    return SuzyJournalLifecycleCore.normalizeHistoryMap(source);
  }

  function localState() {
    return {
      entries: normalizedEntries(entries),
      trash: normalizedTrash(trashEntries),
      history: normalizedHistory(versionHistory)
    };
  }

  function normalizeRemote(source) {
    const decoded = SuzyJournalSyncCore.decodeRemoteJournal(source);
    return {
      entries: normalizedEntries(decoded.entries),
      trash: normalizedTrash(decoded.trash),
      history: normalizedHistory(decoded.history),
      lifecycleFound: decoded.lifecycleFound,
      lifecycleError: decoded.lifecycleError
    };
  }

  function stateForFingerprint(state) {
    return { entries: state.entries, trash: state.trash, history: state.history };
  }

  function localFingerprint() {
    return SuzyJournalSyncCore.fingerprintJournalState(localState());
  }

  function remoteFingerprint() {
    return SuzyJournalSyncCore.fingerprintJournalState(stateForFingerprint(syncState.remote));
  }

  function snapshotsState() {
    return SuzyJournalSyncCore.compareJournalStates(localState(), stateForFingerprint(syncState.remote));
  }

  function lifecycleTotals(state) {
    return {
      entries: state.entries.length,
      trash: state.trash.length,
      revisions: SuzyJournalSyncCore.countRevisions(state.history)
    };
  }

  function totalsText(state) {
    const totals = lifecycleTotals(state);
    return `${totals.entries} ativo${totals.entries === 1 ? "" : "s"}, ${totals.trash} na lixeira e ${totals.revisions} vers${totals.revisions === 1 ? "ão" : "ões"}`;
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
    const canUseServer = syncState.available && syncState.authenticated && !syncState.remote.lifecycleError;
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
      setStatus("Conta local desconectada", "Entre na conta para sincronizar todo o ciclo de vida do diário.", "warning");
      setStorageNotice("SERVIDOR LOCAL ATIVO", "O SQLite está disponível, mas a conta ainda não foi autenticada.", "conflict");
      return;
    }

    byId("storageModeBadge").textContent = `PROCESSO • SQLITE COMPLETO • ${syncState.username}`;

    if (syncState.remote.lifecycleError) {
      syncState.automatic = false;
      setStatus("Metadados do SQLite inconsistentes", syncState.remote.lifecycleError, "warning");
      setStorageNotice("SINCRONIZAÇÃO BLOQUEADA", "Os registros ativos foram preservados. Restaure um backup válido antes de substituir versões ou lixeira.", "conflict");
      return;
    }

    const comparison = snapshotsState();
    if (syncState.automatic && ["equal", "empty"].includes(comparison)) {
      setStatus("Sincronização completa ativa", `${totalsText(localState())} protegidos no navegador e no SQLite.`, "success");
      setStorageNotice("SQLITE SINCRONIZADO", "Novos registros, edições, versões, exclusões e restaurações serão persistidos automaticamente.", "sqlite");
      return;
    }

    if (comparison === "local-only") {
      setStatus("Dados aguardando envio", `Este navegador possui ${totalsText(localState())}; o SQLite está vazio.`, "warning");
    } else if (comparison === "remote-only") {
      setStatus("Backup completo disponível", `O SQLite possui ${totalsText(syncState.remote)}.`, "warning");
    } else if (comparison === "diverged") {
      setStatus("Versões diferentes detectadas", "Escolha explicitamente qual estado completo do diário deve prevalecer.", "warning");
    } else {
      setStatus("Pronto para sincronizar", "Escolha salvar no SQLite ou restaurar a cópia persistida.", "warning");
    }
    setStorageNotice("REVISÃO NECESSÁRIA", "Nenhum registro, versão ou item da lixeira será substituído silenciosamente.", "conflict");
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
    syncState.remote = normalizeRemote(payload.entries);
    return syncState.remote;
  }

  async function putCurrentJournal(options = {}) {
    const current = localState();
    const remoteRows = SuzyJournalSyncCore.encodeRemoteJournal(current.entries, current.trash, current.history);
    await requestJson("/api/journal", {
      method: "PUT",
      headers: { "X-CSRF-Token": syncState.csrfToken },
      body: JSON.stringify({ entries: remoteRows })
    });
    syncState.remote = {
      ...SuzyJournalSyncCore.cloneJournalState(current),
      lifecycleFound: true,
      lifecycleError: null
    };
    syncState.automatic = true;
    setFeedback(
      options.migration
        ? `Migração concluída: ${totalsText(current)} agora persistidos no SQLite.`
        : `Estado completo salvo no SQLite: ${totalsText(current)}.`,
      "success"
    );
    renderSyncUi();
  }

  async function migrateLegacyStateWhenSafe() {
    const activeEqual = SuzyJournalSyncCore.fingerprintJournal(entries)
      === SuzyJournalSyncCore.fingerprintJournal(syncState.remote.entries);
    if (syncState.remote.lifecycleFound || syncState.remote.lifecycleError || !activeEqual) return false;
    await putCurrentJournal({ migration: true });
    return true;
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
        if (!await migrateLegacyStateWhenSafe()) {
          const comparison = snapshotsState();
          syncState.automatic = !syncState.remote.lifecycleError && (comparison === "equal" || comparison === "empty");
        }
      }
    } catch (error) {
      syncState.available = false;
      syncState.authenticated = false;
      syncState.csrfToken = null;
      syncState.automatic = false;
      if (error?.message && !String(error.message).includes("Failed to fetch")) {
        console.warn("Falha ao detectar backend local.", error);
      }
    }
    renderSyncUi();
  }

  async function synchronizeCurrentSafely() {
    const knownRemoteFingerprint = remoteFingerprint();
    const currentLocalFingerprint = localFingerprint();
    await fetchRemoteJournal();
    if (syncState.remote.lifecycleError) throw new Error(syncState.remote.lifecycleError);
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
    if (freshRemote.lifecycleError) throw new Error(freshRemote.lifecycleError);

    const different = remoteFingerprint() !== localFingerprint();
    const activeDifferent = SuzyJournalSyncCore.fingerprintJournal(freshRemote.entries)
      !== SuzyJournalSyncCore.fingerprintJournal(entries);
    const remoteLifecycleData = freshRemote.trash.length > 0 || SuzyJournalSyncCore.countRevisions(freshRemote.history) > 0;

    if (different && (activeDifferent || remoteLifecycleData)) {
      const confirmed = confirm(`O SQLite possui ${totalsText(freshRemote)} em estado diferente. Substituir pelo estado completo deste navegador?`);
      if (!confirmed) {
        setFeedback("Envio cancelado. Nenhum dado foi substituído.", "warning");
        renderSyncUi();
        return;
      }
    }
    await putCurrentJournal({ migration: !freshRemote.lifecycleFound && !activeDifferent });
  }

  async function restoreFromSqlite() {
    if (!syncState.authenticated) return;
    const remote = await fetchRemoteJournal();
    if (remote.lifecycleError) throw new Error(remote.lifecycleError);
    const different = remoteFingerprint() !== localFingerprint();

    if (different && SuzyJournalSyncCore.compareJournalStates(localState(), {}) !== "empty") {
      const legacyWarning = remote.lifecycleFound
        ? ""
        : " Esta é uma cópia antiga sem versões e lixeira; esses dados locais serão removidos.";
      const confirmed = confirm(`A restauração substituirá o estado completo deste navegador por ${totalsText(remote)} do SQLite.${legacyWarning} Continuar?`);
      if (!confirmed) {
        setFeedback("Restauração cancelada. Nenhum dado foi substituído.", "warning");
        renderSyncUi();
        return;
      }
    }

    entries = normalizedEntries(remote.entries);
    trashEntries = normalizedTrash(remote.trash);
    versionHistory = normalizedHistory(remote.history);
    editingEntryId = null;
    selectedHistoryEntryId = null;
    render();
    syncState.remote = {
      ...SuzyJournalSyncCore.cloneJournalState({ entries, trash: trashEntries, history: versionHistory }),
      lifecycleFound: remote.lifecycleFound,
      lifecycleError: null
    };
    syncState.automatic = true;
    setFeedback(`Estado restaurado do SQLite: ${totalsText(localState())}.`, "success");
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
        setFeedback("Alteração salva somente no navegador até você escolher a direção da sincronização completa.", "warning");
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