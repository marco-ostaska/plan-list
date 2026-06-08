const assert = require("assert");
const fs = require("fs");
const path = require("path");

function readSidebarSource() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "sidebar.jsx"), "utf8");
}

function readStylesSource() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "styles.css"), "utf8");
}

function testSidebarSearchIsControlled() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("const [searchQuery, setSearchQuery] = React.useState(\"\");"),
    "sidebar search should keep the typed query in component state"
  );
  assert.ok(
    source.includes("value={searchQuery}"),
    "sidebar search input should be controlled by search state"
  );
  assert.ok(
    source.includes("onChange={(e) => setSearchQuery(e.target.value)}"),
    "sidebar search input should update search state while typing"
  );
}

function testSidebarSearchFiltersFilesAndFolders() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("rootFiles: filterFiles(rootFiles)"),
    "sidebar search should filter loose root files"
  );
  assert.ok(
    source.includes("const folderMatchesQuery = folder.name.toLowerCase().includes(normalizedQuery);"),
    "sidebar search should detect folder name matches"
  );
  assert.ok(
    source.includes("files: folderMatchesQuery ? folder.files : filterFiles(folder.files)"),
    "sidebar search should keep folder contents when the folder name matches"
  );
  assert.ok(
    source.includes(".filter((folder) => folder.files.length > 0 || folder.name.toLowerCase().includes(normalizedQuery))"),
    "sidebar search should hide folders without matching files or folder names"
  );
}

function testSidebarShowsFoldersWithoutMarkdownFiles() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("const navigableFolders = vault.folders || [];"),
    "sidebar should keep empty folders navigable"
  );
  assert.ok(
    source.includes("const totalFolders = navigableFolders.length;"),
    "sidebar folder count should include empty folders"
  );
  assert.ok(
    source.includes("folders: visibleFolders"),
    "sidebar search should operate on visible folders"
  );
}

function testSidebarNestsSubfoldersUnderParents() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("function buildFolderTree(folders) {"),
    "sidebar should build a tree from flat folder paths"
  );
  assert.ok(
    source.includes("parent.children.push(node);"),
    "sidebar should attach subfolders to their parent folder"
  );
  assert.ok(
    source.includes("function renderFolderTree(folder) {"),
    "sidebar should render nested folder groups recursively"
  );
  assert.ok(
    source.includes("{folder.children.map(renderFolderTree)}"),
    "folder groups should show child folders inside the parent group"
  );
}

function testSidebarSupportsFolderCreationAndDragDrop() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("onNewFolder"),
    "sidebar should expose a folder creation action"
  );
  assert.ok(
    source.includes("draggable={true}"),
    "file rows should be draggable"
  );
  assert.ok(
    source.includes("onDragStart={(e) => onDragStart(e, file.id)}"),
    "file rows should start drags with their file id"
  );
  assert.ok(
    source.includes("onDrop={(e) => onDropFile(e, folder.id)}"),
    "folder rows should accept dropped files"
  );
  assert.ok(
    source.includes("onDrop={(e) => onDropFile(e, \"\")}"),
    "root file group should accept dropped files"
  );
}

function testSidebarCanFilterVisibleFolders() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("const [selectedFolderIds, setSelectedFolderIds] = React.useState(null);"),
    "sidebar should track selected folders for the folder filter"
  );
  assert.ok(
    source.includes("const [folderFilterOpen, setFolderFilterOpen] = React.useState(false);"),
    "sidebar folder filter should open from a compact popover trigger"
  );
  assert.ok(
    source.includes("const visibleFolders = selectedFolderIdsSet ? navigableFolders.filter((folder) => selectedFolderIdsSet.has(folder.id)) : navigableFolders;"),
    "sidebar should only render selected folders when a folder filter is active"
  );
  assert.ok(
    source.includes("const toggleFolderFilter = (folderId) => {"),
    "sidebar should provide a folder filter toggle"
  );
  assert.ok(
    source.includes("className={`folder-filter-button ${folderFilterActive ? \"is-active\" : \"\"}`}"),
    "sidebar should render a compact folder filter button"
  );
  assert.ok(
    source.includes("{folderFilterOpen ? ("),
    "sidebar should only show folder choices when the filter popover is open"
  );
  assert.ok(
    source.includes("<input type=\"checkbox\" checked={!selectedFolderIdsSet || selectedFolderIdsSet.has(folder.id)} onChange={() => toggleFolderFilter(folder.id)} />"),
    "sidebar should render checkbox controls for folder selection"
  );
}

function testFolderFilterScrollStaysInsidePopover() {
  const source = readStylesSource();

  assert.ok(
    source.includes("overscroll-behavior: contain;"),
    "folder filter list should keep wheel and touch scrolling inside the popover"
  );
}

function testSidebarExplorerShowsNavigationContext() {
  const source = readSidebarSource();

  assert(
    source.includes("function folderContainsFile(folder, fileId) {"),
    "folder groups should detect active files recursively"
  );
  assert(
    source.includes("const isActiveFolder = folderContainsFile(folder, activeFileId);"),
    "folder groups should know when they or their child folders contain the active file"
  );
  assert(
    source.includes("if (isActiveFolder || forceOpen) setOpen(true);"),
    "folder groups should open for the active file or active search"
  );
  assert(
    source.includes("const filePath = file.id.split(\"/\").slice(0, -1).join(\"/\");"),
    "file rows should expose relative path context"
  );
  assert(
    source.includes("<span className=\"sidebar-section-title\">explorer</span>"),
    "sidebar should use an explorer-style navigation section"
  );
}

testSidebarSearchIsControlled();
testSidebarSearchFiltersFilesAndFolders();
testSidebarShowsFoldersWithoutMarkdownFiles();
testSidebarNestsSubfoldersUnderParents();
testSidebarCanFilterVisibleFolders();
testFolderFilterScrollStaysInsidePopover();
testSidebarExplorerShowsNavigationContext();
testSidebarSupportsFolderCreationAndDragDrop();
