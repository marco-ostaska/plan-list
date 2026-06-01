const express = require("express");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── helpers ──────────────────────────────────────────────────────────────────

function resolveSafe(vaultPath, filePath) {
  const vault = path.resolve(vaultPath);
  const full = path.resolve(filePath);
  if (!full.startsWith(vault + path.sep) && full !== vault) {
    throw new Error("path outside vault");
  }
  return full;
}

function relPath(vaultPath, full) {
  return path.relative(path.resolve(vaultPath), full);
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

// ── GET /api/vault?path= ─────────────────────────────────────────────────────

app.get("/api/vault", (req, res) => {
  const vaultPath = req.query.path;
  if (!vaultPath) return res.status(400).json({ error: "path required" });

  const vault = path.resolve(vaultPath);
  if (!fs.existsSync(vault)) return res.status(404).json({ error: "path not found" });

  const stat = fs.statSync(vault);
  if (!stat.isDirectory()) return res.status(400).json({ error: "not a directory" });

  const result = { name: path.basename(vault), folders: [], rootFiles: [] };
  const entries = fs.readdirSync(vault, { withFileTypes: true });

  const SKIP_DIRS = new Set(["node_modules", ".git", ".obsidian", "__pycache__", ".DS_Store"]);

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(vault, entry.name);

    if (entry.isDirectory()) {
      const folder = { id: entry.name, name: entry.name, files: [] };
      const subEntries = fs.readdirSync(full, { withFileTypes: true });
      for (const sub of subEntries) {
        if (sub.name.startsWith(".") || !sub.name.endsWith(".md")) continue;
        const subFull = path.join(full, sub.name);
        const subStat = fs.statSync(subFull);
        folder.files.push({
          id: relPath(vault, subFull),
          name: sub.name,
          updated: formatMtime(subStat.mtimeMs),
          content: fs.readFileSync(subFull, "utf8"),
          comments: [],
        });
      }
      result.folders.push(folder);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const s = fs.statSync(full);
      result.rootFiles.push({
        id: relPath(vault, full),
        name: entry.name,
        updated: formatMtime(s.mtimeMs),
        content: fs.readFileSync(full, "utf8"),
        comments: [],
      });
    }
  }

  // Inject comments from .tasklist-comments.json
  const commentsFile = path.join(vault, ".tasklist-comments.json");
  if (fs.existsSync(commentsFile)) {
    try {
      const map = JSON.parse(fs.readFileSync(commentsFile, "utf8"));
      const inject = (file) => { file.comments = map[file.id] || []; };
      result.rootFiles.forEach(inject);
      result.folders.forEach((f) => f.files.forEach(inject));
    } catch {}
  }

  res.json(result);
});

// ── GET /api/file?path= ──────────────────────────────────────────────────────

app.get("/api/file", (req, res) => {
  const { path: filePath, vault: vaultPath } = req.query;
  if (!filePath || !vaultPath) return res.status(400).json({ error: "path and vault required" });
  try {
    const full = resolveSafe(vaultPath, path.resolve(vaultPath, filePath));
    const content = fs.readFileSync(full, "utf8");
    const stat = fs.statSync(full);
    res.json({ content, updated: formatMtime(stat.mtimeMs) });
  } catch (e) {
    res.status(e.message === "path outside vault" ? 403 : 404).json({ error: e.message });
  }
});

// ── PUT /api/file — save content ─────────────────────────────────────────────

app.put("/api/file", (req, res) => {
  const { vault: vaultPath, path: filePath, content } = req.body;
  if (!filePath || !vaultPath) return res.status(400).json({ error: "vault and path required" });
  try {
    const full = resolveSafe(vaultPath, path.resolve(vaultPath, filePath));
    fs.writeFileSync(full, content, "utf8");
    const stat = fs.statSync(full);
    res.json({ updated: formatMtime(stat.mtimeMs) });
  } catch (e) {
    res.status(e.message === "path outside vault" ? 403 : 500).json({ error: e.message });
  }
});

// ── POST /api/file — create new ──────────────────────────────────────────────

app.post("/api/file", (req, res) => {
  const { vault: vaultPath, dir, name } = req.body;
  if (!vaultPath) return res.status(400).json({ error: "vault required" });
  const fileName = (name || "Sem título") + (name?.endsWith(".md") ? "" : ".md");
  const dir2 = dir || "";
  try {
    const dirFull = resolveSafe(vaultPath, path.resolve(vaultPath, dir2));
    const fileFull = path.join(dirFull, fileName);
    if (fs.existsSync(fileFull)) return res.status(409).json({ error: "file exists" });
    fs.writeFileSync(fileFull, `# ${fileName.replace(/\.md$/, "")}\n\n- [ ] primeira task\n`, "utf8");
    const rel = relPath(vaultPath, fileFull);
    res.json({ id: rel, name: fileName, updated: "agora", content: fs.readFileSync(fileFull, "utf8"), comments: [] });
  } catch (e) {
    res.status(e.message === "path outside vault" ? 403 : 500).json({ error: e.message });
  }
});

// ── PATCH /api/file — rename ─────────────────────────────────────────────────

app.patch("/api/file", (req, res) => {
  const { vault: vaultPath, path: filePath, newName } = req.body;
  if (!filePath || !vaultPath || !newName) return res.status(400).json({ error: "missing fields" });
  try {
    const full = resolveSafe(vaultPath, path.resolve(vaultPath, filePath));
    const newFileName = newName.endsWith(".md") ? newName : newName + ".md";
    const newFull = path.join(path.dirname(full), newFileName);
    resolveSafe(vaultPath, newFull);
    fs.renameSync(full, newFull);
    const newRel = relPath(vaultPath, newFull);

    // Update comments key if needed
    const commentsFile = path.join(path.resolve(vaultPath), ".tasklist-comments.json");
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
    res.status(e.message === "path outside vault" ? 403 : 500).json({ error: e.message });
  }
});

// ── GET /api/comments?vault= ─────────────────────────────────────────────────

app.get("/api/comments", (req, res) => {
  const vaultPath = req.query.vault;
  if (!vaultPath) return res.status(400).json({ error: "vault required" });
  const file = path.join(path.resolve(vaultPath), ".tasklist-comments.json");
  if (!fs.existsSync(file)) return res.json({});
  try {
    res.json(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    res.json({});
  }
});

// ── PUT /api/comments?vault= ─────────────────────────────────────────────────

app.put("/api/comments", (req, res) => {
  const vaultPath = req.query.vault;
  if (!vaultPath) return res.status(400).json({ error: "vault required" });
  const file = path.join(path.resolve(vaultPath), ".tasklist-comments.json");
  try {
    fs.writeFileSync(file, JSON.stringify(req.body, null, 2), "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/watch?path= — SSE file watcher ──────────────────────────────────

const watchers = new Map();

app.get("/api/watch", (req, res) => {
  const vaultPath = req.query.path;
  if (!vaultPath) return res.status(400).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const vault = path.resolve(vaultPath);
  const watcher = chokidar.watch(vault, {
    ignored: /(^|[/\\])\.(?!tasklist)/,
    ignoreInitial: true,
    depth: 2,
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

  req.on("close", () => {
    watcher.close();
  });
});

// ── start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`plan-list running at http://0.0.0.0:${PORT}`);
});
