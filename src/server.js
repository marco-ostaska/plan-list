const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const chokidar = require("chokidar");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: "too many requests" });
  },
});

app.use("/api", apiLimiter);

// ── helpers ──────────────────────────────────────────────────────────────────

function pathInside(basePath, targetPath) {
  const rel = path.relative(basePath, targetPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function getAllowedVaultRoot() {
  return fs.realpathSync(process.env.PLAN_LIST_VAULT_ROOT || os.homedir());
}

function getVaultPath(vaultPath) {
  if (typeof vaultPath !== "string" || !vaultPath.trim()) {
    throw new Error("path required");
  }

  const requestedVault = path.resolve(vaultPath);

  const vault = fs.realpathSync(requestedVault);

  if (!fs.statSync(vault).isDirectory()) {
    throw new Error("not a directory");
  }

  const allowedRoot = getAllowedVaultRoot();
  if (!pathInside(allowedRoot, vault)) {
    throw new Error("path outside allowed root");
  }

  return vault;
}

function resolveVaultPath(vaultPath, filePath) {
  const vault = getVaultPath(vaultPath);
  const full = path.resolve(vault, filePath || "");
  if (!pathInside(vault, full)) {
    throw new Error("path outside vault");
  }
  return full;
}

function resolveExistingVaultPath(vaultPath, filePath) {
  const full = resolveVaultPath(vaultPath, filePath);

  const real = fs.realpathSync(full);
  const vault = getVaultPath(vaultPath);
  if (!pathInside(vault, real)) {
    throw new Error("path outside vault");
  }
  return real;
}

function safeMarkdownFileName(name) {
  const fileName = (name || "Sem título") + (name?.endsWith(".md") ? "" : ".md");
  if (fileName.includes("\0") || path.basename(fileName) !== fileName || !fileName.endsWith(".md")) {
    throw new Error("invalid file name");
  }
  return fileName;
}

function relPath(vaultPath, full) {
  const vault = getVaultPath(vaultPath);
  const resolved = path.resolve(full);
  if (!pathInside(vault, resolved)) {
    throw new Error("path outside vault");
  }
  return path.relative(vault, resolved);
}

function formatMtime(mtime) {
  const d = new Date(mtime);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 2) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffH < 24) return `hoje, ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `${diffD} dias atrás`;
  return d.toLocaleDateString("pt-BR");
}

function statusForPathError(error) {
  if (error.message === "path required") return 400;
  if (error.message === "not a directory") return 400;
  if (error.message === "path outside allowed root") return 403;
  if (error.message === "path outside vault") return 403;
  return 404;
}

// ── GET /api/vault?path= ─────────────────────────────────────────────────────

async function scanVaultAsync(vault, currentDir, depth, maxDepth, result, skipDirs) {
  let entries;
  try {
    entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }

  const fileReads = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(currentDir, entry.name);

    if (entry.isDirectory() && depth < maxDepth) {
      const rel = relPath(vault, full);
      const folder = { id: rel, name: entry.name, files: [] };
      result.folders.push(folder);
      fileReads.push(
        (async () => {
          let subEntries;
          try {
            subEntries = await fs.promises.readdir(full, { withFileTypes: true });
          } catch {
            return;
          }
          const subReads = [];
          for (const sub of subEntries) {
            if (sub.name.startsWith(".") || !sub.name.endsWith(".md")) continue;
            const subFull = path.join(full, sub.name);
            subReads.push(
              (async () => {
                try {
                  const subStat = await fs.promises.stat(subFull);

                  const content = await fs.promises.readFile(subFull, "utf8");
                  folder.files.push({
                    id: relPath(vault, subFull),
                    name: sub.name,
                    updated: formatMtime(subStat.mtimeMs),
                    content,
                    comments: [],
                  });
                } catch {}
              })()
            );
          }
          await Promise.all(subReads);
          // recurse deeper
          await scanVaultAsync(vault, full, depth + 1, maxDepth, result, skipDirs);
        })()
      );
    } else if (entry.isFile() && entry.name.endsWith(".md") && depth === 0) {
      fileReads.push(
        (async () => {
          try {
            const s = await fs.promises.stat(full);

            const content = await fs.promises.readFile(full, "utf8");
            result.rootFiles.push({
              id: relPath(vault, full),
              name: entry.name,
              updated: formatMtime(s.mtimeMs),
              content,
              comments: [],
            });
          } catch {}
        })()
      );
    }
  }

  await Promise.all(fileReads);
}

app.get("/api/vault", async (req, res) => {
  const vaultPath = req.query.path;
  if (!vaultPath) return res.status(400).json({ error: "path required" });

  let vault;
  try {
    vault = getVaultPath(vaultPath);
  } catch (e) {
    return res.status(statusForPathError(e)).json({ error: e.message });
  }

  const result = { name: path.basename(vault), folders: [], rootFiles: [] };
  const SKIP_DIRS = new Set(["node_modules", ".git", ".obsidian", "__pycache__", ".DS_Store"]);

  await scanVaultAsync(vault, vault, 0, 3, result, SKIP_DIRS);

  // Inject comments from .tasklist-comments.json and prune orphans
  const commentsFile = resolveVaultPath(vault, ".tasklist-comments.json");
  if (fs.existsSync(commentsFile)) {
    try {
      const map = JSON.parse(fs.readFileSync(commentsFile, "utf8"));
      const inject = (file) => { file.comments = map[file.id] || []; };
      result.rootFiles.forEach(inject);
      result.folders.forEach((f) => f.files.forEach(inject));

      const existingIds = new Set(result.rootFiles.map((f) => f.id));
      result.folders.forEach((f) => f.files.forEach((file) => existingIds.add(file.id)));
      let pruned = false;
      for (const key of Object.keys(map)) {
        if (!existingIds.has(key)) {
          delete map[key];
          pruned = true;
        }
      }
      if (pruned) {
        fs.writeFileSync(commentsFile, JSON.stringify(map, null, 2), "utf8");
      }
    } catch {}
  }

  res.json(result);
});

// ── GET /api/file?path= ──────────────────────────────────────────────────────

app.get("/api/file", (req, res) => {
  const { path: filePath, vault: vaultPath } = req.query;
  if (!filePath || !vaultPath) return res.status(400).json({ error: "path and vault required" });
  try {
    const full = resolveExistingVaultPath(vaultPath, filePath);
    const content = fs.readFileSync(full, "utf8");

    const stat = fs.statSync(full);
    res.json({ content, updated: formatMtime(stat.mtimeMs) });
  } catch (e) {
    res.status(statusForPathError(e)).json({ error: e.message });
  }
});

// ── PUT /api/file — save content ─────────────────────────────────────────────

app.put("/api/file", (req, res) => {
  const { vault: vaultPath, path: filePath, content } = req.body;
  if (!filePath || !vaultPath) return res.status(400).json({ error: "vault and path required" });
  if (!filePath.endsWith(".md")) return res.status(400).json({ error: "only .md files allowed" });
  const MAX_SIZE = 5 * 1024 * 1024;
  if (content != null && content.length > MAX_SIZE) return res.status(413).json({ error: "content too large" });
  try {
    const full = resolveExistingVaultPath(vaultPath, filePath);
    fs.writeFileSync(full, content, "utf8");

    const stat = fs.statSync(full);
    res.json({ updated: formatMtime(stat.mtimeMs) });
  } catch (e) {
    res.status(statusForPathError(e)).json({ error: e.message });
  }
});

// ── POST /api/file — create new ──────────────────────────────────────────────

app.post("/api/file", (req, res) => {
  const { vault: vaultPath, dir, name } = req.body;
  if (!vaultPath) return res.status(400).json({ error: "vault required" });
  const dir2 = dir || "";
  try {
    const fileName = safeMarkdownFileName(name);
    const dirFull = resolveExistingVaultPath(vaultPath, dir2);
    const fileFull = resolveVaultPath(vaultPath, path.join(relPath(vaultPath, dirFull), fileName));
    if (fs.existsSync(fileFull)) return res.status(409).json({ error: "file exists" });

    fs.writeFileSync(fileFull, `# ${fileName.replace(/\.md$/, "")}\n\n- [ ] primeira task\n`, "utf8");
    const rel = relPath(vaultPath, fileFull);

    res.json({ id: rel, name: fileName, updated: "agora", content: fs.readFileSync(fileFull, "utf8"), comments: [] });
  } catch (e) {
    res.status(statusForPathError(e)).json({ error: e.message });
  }
});

// ── PATCH /api/file — rename ─────────────────────────────────────────────────

app.patch("/api/file", (req, res) => {
  const { vault: vaultPath, path: filePath, newName } = req.body;
  if (!filePath || !vaultPath || !newName) return res.status(400).json({ error: "missing fields" });
  try {
    const full = resolveExistingVaultPath(vaultPath, filePath);
    const newFileName = safeMarkdownFileName(newName);
    const newFull = path.join(path.dirname(full), newFileName);
    resolveVaultPath(vaultPath, relPath(vaultPath, newFull));
    fs.renameSync(full, newFull);
    const newRel = relPath(vaultPath, newFull);

    // Update comments key if needed
    const commentsFile = resolveVaultPath(vaultPath, ".tasklist-comments.json");
    if (fs.existsSync(commentsFile)) {
      try {
        const map = JSON.parse(fs.readFileSync(commentsFile, "utf8"));
        if (map[filePath]) {
          map[newRel] = map[filePath];
          delete map[filePath];
          fs.writeFileSync(commentsFile, JSON.stringify(map, null, 2), "utf8");
        }
      } catch {}
    }

    res.json({ id: newRel, name: newFileName });
  } catch (e) {
    res.status(statusForPathError(e)).json({ error: e.message });
  }
});

// ── GET /api/comments?vault= ─────────────────────────────────────────────────

app.get("/api/comments", (req, res) => {
  const vaultPath = req.query.vault;
  if (!vaultPath) return res.status(400).json({ error: "vault required" });
  try {
    const file = resolveVaultPath(vaultPath, ".tasklist-comments.json");
    if (!fs.existsSync(file)) return res.json({});

    res.json(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (e) {
    if (e.message.startsWith("path ")) return res.status(statusForPathError(e)).json({ error: e.message });
    res.json({});
  }
});

// ── PUT /api/comments?vault= ─────────────────────────────────────────────────

app.put("/api/comments", (req, res) => {
  const vaultPath = req.query.vault;
  if (!vaultPath) return res.status(400).json({ error: "vault required" });
  try {
    const file = resolveVaultPath(vaultPath, ".tasklist-comments.json");
    fs.writeFileSync(file, JSON.stringify(req.body, null, 2), "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(statusForPathError(e)).json({ error: e.message });
  }
});

// ── GET /api/watch?path= — SSE file watcher ──────────────────────────────────

const watchers = new Map();

app.get("/api/watch", (req, res) => {
  const vaultPath = req.query.path;
  if (!vaultPath) return res.status(400).end();

  let vault;
  try {
    vault = getVaultPath(vaultPath);
  } catch (e) {
    return res.status(statusForPathError(e)).end();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const watcher = chokidar.watch(vault, {
    ignored: /(^|[/\\])\.(?!tasklist)/,
    ignoreInitial: true,
    depth: 3,
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  watcher.on("change", (filePath) => {
    send("change", { path: relPath(vault, filePath) });
  });
  watcher.on("add", (filePath) => {
    send("add", { path: relPath(vault, filePath) });
  });
  watcher.on("unlink", (filePath) => {
    send("remove", { path: relPath(vault, filePath) });
  });
  watcher.on("addDir", (dirPath) => {
    send("add", { path: relPath(vault, dirPath) });
  });
  watcher.on("unlinkDir", (dirPath) => {
    send("remove", { path: relPath(vault, dirPath) });
  });

  const cleanup = () => {
    watcher.close();
    watchers.delete(req);
    clearInterval(heartbeat);
  };

  watchers.set(req, watcher);
  const heartbeat = setInterval(() => {
    try {
      res.write(":ping\n\n");
    } catch {
      cleanup();
    }
  }, 30000);

  req.on("close", cleanup);
});

// ── start ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`plan-list running at http://0.0.0.0:${PORT}`);
  });
}

module.exports = {
  app,
  apiLimiter,
  getVaultPath,
  resolveVaultPath,
  resolveExistingVaultPath,
  safeMarkdownFileName,
};
