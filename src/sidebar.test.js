const assert = require("assert");
const fs = require("fs");
const path = require("path");

function readSidebarSource() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "sidebar.jsx"), "utf8");
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

function testSidebarHidesFoldersWithoutMarkdownFiles() {
  const source = readSidebarSource();

  assert.ok(
    source.includes("const navigableFolders = vault.folders.filter((folder) => folder.files.some((file) => file.name.endsWith(\".md\")));"),
    "sidebar should hide folders that do not contain markdown files"
  );
  assert.ok(
    source.includes("const totalFolders = navigableFolders.length;"),
    "sidebar folder count should only include navigable markdown folders"
  );
  assert.ok(
    source.includes("folders: visibleFolders"),
    "sidebar search should only operate on visible markdown folders"
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

function testSidebarExplorerShowsNavigationContext() {
  const source = readSidebarSource();

  assert(
    source.includes("const isActiveFolder = folder.files.some((file) => file.id === activeFileId);"),
    "folder groups should know when they contain the active file"
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
testSidebarHidesFoldersWithoutMarkdownFiles();
testSidebarCanFilterVisibleFolders();
testSidebarExplorerShowsNavigationContext();
