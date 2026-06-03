// Main app shell. Data comes from the Express API (/api/*).
// State: vaultPath → if empty shows the vault picker screen.

const { useState, useEffect, useRef, useCallback } = React;

// ── debounce hook ────────────────────────────────────────────────────────────

function useDebounce(fn, delay) {
  const timer = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function getFirstVaultFile(vault) {
  if (vault.rootFiles?.length) return vault.rootFiles[0];
  for (const folder of vault.folders || []) {
    if (folder.files?.length) return folder.files[0];
  }
  return null;
}

// ── ViewTabs ─────────────────────────────────────────────────────────────────

function ViewTabs({ mode, onChange }) {
  return (
    <div className="view-tabs" role="tablist">
      <button role="tab" className={`vt-btn ${mode === "edit" ? "is-active" : ""}`} onClick={() => onChange("edit")}>
        <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
        Documento
      </button>
      <button role="tab" className={`vt-btn ${mode === "markdown" ? "is-active" : ""}`} onClick={() => onChange("markdown")}>
        <svg viewBox="0 0 16 16" width="14" height="14"><path d="M5 5L2.5 8 5 11M11 5l2.5 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        Markdown
      </button>
      <button role="tab" className={`vt-btn ${mode === "postit" ? "is-active" : ""}`} onClick={() => onChange("postit")}>
        <svg viewBox="0 0 16 16" width="14" height="14"><g><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" /><rect x="9" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" /><rect x="2.5" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" /></g></svg>
        Quadro
      </button>
    </div>
  );
}

// ── VaultPicker ──────────────────────────────────────────────────────────────

function VaultPicker({ onOpen, error }) {
  const [val, setVal] = useState("");
  const submit = () => { if (val.trim()) onOpen(val.trim()); };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--canvas-subtle)" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "36px 40px", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: "18px", width: "400px", maxWidth: "calc(100vw - 32px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: 600, color: "var(--fg)" }}>
          <svg width="22" height="22" viewBox="0 0 16 16" fill="var(--fg-subtle)"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" /></svg>
          plan-list
        </div>
        <div style={{ color: "var(--fg-muted)", fontSize: "14px", lineHeight: 1.5 }}>
          Informe o caminho da pasta com seus arquivos{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px", background: "var(--canvas-inset)", padding: "1px 5px", borderRadius: "4px" }}>.md</code>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="/home/você/notas"
            style={{ flex: 1, background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: "14px", color: "var(--fg)", outline: "none", fontFamily: "var(--font-mono)", minWidth: 0 }}
          />
          <button
            onClick={submit}
            style={{ background: "var(--success)", color: "white", padding: "8px 18px", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: val.trim() ? 1 : 0.4 }}
          >
            Abrir
          </button>
        </div>
        {error && <div style={{ color: "#c0392b", fontSize: "13px" }}>{error}</div>}
      </div>
    </div>
  );
}

// ── Tweaks defaults ──────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aesthetic": "github",
  "density": "confortável",
  "showComments": true
}/*EDITMODE-END*/;

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [vaultPath, setVaultPath] = useState(() => localStorage.getItem("vaultPath") || "");
  const [vaultError, setVaultError] = useState("");
  const [vault, setVault] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileUpdated, setFileUpdated] = useState("");
  const [viewMode, setViewMode] = useState("edit");
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");

  // Apply tweaks to DOM
  useEffect(() => {
    document.documentElement.dataset.aesthetic = tweaks.aesthetic;
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.aesthetic, tweaks.density]);

  useEffect(() => { setCommentsOpen(tweaks.showComments); }, [tweaks.showComments]);

  // ── Load vault ─────────────────────────────────────────────────────────────

  const loadVault = useCallback(async (p) => {
    setVaultError("");
    try {
      const r = await fetch(`/api/vault?path=${encodeURIComponent(p)}`);
      const data = await readJsonResponse(r);
      if (!r.ok) throw new Error(data.error || r.statusText);
      setVault(data);
      const firstFile = getFirstVaultFile(data);
      if (!activeFileIdRef.current && firstFile) {
        setActiveFileId(firstFile.id);
        setFileContent(firstFile.content || "");
        setFileUpdated(firstFile.updated || "");
      }
      setVaultPath(p);
      localStorage.setItem("vaultPath", p);

      const cr = await fetch(`/api/comments?vault=${encodeURIComponent(p)}`);
      if (cr.ok) setCommentsMap(await readJsonResponse(cr));
    } catch (e) {
      setVaultError(e.message);
    }
  }, []);

  useEffect(() => { if (vaultPath) loadVault(vaultPath); }, []);

  // ── SSE watch ──────────────────────────────────────────────────────────────

  const activeFileIdRef = useRef(activeFileId);
  activeFileIdRef.current = activeFileId;
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!vaultPath) return;
    const es = new EventSource(`/api/watch?path=${encodeURIComponent(vaultPath)}`);

    es.addEventListener("change", (e) => {
      let changed;
      try {
        const data = JSON.parse(e.data);
        changed = data.path;
      } catch {
        return;
      }
      if (changed === activeFileIdRef.current && !isDirtyRef.current) {
        fetch(`/api/file?vault=${encodeURIComponent(vaultPath)}&path=${encodeURIComponent(changed)}`)
          .then(readJsonResponse)
          .then((d) => { setFileContent(d.content); setFileUpdated(d.updated); })
          .catch(() => {});
      }
    });
    es.addEventListener("add", () => loadVault(vaultPath));
    es.addEventListener("remove", () => loadVault(vaultPath));

    return () => es.close();
  }, [vaultPath]);

  // ── File selection ─────────────────────────────────────────────────────────

  const pickFileAbortRef = useRef(null);

  const pickFile = useCallback((fileId) => {
    setActiveFileId(fileId);
    setRenaming(false);
    if (!vaultPath) return;
    if (pickFileAbortRef.current) {
      pickFileAbortRef.current.abort();
    }
    const controller = new AbortController();
    pickFileAbortRef.current = controller;
    fetch(`/api/file?vault=${encodeURIComponent(vaultPath)}&path=${encodeURIComponent(fileId)}`, { signal: controller.signal })
      .then(readJsonResponse)
      .then((d) => { setFileContent(d.content); setFileUpdated(d.updated); })
      .catch((err) => { if (err.name !== "AbortError") { /* ignore */ } });
  }, [vaultPath]);

  // ── Content save (debounced 800ms) ─────────────────────────────────────────

  const persistContent = useCallback((fileId, content) => {
    if (!vaultPath || !fileId) return;
    fetch("/api/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vault: vaultPath, path: fileId, content }),
    }).then(readJsonResponse).then((d) => {
      if (d.updated) setFileUpdated(d.updated);
      isDirtyRef.current = false;
    }).catch(() => {});
  }, [vaultPath]);

  const debouncedPersist = useDebounce(persistContent, 800);

  const handleContentChange = (newContent) => {
    isDirtyRef.current = true;
    setFileContent(newContent);
    setVault((v) => {
      if (!v) return v;
      const patch = (files) => files.map((f) => f.id === activeFileId ? { ...f, content: newContent } : f);
      return {
        ...v,
        rootFiles: patch(v.rootFiles),
        folders: v.folders.map((folder) => ({ ...folder, files: patch(folder.files) })),
      };
    });
    debouncedPersist(activeFileId, newContent);
  };

  // ── Comments ───────────────────────────────────────────────────────────────

  const persistComments = useCallback((map) => {
    if (!vaultPath) return;
    fetch(`/api/comments?vault=${encodeURIComponent(vaultPath)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(map),
    }).catch(() => {});
  }, [vaultPath]);

  const handleAddComment = (text) => {
    const next = {
      ...commentsMap,
      [activeFileId]: [...(commentsMap[activeFileId] || []), { id: `c${Date.now()}`, author: "você", when: "agora", text }],
    };
    setCommentsMap(next);
    persistComments(next);
  };

  const handleDeleteComment = (cid) => {
    const next = { ...commentsMap, [activeFileId]: (commentsMap[activeFileId] || []).filter((c) => c.id !== cid) };
    setCommentsMap(next);
    persistComments(next);
  };

  // ── New file ───────────────────────────────────────────────────────────────

  const handleNewFile = async (dir = "") => {
    if (!vaultPath) return;
    const rawName = window.prompt("Nome do novo documento:", "Novo documento");
    if (!rawName) return;
    const name = rawName.trim() || "Novo documento";
    const r = await fetch("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vault: vaultPath, dir, name }),
    });
    if (!r.ok) return;
    const newFile = await readJsonResponse(r);
    setVault((v) => {
      if (!v) return v;
      if (!dir) {
        return { ...v, rootFiles: [newFile, ...v.rootFiles] };
      }
      return {
        ...v,
        folders: v.folders.map((folder) =>
          folder.id === dir ? { ...folder, files: [newFile, ...folder.files] } : folder
        ),
      };
    });
    pickFile(newFile.id);
  };

  // ── Rename ─────────────────────────────────────────────────────────────────

  const handleRename = async (newName) => {
    if (!vaultPath || !activeFileId) return;
    const r = await fetch("/api/file", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vault: vaultPath, path: activeFileId, newName }),
    });
    if (!r.ok) return;
    const { id: newId, name: newFileName } = await readJsonResponse(r);
    if (commentsMap[activeFileId]) {
      const next = { ...commentsMap, [newId]: commentsMap[activeFileId] };
      delete next[activeFileId];
      setCommentsMap(next);
      persistComments(next);
    }
    setVault((v) => {
      if (!v) return v;
      const patch = (files) => files.map((f) => f.id === activeFileId ? { ...f, id: newId, name: newFileName } : f);
      return { ...v, rootFiles: patch(v.rootFiles), folders: v.folders.map((fo) => ({ ...fo, files: patch(fo.files) })) };
    });
    setActiveFileId(newId);
  };

  // ── Derived active file ────────────────────────────────────────────────────

  let file = null;
  let folder = null;
  if (vault && activeFileId) {
    for (const f of vault.rootFiles) { if (f.id === activeFileId) { file = f; break; } }
    if (!file) {
      for (const fo of vault.folders) {
        for (const f of fo.files) { if (f.id === activeFileId) { file = f; folder = fo; break; } }
        if (file) break;
      }
    }
    if (file) file = { ...file, content: fileContent, updated: fileUpdated };
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!vaultPath || vaultError) {
    return <VaultPicker onOpen={loadVault} error={vaultError} />;
  }
  if (!vault) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--fg-muted)", fontStyle: "italic" }}>carregando…</div>;
  }

  const tasks = file ? window.extractTasks(file.content) : [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;
  const displayName = file ? file.name.replace(/\.md$/, "") : "";

  const commitRename = () => {
    const nextName = renameDraft.trim() || "Sem título";
    handleRename(nextName);
    setRenaming(false);
  };

  return (
    <div className="app-shell">
      <Sidebar
        vault={vault}
        activeFileId={activeFileId}
        accent={tweaks.accent}
        onPickFile={pickFile}
        onNewFile={handleNewFile}
        onChangeVault={() => { localStorage.removeItem("vaultPath"); setVaultPath(""); setVault(null); setActiveFileId(null); setVaultError(""); }}
      />

      <main className="main-area">
        {file ? (
          <>
            <div className="file-topbar">
              <div className="breadcrumb">
                <span className="bc-folder">{vault.name}</span>
                <span className="bc-sep">/</span>
                {folder ? (
                  <>
                    <span className="bc-folder">{folder.name}</span>
                    <span className="bc-sep">/</span>
                  </>
                ) : null}
                {renaming ? (
                  <input
                    className="bc-rename-input"
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      else if (e.key === "Escape") {
                        setRenameDraft(displayName);
                        setRenaming(false);
                      }
                    }}
                  />
                ) : (
                  <span className="bc-file" title="Renomear" onClick={() => { setRenameDraft(displayName); setRenaming(true); }}>{displayName}.md</span>
                )}
              </div>
              <div className="topbar-actions">
                <button className={`btn ${commentsOpen ? "is-active" : ""}`} onClick={() => { const next = !commentsOpen; setCommentsOpen(next); setTweak("showComments", next); }} title="Comentários">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Z" /></svg>
                  <span className="btn-count">{(commentsMap[activeFileId] || []).length}</span>
                </button>
              </div>
            </div>
            <div className="content-scroll">
              <div className="file-canvas">
                <div className="file-box">
                  <div className="file-box-header">
                    <ViewTabs mode={viewMode} onChange={setViewMode} />
                    <div className="file-box-meta">
                      {total > 0 ? (
                        <div className="fb-progress">
                          <div className="fb-progress-bar">
                            <div className="fb-progress-fill" style={{ width: `${pct}%`, background: complete ? "var(--success)" : "var(--done)" }} />
                          </div>
                          <span className="fb-progress-num"><strong>{done}</strong>/{total} · {pct}%</span>
                        </div>
                      ) : (
                        <span className="fb-progress-num">sem tasks</span>
                      )}
                      <span className="fbm-edited">editado {file.updated}</span>
                    </div>
                  </div>

                  {viewMode === "edit" ? (
                    <div className="markdown-body"><Editor content={fileContent} onChange={handleContentChange} /></div>
                  ) : viewMode === "markdown" ? (
                    <textarea
                      className="raw-markdown-editor"
                      value={fileContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      spellCheck="false"
                      aria-label="Editar markdown completo"
                    />
                  ) : (
                    <PostItBoard content={fileContent} onChange={handleContentChange} />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <svg className="es-glyph" width="40" height="40" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Z" /></svg>
            <span>Selecione um arquivo</span>
          </div>
        )}
      </main>

      {file && commentsOpen ? (
        <CommentsRail
          comments={commentsMap[activeFileId] || []}
          onAdd={handleAddComment}
          onDelete={handleDeleteComment}
          fileName={file.name}
        />
      ) : null}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Estética">
          <TweakRadio label="visual" value={tweaks.aesthetic} onChange={(v) => setTweak("aesthetic", v)}
            options={[{ value: "github", label: "GitHub claro" }, { value: "github-dark", label: "GitHub escuro" }]} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="densidade" value={tweaks.density} onChange={(v) => setTweak("density", v)}
            options={[{ value: "compacto", label: "compacto" }, { value: "confortável", label: "confortável" }, { value: "espaçoso", label: "espaçoso" }]} />
          <TweakToggle label="painel de comentários" value={tweaks.showComments} onChange={(v) => setTweak("showComments", v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
