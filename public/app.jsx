// Main app shell. Data comes from the Express API (/api/*).
// State: vaultPath → if empty shows the vault picker screen.

const { useState, useEffect, useRef, useCallback } = React;

// ── debounce hook ────────────────────────────────────────────────────────────

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ── ViewToggle ───────────────────────────────────────────────────────────────

function ViewToggle({ mode, onChange }) {
  return (
    <div className="view-toggle" role="tablist">
      <button
        role="tab"
        className={`vt-btn ${mode === "edit" ? "is-active" : ""}`}
        onClick={() => onChange("edit")}
      >
        <svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 3h12M2 7h12M2 11h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        documento
      </button>
      <button
        role="tab"
        className={`vt-btn ${mode === "postit" ? "is-active" : ""}`}
        onClick={() => onChange("postit")}
      >
        <svg viewBox="0 0 16 16" width="13" height="13"><rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>
        post-its
      </button>
    </div>
  );
}

// ── FileHeader ───────────────────────────────────────────────────────────────

function FileHeader({ file, folderName, accent, mode, onModeChange, onToggleComments, commentsOpen, commentsCount, onRename }) {
  const tasks = window.extractTasks(file.content);
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const displayName = file.name.replace(/\.md$/, "");

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = React.useRef(null);

  React.useEffect(() => { setDraft(displayName); }, [file.id]);
  React.useEffect(() => {
    if (renaming && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [renaming]);

  const commitRename = () => {
    const v = draft.trim() || "Sem título";
    onRename(v);
    setRenaming(false);
  };

  return (
    <header className="file-header">
      <div className="fh-top">
        <div className="fh-crumbs">
          {folderName ? (<><span className="fh-crumb">{folderName}</span><span className="fh-sep">/</span></>) : null}
          {renaming ? (
            <input ref={inputRef} className="fh-rename-input" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); else if (e.key === "Escape") { setDraft(displayName); setRenaming(false); } }} />
          ) : (
            <button className="fh-crumb fh-current" onClick={() => setRenaming(true)} title="Renomear">{displayName}</button>
          )}
        </div>
        <div className="fh-actions">
          <ViewToggle mode={mode} onChange={onModeChange} />
          <button className={`fh-comments ${commentsOpen ? "is-active" : ""}`} onClick={onToggleComments} title="Comentários">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 3h12v8H6l-3 3v-3H2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            <span>{commentsCount}</span>
          </button>
        </div>
      </div>
      {total > 0 ? (
        <div className="fh-progress">
          <div className="fh-bar"><div className="fh-bar-fill" style={{ width: `${pct}%`, background: accent }} /></div>
          <div className="fh-progress-meta">
            <span className="fh-progress-num"><strong>{done}</strong>/{total}</span>
            <span className="fh-progress-label">{pct}% concluído</span>
            <span className="fh-progress-sep">·</span>
            <span className="fh-progress-label">editado {file.updated}</span>
          </div>
        </div>
      ) : (
        <div className="fh-progress">
          <div className="fh-progress-meta"><span className="fh-progress-label">sem tasks · editado {file.updated}</span></div>
        </div>
      )}
    </header>
  );
}

// ── VaultPicker ──────────────────────────────────────────────────────────────

function VaultPicker({ onOpen, error }) {
  const [val, setVal] = useState("");
  const submit = () => { if (val.trim()) onOpen(val.trim()); };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ background: "var(--bg-paper)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "40px 48px", boxShadow: "var(--shadow-paper)", display: "flex", flexDirection: "column", gap: "20px", minWidth: "360px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", letterSpacing: "-0.01em", color: "var(--ink)" }}>◐ plan-list</div>
        <div style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
          Informe o caminho da pasta com seus arquivos{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px", background: "var(--line-soft)", padding: "1px 5px", borderRadius: "3px" }}>.md</code>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="/home/você/notas"
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "14px", color: "var(--ink)", outline: "none", fontFamily: "var(--font-mono)" }}
          />
          <button
            onClick={submit}
            style={{ background: "var(--accent)", color: "white", padding: "8px 18px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer", opacity: val.trim() ? 1 : 0.4 }}
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
  "aesthetic": "papel",
  "accent": "#7080c8",
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

  // Apply tweaks to DOM
  useEffect(() => {
    document.documentElement.dataset.aesthetic = tweaks.aesthetic;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.style.setProperty("--accent", tweaks.accent);
  }, [tweaks.aesthetic, tweaks.density, tweaks.accent]);

  useEffect(() => { setCommentsOpen(tweaks.showComments); }, [tweaks.showComments]);

  // ── Load vault ─────────────────────────────────────────────────────────────

  const loadVault = useCallback(async (p) => {
    setVaultError("");
    try {
      const r = await fetch(`/api/vault?path=${encodeURIComponent(p)}`);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || r.statusText); }
      const data = await r.json();
      setVault(data);
      setVaultPath(p);
      localStorage.setItem("vaultPath", p);

      const cr = await fetch(`/api/comments?vault=${encodeURIComponent(p)}`);
      if (cr.ok) setCommentsMap(await cr.json());
    } catch (e) {
      setVaultError(e.message);
    }
  }, []);

  useEffect(() => { if (vaultPath) loadVault(vaultPath); }, []);

  // ── SSE watch ──────────────────────────────────────────────────────────────

  const activeFileIdRef = useRef(activeFileId);
  activeFileIdRef.current = activeFileId;

  useEffect(() => {
    if (!vaultPath) return;
    const es = new EventSource(`/api/watch?path=${encodeURIComponent(vaultPath)}`);

    es.addEventListener("change", (e) => {
      const { path: changed } = JSON.parse(e.data);
      if (changed === activeFileIdRef.current) {
        fetch(`/api/file?vault=${encodeURIComponent(vaultPath)}&path=${encodeURIComponent(changed)}`)
          .then((r) => r.json())
          .then((d) => { setFileContent(d.content); setFileUpdated(d.updated); })
          .catch(() => {});
      }
    });
    es.addEventListener("add", () => loadVault(vaultPath));
    es.addEventListener("remove", () => loadVault(vaultPath));

    return () => es.close();
  }, [vaultPath]);

  // ── File selection ─────────────────────────────────────────────────────────

  const pickFile = useCallback((fileId) => {
    setActiveFileId(fileId);
    if (!vaultPath) return;
    fetch(`/api/file?vault=${encodeURIComponent(vaultPath)}&path=${encodeURIComponent(fileId)}`)
      .then((r) => r.json())
      .then((d) => { setFileContent(d.content); setFileUpdated(d.updated); })
      .catch(() => {});
  }, [vaultPath]);

  // ── Content save (debounced 800ms) ─────────────────────────────────────────

  const persistContent = useCallback((fileId, content) => {
    if (!vaultPath || !fileId) return;
    fetch("/api/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vault: vaultPath, path: fileId, content }),
    }).then((r) => r.json()).then((d) => { if (d.updated) setFileUpdated(d.updated); }).catch(() => {});
  }, [vaultPath]);

  const debouncedPersist = useDebounce(persistContent, 800);

  const handleContentChange = (newContent) => {
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

  const handleNewFile = async () => {
    if (!vaultPath) return;
    const r = await fetch("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vault: vaultPath, dir: "", name: "Sem título" }),
    });
    if (!r.ok) return;
    const newFile = await r.json();
    setVault((v) => ({ ...v, rootFiles: [newFile, ...v.rootFiles] }));
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
    const { id: newId, name: newFileName } = await r.json();
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
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--ink-mute)", fontStyle: "italic" }}>carregando…</div>;
  }

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
            <FileHeader
              file={file}
              folderName={folder?.name}
              accent={tweaks.accent}
              mode={viewMode}
              onModeChange={setViewMode}
              onToggleComments={() => { const next = !commentsOpen; setCommentsOpen(next); setTweak("showComments", next); }}
              commentsOpen={commentsOpen}
              commentsCount={(commentsMap[activeFileId] || []).length}
              onRename={handleRename}
            />
            <div className="content-scroll">
              {viewMode === "edit" ? (
                <Editor content={fileContent} onChange={handleContentChange} />
              ) : (
                <PostItBoard content={fileContent} onChange={handleContentChange} />
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">selecione um arquivo</div>
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
        <TweakSection title="Estética">
          <TweakRadio label="visual" value={tweaks.aesthetic} onChange={(v) => setTweak("aesthetic", v)}
            options={[{ value: "papel", label: "papel" }, { value: "limpo", label: "limpo" }, { value: "mono", label: "mono" }]} />
          <TweakColor label="accent" value={tweaks.accent} onChange={(v) => setTweak("accent", v)}
            options={["#7080c8", "#5b7a6e", "#c7522a", "#7a6a3a", "#222222"]} />
        </TweakSection>
        <TweakSection title="Layout">
          <TweakRadio label="densidade" value={tweaks.density} onChange={(v) => setTweak("density", v)}
            options={[{ value: "compacto", label: "compacto" }, { value: "confortável", label: "confortável" }, { value: "espaçoso", label: "espaçoso" }]} />
          <TweakToggle label="painel de comentários" value={tweaks.showComments} onChange={(v) => setTweak("showComments", v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
