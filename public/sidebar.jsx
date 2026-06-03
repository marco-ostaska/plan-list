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
  const filePath = file.id.split("/").slice(0, -1).join("/");

  return (
    <button
      className={`file-row ${active ? "is-active" : ""}`}
      onClick={onClick}
      data-comment-anchor={`file-${file.id}`}
    >
      <span className="tree-indent" aria-hidden="true" />
      <span className="file-icon" aria-hidden="true">md</span>
      <span className="file-copy">
        <span className="file-name">{displayName}</span>
        {filePath ? <span className="file-path">{filePath}</span> : null}
      </span>
      {total > 0 ? (
        <span className="file-meta">
          {done}/{total}
        </span>
      ) : null}
      <ProgressDot pct={pct} accent={accent} />
    </button>
  );
}

function FolderGroup({ folder, activeFileId, accent, onPickFile, onNewFile, forceOpen }) {
  const [open, setOpen] = React.useState(true);
  const isActiveFolder = folder.files.some((file) => file.id === activeFileId);
  React.useEffect(() => {
    if (isActiveFolder || forceOpen) setOpen(true);
  }, [isActiveFolder, forceOpen]);

  return (
    <div className={`folder-group ${isActiveFolder ? "has-active-file" : ""}`}>
      <button className="folder-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`folder-caret ${open ? "is-open" : ""}`}>{">"}</span>
        <span className="folder-icon" aria-hidden="true" />
        <span className="folder-name" title={folder.name}>{folder.name}</span>
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFolderIds, setSelectedFolderIds] = React.useState(null);
  const [folderFilterOpen, setFolderFilterOpen] = React.useState(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const rootFiles = vault.rootFiles || [];
  const navigableFolders = vault.folders.filter((folder) => folder.files.some((file) => file.name.endsWith(".md")));
  const selectedFolderIdsSet = selectedFolderIds ? new Set(selectedFolderIds) : null;
  const visibleFolders = selectedFolderIdsSet ? navigableFolders.filter((folder) => selectedFolderIdsSet.has(folder.id)) : navigableFolders;
  const folderFilterActive = selectedFolderIds !== null;
  const totalFolders = navigableFolders.length;
  const visibleFolderCount = visibleFolders.length;
  const totalFiles = visibleFolders.reduce((n, f) => n + f.files.length, 0) + rootFiles.length;
  React.useEffect(() => {
    if (selectedFolderIds === null) return;
    const validFolderIds = new Set(navigableFolders.map((folder) => folder.id));
    const nextSelectedFolderIds = selectedFolderIds.filter((folderId) => validFolderIds.has(folderId));
    if (nextSelectedFolderIds.length !== selectedFolderIds.length) {
      setSelectedFolderIds(nextSelectedFolderIds.length === navigableFolders.length ? null : nextSelectedFolderIds);
    }
  }, [navigableFolders, selectedFolderIds]);
  const toggleFolderFilter = (folderId) => {
    const allFolderIds = navigableFolders.map((folder) => folder.id);
    const currentFolderIds = selectedFolderIds === null ? allFolderIds : selectedFolderIds;
    const nextFolderIds = currentFolderIds.includes(folderId)
      ? currentFolderIds.filter((id) => id !== folderId)
      : [...currentFolderIds, folderId];
    setSelectedFolderIds(nextFolderIds.length === allFolderIds.length ? null : nextFolderIds);
  };
  const filterFiles = (files) => {
    if (!normalizedQuery) return files;
    return files.filter((file) => (
      file.name.toLowerCase().includes(normalizedQuery) ||
      (file.content || "").toLowerCase().includes(normalizedQuery)
    ));
  };
  const displayedVault = normalizedQuery
    ? {
        ...vault,
        rootFiles: filterFiles(rootFiles),
        folders: visibleFolders
          .map((folder) => {
            const folderMatchesQuery = folder.name.toLowerCase().includes(normalizedQuery);
            return { ...folder, files: folderMatchesQuery ? folder.files : filterFiles(folder.files) };
          })
          .filter((folder) => folder.files.length > 0 || folder.name.toLowerCase().includes(normalizedQuery)),
      }
    : { ...vault, folders: visibleFolders };
  const displayedFileCount = displayedVault.folders.reduce((n, f) => n + f.files.length, 0) + (displayedVault.rootFiles?.length || 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <button className="vault-name" onClick={onChangeVault} title="Trocar pasta">
          <span className="vault-glyph" aria-hidden="true" />
          <span className="vault-copy">
            <span className="vault-label">vault</span>
            <span className="vault-name-text">{vault.name}</span>
          </span>
        </button>
        <button className="icon-btn" title="Novo arquivo" onClick={onNewFile}>
          +
        </button>
      </div>

      <div className="sidebar-search">
        <span className="search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="buscar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-title">explorer</span>
        <div className="sidebar-section-actions">
          <span className="sidebar-section-meta">
            {folderFilterActive ? `${visibleFolderCount}/${totalFolders}` : totalFolders} pastas / {totalFiles} arquivos
          </span>
          {navigableFolders.length > 0 ? (
            <button
              className={`folder-filter-button ${folderFilterActive ? "is-active" : ""}`}
              onClick={() => setFolderFilterOpen(!folderFilterOpen)}
              aria-expanded={folderFilterOpen}
            >
              filter
            </button>
          ) : null}
        </div>
      </div>

      {folderFilterOpen ? (
        <div className="folder-filter-popover">
          <div className="folder-filter-head">
            <span className="folder-filter-title">pastas</span>
            <button className="folder-filter-reset" onClick={() => setSelectedFolderIds(null)}>
              todas
            </button>
          </div>
          <div className="folder-filter-list">
            {navigableFolders.map((folder) => (
              <label className="folder-filter-option" key={folder.id} title={folder.name}>
                <input type="checkbox" checked={!selectedFolderIdsSet || selectedFolderIdsSet.has(folder.id)} onChange={() => toggleFolderFilter(folder.id)} />
                <span className="folder-filter-check" aria-hidden="true" />
                <span className="folder-filter-name">{folder.name}</span>
                <span className="folder-filter-count">{folder.files.length}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="sidebar-section sidebar-section-tree">
        <span className="sidebar-section-title">arquivos</span>
      </div>

      <div className="sidebar-scroll">
        {displayedVault.rootFiles?.length ? (
          <div className="folder-group">
            <div className="folder-header is-root">
              <span className="folder-caret" aria-hidden="true" />
              <span className="folder-icon is-root-icon" aria-hidden="true" />
              <span className="folder-name">soltos</span>
              <span className="folder-count">{displayedVault.rootFiles.length}</span>
            </div>
            <div className="folder-files">
              {displayedVault.rootFiles.map((f) => (
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

        {displayedVault.folders.map((folder) => (
          <FolderGroup
            key={folder.id}
            folder={folder}
            activeFileId={activeFileId}
            accent={accent}
            onPickFile={onPickFile}
            onNewFile={onNewFile}
            forceOpen={Boolean(normalizedQuery)}
          />
        ))}
        {normalizedQuery && displayedFileCount === 0 ? (
          <div className="sidebar-empty">nenhum arquivo encontrado</div>
        ) : null}
      </div>

      <div className="sidebar-foot">
        <div className="foot-line">
          <span className="foot-label">total</span>
          <span className="foot-value">
            {displayedFileCount} arquivos
          </span>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
