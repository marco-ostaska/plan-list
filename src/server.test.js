const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.PLAN_LIST_VAULT_ROOT = os.tmpdir();

const {
  apiLimiter,
  createFolder,
  getVaultPath,
  moveMarkdownFile,
  resolveVaultPath,
  resolveExistingVaultPath,
  safeMarkdownFileName,
  scanVaultAsync,
} = require("./server");

test("server exports the API rate limiter middleware", () => {
  assert.equal(typeof apiLimiter, "function");
});

test("API rate limiter returns JSON errors", () => {
  const serverSource = fs.readFileSync(path.join(__dirname, "server.js"), "utf8");

  assert.match(serverSource, /res\.status\(429\)\.json\(\{ error: "too many requests" \}\)/);
});

test("getVaultPath returns a canonical directory under the allowed root", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));

  assert.equal(getVaultPath(vault), fs.realpathSync(vault));
});

test("getVaultPath rejects directories outside the allowed root", () => {
  process.env.PLAN_LIST_VAULT_ROOT = path.join(os.tmpdir(), "allowed-plan-list-root");
  fs.mkdirSync(process.env.PLAN_LIST_VAULT_ROOT, { recursive: true });

  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "outside-plan-list-vault-"));

  assert.throws(() => getVaultPath(outside), /path outside allowed root/);

  process.env.PLAN_LIST_VAULT_ROOT = os.tmpdir();
});

test("resolveVaultPath keeps relative file paths inside the vault", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));

  assert.equal(resolveVaultPath(vault, "notes/today.md"), path.join(vault, "notes/today.md"));
  assert.throws(() => resolveVaultPath(vault, "../outside.md"), /path outside vault/);
  assert.throws(() => resolveVaultPath(vault, "/etc/passwd"), /path outside vault/);
});

test("resolveExistingVaultPath rejects symlinks that leave the vault", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));
  const outside = path.join(os.tmpdir(), `plan-list-outside-${Date.now()}.md`);
  fs.writeFileSync(outside, "outside", "utf8");
  fs.symlinkSync(outside, path.join(vault, "linked.md"));

  assert.throws(() => resolveExistingVaultPath(vault, "linked.md"), /path outside vault/);
});

test("safeMarkdownFileName rejects path separators", () => {
  assert.equal(safeMarkdownFileName("today"), "today.md");
  assert.equal(safeMarkdownFileName("today.md"), "today.md");
  assert.throws(() => safeMarkdownFileName("../outside"), /invalid file name/);
  assert.throws(() => safeMarkdownFileName("nested/file"), /invalid file name/);
});

test("createFolder creates nested folders", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));

  let result = createFolder(vault, "", "Projects");
  assert.equal(result.id, "Projects");
  assert.deepEqual(result.files, []);

  result = createFolder(vault, "Projects", "Q1");
  assert.equal(result.id, path.join("Projects", "Q1"));
  assert.equal(fs.statSync(path.join(vault, "Projects", "Q1")).isDirectory(), true);
});

test("scanVaultAsync returns empty nested folders", async () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));
  fs.mkdirSync(path.join(vault, "Projects", "Q1"), { recursive: true });
  const result = { name: path.basename(vault), folders: [], rootFiles: [] };

  await scanVaultAsync(vault, vault, 0, result, new Set());

  assert.ok(result.folders.some((folder) => folder.id === "Projects" && folder.files.length === 0));
  assert.ok(result.folders.some((folder) => folder.id === path.join("Projects", "Q1") && folder.files.length === 0));
});

test("createFolder rejects unsafe folder names", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));

  assert.throws(() => createFolder(vault, "", "../outside"), /invalid folder name/);
});

test("moveMarkdownFile moves files, supports root moves, and remaps comments", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));
  const folder = path.join(vault, "Projects", "Q1");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(vault, "today.md"), "# Today\n", "utf8");
  fs.writeFileSync(
    path.join(vault, ".tasklist-comments.json"),
    JSON.stringify({ "today.md": [{ id: "c1", text: "keep me" }] }, null, 2),
    "utf8"
  );

  let result = moveMarkdownFile(vault, "today.md", "Projects/Q1");
  assert.equal(result.id, path.join("Projects", "Q1", "today.md"));
  assert.equal(fs.existsSync(path.join(folder, "today.md")), true);

  let comments = JSON.parse(fs.readFileSync(path.join(vault, ".tasklist-comments.json"), "utf8"));
  assert.deepEqual(comments[path.join("Projects", "Q1", "today.md")], [{ id: "c1", text: "keep me" }]);
  assert.equal(comments["today.md"], undefined);

  result = moveMarkdownFile(vault, "Projects/Q1/today.md", "");
  assert.equal(result.id, "today.md");
  assert.equal(fs.existsSync(path.join(vault, "today.md")), true);
});

test("moveMarkdownFile blocks markdown file name conflicts", () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "plan-list-vault-"));
  fs.mkdirSync(path.join(vault, "Projects"), { recursive: true });
  fs.writeFileSync(path.join(vault, "today.md"), "# Root\n", "utf8");
  fs.writeFileSync(path.join(vault, "Projects", "today.md"), "# Existing\n", "utf8");

  assert.throws(() => moveMarkdownFile(vault, "today.md", "Projects"), /file exists/);
  assert.equal(fs.readFileSync(path.join(vault, "Projects", "today.md"), "utf8"), "# Existing\n");
});
