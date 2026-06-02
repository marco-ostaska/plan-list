const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadMarkdownModule() {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "markdown.jsx"), "utf8");
  const parserSource = source.split("window.renderInline")[0];
  const sandbox = { window: {} };
  vm.runInNewContext(parserSource, sandbox);
  return sandbox.window;
}

function loadMarkdownParser() {
  return loadMarkdownModule().parseMarkdown;
}

function extractTasksFromBlocks(blocks) {
  const out = [];
  let currentHeading = null;
  for (const block of blocks) {
    if (block.kind === "heading") currentHeading = block.text;
    if (block.kind === "task") out.push({ ...block, section: currentHeading });
  }
  return out;
}

function sameRealm(value) {
  return JSON.parse(JSON.stringify(value));
}

function testParseMarkdownCodeFence() {
  const parseMarkdown = loadMarkdownParser();
  const blocks = parseMarkdown(["# Plan", "", "```bash", "npm test", "echo ok", "```"].join("\n"));

  const code = blocks.find((block) => block.kind === "code");
  assert.ok(code, "expected a code block");
  assert.strictEqual(code.lang, "bash");
  assert.strictEqual(code.text, "npm test\necho ok");
  assert.strictEqual(code.lineIdx, 2);
  assert.strictEqual(code.lineCount, 4);
}

function testParseMarkdownTable() {
  const parseMarkdown = loadMarkdownParser();
  const blocks = parseMarkdown(["| Scenario | Test |", "|---|---|", "| code block | testParseMarkdownCodeFence |"].join("\n"));

  const table = blocks.find((block) => block.kind === "table");
  assert.ok(table, "expected a table block");
  assert.deepStrictEqual(sameRealm(table.headers), ["Scenario", "Test"]);
  assert.deepStrictEqual(sameRealm(table.rows), [["code block", "testParseMarkdownCodeFence"]]);
  assert.strictEqual(table.lineIdx, 0);
  assert.strictEqual(table.lineCount, 3);
}

function testExtractTasksAroundAdvancedBlocks() {
  const parseMarkdown = loadMarkdownParser();
  const blocks = parseMarkdown([
    "## Tasks",
    "- [ ] before table",
    "| Col | Value |",
    "|---|---|",
    "| not a task | - [ ] ignored |",
    "```text",
    "- [ ] ignored inside code",
    "```",
    "- [x] after code",
  ].join("\n"));

  const tasks = extractTasksFromBlocks(blocks);
  assert.deepStrictEqual(sameRealm(tasks.map((task) => task.text)), ["before table", "after code"]);
  assert.deepStrictEqual(sameRealm(tasks.map((task) => task.section)), ["Tasks", "Tasks"]);
}

function testParagraphStopsBeforeTable() {
  const parseMarkdown = loadMarkdownParser();
  const blocks = parseMarkdown(["Intro line", "| Col | Value |", "|---|---|", "| A | B |"].join("\n"));

  assert.strictEqual(blocks[0].kind, "para");
  assert.strictEqual(blocks[0].text, "Intro line");
  assert.strictEqual(blocks[0].lineCount, 1);
  assert.strictEqual(blocks[1].kind, "table");
}

function testParseInlineFormatting() {
  const markdown = loadMarkdownModule();
  const tokens = markdown.parseInlineMarkdown("**Data source:** `docs/personal.csv`\n**Job:** `pa-delete-account`");

  assert.deepStrictEqual(sameRealm(tokens), [
    { kind: "strong", text: "Data source:" },
    { kind: "text", text: " " },
    { kind: "code", text: "docs/personal.csv" },
    { kind: "br" },
    { kind: "strong", text: "Job:" },
    { kind: "text", text: " " },
    { kind: "code", text: "pa-delete-account" },
  ]);
}

testParseMarkdownCodeFence();
testParseMarkdownTable();
testExtractTasksAroundAdvancedBlocks();
testParagraphStopsBeforeTable();
testParseInlineFormatting();
