const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.PLAN_LIST_VAULT_ROOT = os.tmpdir();

const {
  getVaultPath,
  resolveVaultPath,
  resolveExistingVaultPath,
  safeMarkdownFileName,
} = require("./server");

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
