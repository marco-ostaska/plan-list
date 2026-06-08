// Sidebar — GitHub-style file tree.

function FileGlyph() {
  return (
    <svg className="tree-glyph" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
    </svg>
  );
}

function FolderGlyph({ open }) {
  return (
    <svg className="tree-glyph" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      {open ? (
        <path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0-.75.75v5.514l1.736-3.978A.75.75 0 0 1 4.42 6.5H15.5a.75.75 0 0 1 .687 1.05l-2.32 5.32A1.75 1.75 0 0 1 12.262 14H1.75a1.75 1.75 0 0 1-1.75-1.75V2.75c0-.464.184-.909.513-1.237Z" />
      ) : (
        <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z" />
      )}
    </svg>
  );
}

function FileRow({ file, active, onClick, onDragStart }) {
  const tasks = window.extractTasks(file.content);
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;
  const displayName = file.name.replace(/\.md$/, "");
  const filePath = file.id.split("/").slice(0, -1).join("/");

  return (
    <button
      className={`tree-row file-row ${active ? "is-active" : ""}`}
      onClick={onClick}
      draggable={true}
      onDragStart={(e) => onDragStart(e, file.id)}
      data-comment-anchor={`file-${file.id}`}
      title={displayName}
    >
      <span className="tree-indent" aria-hidden="true" />
      <FileGlyph />
      <span className="tree-name">{displayName}</span>
      {filePath ? <span className="file-path">{filePath}</span> : null}
      {total > 0 ? (
        <span className={`file-progress ${complete ? "is-complete" : ""}`}>
          <span className="fp-count">{done}/{total}</span>
          <span className="fp-bar"><span className="fp-bar-fill" style={{ width: `${pct}%` }} /></span>
        </span>
      ) : null}
    </button>
  );
}

function FolderGroup({ folder, activeFileId, onPickFile, onNewFile, onNewFolder, onMoveFile, onDragStart, forceOpen }) {
  const [open, setOpen] = React.useState(true);
  const [dragOver, setDragOver] = React.useState(false);
  const isActiveFolder = folder.files.some((file) => file.id === activeFileId);
  React.useEffect(() => { if (isActiveFolder || forceOpen) setOpen(true); }, [isActiveFolder, forceOpen]);
  const onDropFile = (e, targetDir) => {
    e.preventDefault();
    setDragOver(false);
    const fileId = e.dataTransfer.getData("text/plain");
    if (fileId) onMoveFile(fileId, targetDir);
  };

  return (
    <div className={`folder-group ${isActiveFolder ? "has-active-file" : ""} ${dragOver ? "is-drop-target" : ""}`}>
      <button
        className="tree-row folder-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => onDropFile(e, folder.id)}
      >
        <span className={`folder-caret ${open ? "is-open" : ""}`}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" /></svg>
        </span>
        <FolderGlyph open={open} />
        <span className="tree-name">{folder.name}</span>
        <span className="tree-count">{folder.files.length}</span>
        <span className="icon-btn folder-new-btn" title="Nova pasta"
          onClick={(e) => { e.stopPropagation(); onNewFolder(folder.id); }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-6.5A1.75 1.75 0 0 0 14.25 4H7.5a.25.25 0 0 1-.2-.1L6.4 2.7A1.75 1.75 0 0 0 5 2Zm8.75 4.25a.75.75 0 0 1 .75.75v1.25h1.25a.75.75 0 0 1 0 1.5h-1.25V11a.75.75 0 0 1-1.5 0V9.75H8.5a.75.75 0 0 1 0-1.5h1.25V7a.75.75 0 0 1 .75-.75Z" /></svg>
        </span>
        <span className="icon-btn folder-new-btn" title="Novo arquivo"
          onClick={(e) => { e.stopPropagation(); onNewFile(folder.id); }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7.25h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 7.75 2Z" /></svg>
        </span>
      </button>
      {open ? (
        <div className="folder-files">
          {folder.files.map((f) => (
            <FileRow key={f.id} file={f} active={f.id === activeFileId} onClick={() => onPickFile(f.id, folder.id)} onDragStart={onDragStart} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ vault, activeFileId, onPickFile, onNewFile, onNewFolder, onMoveFile, onChangeVault }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFolderIds, setSelectedFolderIds] = React.useState(null);
  const [folderFilterOpen, setFolderFilterOpen] = React.useState(false);
  const [rootDragOver, setRootDragOver] = React.useState(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const rootFiles = vault.rootFiles || [];
  const navigableFolders = vault.folders || [];

  const selectedFolderIdsSet = selectedFolderIds ? new Set(selectedFolderIds) : null;
  const visibleFolders = selectedFolderIdsSet ? navigableFolders.filter((folder) => selectedFolderIdsSet.has(folder.id)) : navigableFolders;
  const folderFilterActive = selectedFolderIds !== null;
  const totalFolders = navigableFolders.length;
  const visibleFolderCount = visibleFolders.length;
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
    return files.filter((file) =>
      file.name.toLowerCase().includes(normalizedQuery) ||
      (file.content || "").toLowerCase().includes(normalizedQuery)
    );
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
  const totalFiles = visibleFolders.reduce((n, f) => n + f.files.length, 0) + rootFiles.length;
  const allFiles = navigableFolders.reduce((n, f) => n + f.files.length, 0) + rootFiles.length;
  const onDragStart = (e, fileId) => {
    e.dataTransfer.setData("text/plain", fileId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDropFile = (e, targetDir) => {
    e.preventDefault();
    setRootDragOver(false);
    const fileId = e.dataTransfer.getData("text/plain");
    if (fileId) onMoveFile(fileId, targetDir);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <button className="repo-btn" onClick={onChangeVault} title="Trocar pasta">
          <span className="repo-glyph" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" /></svg>
          </span>
          <span className="repo-copy">
            <span className="repo-name">{vault.name}</span>
            <span className="repo-branch">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" /></svg>
              main
            </span>
          </span>
        </button>
        <button className="icon-btn" title="Nova pasta" onClick={() => onNewFolder("")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-6.5A1.75 1.75 0 0 0 14.25 4H7.5a.25.25 0 0 1-.2-.1L6.4 2.7A1.75 1.75 0 0 0 5 2Zm8.75 4.25a.75.75 0 0 1 .75.75v1.25h1.25a.75.75 0 0 1 0 1.5h-1.25V11a.75.75 0 0 1-1.5 0V9.75H8.5a.75.75 0 0 1 0-1.5h1.25V7a.75.75 0 0 1 .75-.75Z" /></svg>
        </button>
        <button className="icon-btn" title="Novo arquivo" onClick={() => onNewFile("")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7.25h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 7.75 2Z" /></svg>
        </button>
      </div>

      <div className="sidebar-search">
        <span className="search-icon" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" /></svg>
        </span>
        <input type="text" placeholder="Buscar arquivos…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="sidebar-section-label">
        <span>Arquivos</span>
        <span className="sidebar-section-title">explorer</span>
        <div className="section-label-actions">
          <span className="muted">{normalizedQuery ? displayedFileCount : totalFiles}{normalizedQuery || folderFilterActive ? `/${allFiles}` : ""}</span>
          <span className="sidebar-section-meta">
            {folderFilterActive ? `${visibleFolderCount}/${totalFolders}` : totalFolders} pastas / {totalFiles} arquivos
          </span>
          {navigableFolders.length > 0 ? (
            <button
              className={`folder-filter-button ${folderFilterActive ? "is-active" : ""}`}
              onClick={() => setFolderFilterOpen((o) => !o)}
              aria-expanded={folderFilterOpen}
              title="Filtrar pastas"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M.75 3h14.5a.75.75 0 0 1 .53 1.28L10 10.06v3.69a.75.75 0 0 1-1.13.65l-2.5-1.5a.75.75 0 0 1-.37-.64v-2.2L.22 4.28A.75.75 0 0 1 .75 3Z" /></svg>
              Filtro
              {folderFilterActive ? <span className="filter-dot" /> : null}
            </button>
          ) : null}
        </div>
      </div>

      {folderFilterOpen ? (
        <div className="filter-popover">
          <div className="filter-popover-head">
            <span className="filter-popover-title">Pastas</span>
            <button className="filter-reset" onClick={() => setSelectedFolderIds(null)}>Todas</button>
          </div>
          <div className="filter-popover-list">
            {navigableFolders.map((folder) => (
              <label className="filter-option" key={folder.id} title={folder.name}>
                <input type="checkbox" checked={!selectedFolderIdsSet || selectedFolderIdsSet.has(folder.id)} onChange={() => toggleFolderFilter(folder.id)} />
                <span className="filter-check" aria-hidden="true" />
                <span className="filter-option-name">{folder.name}</span>
                <span className="filter-option-count">{folder.files.length}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="sidebar-scroll">
        {displayedVault.rootFiles?.length || !normalizedQuery ? (
          <div className={`folder-group ${rootDragOver ? "is-drop-target" : ""}`}>
            <div
              className="tree-row folder-header is-root"
              onDragOver={(e) => { e.preventDefault(); setRootDragOver(true); }}
              onDragLeave={() => setRootDragOver(false)}
              onDrop={(e) => onDropFile(e, "")}
            >
              <span className="folder-caret is-empty" aria-hidden="true" />
              <FolderGlyph open={true} />
              <span className="tree-name">soltos</span>
              <span className="tree-count">{displayedVault.rootFiles.length}</span>
            </div>
            <div className="folder-files">
              {displayedVault.rootFiles.map((f) => (
                <FileRow key={f.id} file={f} active={f.id === activeFileId} onClick={() => onPickFile(f.id, null)} onDragStart={onDragStart} />
              ))}
            </div>
          </div>
        ) : null}

        {displayedVault.folders.map((folder) => (
          <FolderGroup
            key={folder.id}
            folder={folder}
            activeFileId={activeFileId}
            onPickFile={onPickFile}
            onNewFile={onNewFile}
            onNewFolder={onNewFolder}
            onMoveFile={onMoveFile}
            onDragStart={onDragStart}
            forceOpen={Boolean(normalizedQuery)}
          />
        ))}

        {normalizedQuery && displayedFileCount === 0 ? (
          <div className="sidebar-empty">Nenhum arquivo encontrado para “{searchQuery}”.</div>
        ) : null}
      </div>

      <div className="sidebar-foot">
        <span className="foot-label">Total</span>
        <span className="foot-value">{allFiles} arquivos</span>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
