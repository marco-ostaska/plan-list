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

testMarkdownModeEditsWholeDocument();
testApiParsingHandlesNonJsonResponses();
testVisualThemeUsesGitHubTheme();
