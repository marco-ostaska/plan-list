const assert = require("assert");
const fs = require("fs");
const path = require("path");

function readAppSource() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "app.jsx"), "utf8");
}

function testMarkdownModeEditsWholeDocument() {
  const source = readAppSource();

  assert.ok(source.includes('onClick={() => onChange("markdown")}'), "view toggle should expose markdown mode");
  assert.ok(source.includes('className="raw-markdown-editor"'), "markdown mode should render a full-document textarea");
  assert.ok(
    source.includes("onChange={(e) => handleContentChange(e.target.value)}"),
    "markdown textarea should reuse the app save path"
  );
}

function testApiParsingHandlesNonJsonResponses() {
  const source = readAppSource();

  assert.ok(source.includes("async function readJsonResponse(response)"), "app should centralize API JSON parsing");
  assert.ok(source.includes("return { error: text };"), "API parser should preserve non-JSON error bodies");
}

function testVisualThemeUsesGitHubTheme() {
  const source = readAppSource();

  assert.ok(source.includes('"aesthetic": "github"'), "default aesthetic should be GitHub light");
  assert.ok(source.includes('{ value: "github", label: "GitHub claro" }'), "theme picker should expose GitHub light");
  assert.ok(source.includes('{ value: "github-dark", label: "GitHub escuro" }'), "theme picker should expose GitHub dark");
  assert.strictEqual(source.includes("TweakColor"), false, "theme should not be overridden by arbitrary accent colors");
}

function testRedesignShellKeepsRealApiPersistence() {
  const source = readAppSource();

  assert.ok(source.includes("function ViewTabs({ mode, onChange })"), "redesign should use the new view tabs");
  assert.ok(source.includes('className="file-topbar"'), "redesign should render the GitHub-style file topbar");
  assert.ok(source.includes('className="file-box"'), "redesign should render the bordered file box");
  assert.strictEqual(source.includes("<FileHeader"), false, "old file header should be removed from the rendered shell");
  assert.ok(source.includes("const debouncedPersist = useDebounce(persistContent, 800);"), "content edits should still use debounced API persistence");
  assert.ok(source.includes("fetch(\"/api/file\""), "file writes should still go through the server API");
  assert.ok(source.includes("fetch(`/api/comments?vault=${encodeURIComponent(vaultPath)}`"), "comments should still be persisted by vault path");
}

function testVaultLoadSelectsInitialFile() {
  const source = readAppSource();

  assert.ok(source.includes("function getFirstVaultFile(vault)"), "app should centralize initial file selection");
  assert.ok(source.includes("const firstFile = getFirstVaultFile(data);"), "vault loading should find the first available file");
  assert.ok(source.includes("setActiveFileId(firstFile.id);"), "vault loading should select the first file when there is no active file");
  assert.ok(source.includes("setFileContent(firstFile.content || \"\");"), "initial selection should hydrate editor content");
}

function testAppSupportsFolderCreationAndFileMoves() {
  const source = readAppSource();

  assert.ok(source.includes("const handleNewFolder = async (parentDir = \"\") => {"), "app should provide a folder creation handler");
  assert.ok(source.includes("fetch(\"/api/folder\""), "folder creation should go through the folder API");
  assert.ok(source.includes("const handleMoveFile = async (fileId, targetDir) => {"), "app should provide a file move handler");
  assert.ok(source.includes("fetch(\"/api/file/move\""), "file moves should go through the move API");
  assert.ok(source.includes("onMoveFile={handleMoveFile}"), "sidebar should receive the move handler");
  assert.ok(source.includes("onNewFolder={handleNewFolder}"), "sidebar should receive the folder creation handler");
}

testMarkdownModeEditsWholeDocument();
testApiParsingHandlesNonJsonResponses();
testVisualThemeUsesGitHubTheme();
testRedesignShellKeepsRealApiPersistence();
testVaultLoadSelectsInitialFile();
testAppSupportsFolderCreationAndFileMoves();
