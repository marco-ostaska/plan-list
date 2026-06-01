const assert = require("assert");
const path = require("path");

// We can't easily import the server module because it starts listening,
// so test the resolveSafe logic inline.
function resolveSafe(vaultPath, filePath) {
  const vault = path.resolve(vaultPath);
  const full = path.resolve(filePath);
  if (!full.startsWith(vault + path.sep) && full !== vault) {
    throw new Error("path outside vault");
  }
  return full;
}

assert.strictEqual(
  resolveSafe("/tmp/vault", "/tmp/vault/file.md"),
  "/tmp/vault/file.md"
);

assert.throws(() => resolveSafe("/tmp/vault", "/etc/passwd"), /path outside vault/);

console.log("ok");
