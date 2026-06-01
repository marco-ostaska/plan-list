// Sidebar — folder tree with progress bars per file.

function ProgressDot({ pct, accent }) {
  // Tiny inline pie indicator
  const r = 6;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
}

function FileRow({ file, active, accent, onClick }) {
  const tasks = window.extractTasks(file.content);
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const displayName = file.name.replace(/\.md$/, "");

  return (
    <button
      className={`file-row ${active ? "is-active" : ""}`}
      onClick={onClick}
      data-comment-anchor={`file-${file.id}`}
    >
      <ProgressDot pct={pct} accent={accent} />
      <span className="file-name">{displayName}</span>
      {total > 0 ? (
        <span className="file-meta">
          {done}/{total}
        </span>
      ) : null}
    </button>
  );
}

function FolderGroup({ folder, activeFileId, accent, onPickFile, onNewFile }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="folder-group">
      <button className="folder-header" onClick={() => setOpen(!open)}>
        <span className={`folder-caret ${open ? "is-open" : ""}`}>▸</span>
        <span className="folder-name">{folder.name}</span>
        <span className="folder-count">{folder.files.length}</span>
        <span
          className="icon-btn folder-new-btn"
          title="Novo arquivo"
          onClick={(e) => { e.stopPropagation(); onNewFile(folder.id); }}
        >
          +
        </span>
      </button>
      {open ? (
        <div className="folder-files">
          {folder.files.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              active={f.id === activeFileId}
              accent={accent}
              onClick={() => onPickFile(f.id, folder.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ vault, activeFileId, accent, onPickFile, onNewFile, onChangeVault }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <button className="vault-name" onClick={onChangeVault} title="Trocar pasta" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
          <span className="vault-glyph">◐</span>
          <span className="vault-name-text">{vault.name}</span>
        </button>
        <button className="icon-btn" title="Novo arquivo" onClick={onNewFile}>
          +
        </button>
      </div>

      <div className="sidebar-search">
        <input type="text" placeholder="buscar…" />
      </div>

      <div className="sidebar-scroll">
        {vault.rootFiles?.length ? (
          <div className="folder-group">
            <div className="folder-header is-root">
              <span className="folder-name">soltos</span>
            </div>
            <div className="folder-files">
              {vault.rootFiles.map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  active={f.id === activeFileId}
                  accent={accent}
                  onClick={() => onPickFile(f.id, null)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {vault.folders.map((folder) => (
          <FolderGroup
            key={folder.id}
            folder={folder}
            activeFileId={activeFileId}
            accent={accent}
            onPickFile={onPickFile}
            onNewFile={onNewFile}
          />
        ))}
      </div>

      <div className="sidebar-foot">
        <div className="foot-line">
          <span className="foot-label">total</span>
          <span className="foot-value">
            {vault.folders.reduce((n, f) => n + f.files.length, 0) + (vault.rootFiles?.length || 0)} arquivos
          </span>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
