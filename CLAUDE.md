# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm start        # starts Express server on port 8080 (default)
PORT=3000 npm start  # custom port
```

Open `http://localhost:8080/Tasklist.html` in a browser. On first load, enter an absolute path to a folder containing `.md` files as the vault.

There is no build step, no bundler, no transpilation pipeline — the server just serves static files. React and Babel load from CDN in the browser, so `.jsx` files are compiled client-side at runtime.

## Architecture

**Two-layer design:**

- `server.js` — Express API + static file server. All file I/O lives here. Endpoints:
  - `GET /api/vault?path=` — reads a directory tree (max 2 levels) and returns all `.md` files with content
  - `GET/PUT /api/file` — read or save a single file
  - `POST /api/file` — create new `.md` file
  - `PATCH /api/file` — rename a file (also migrates its comments key)
  - `GET/PUT /api/comments?vault=` — read/write `.tasklist-comments.json` in the vault root
  - `GET /api/watch?path=` — SSE stream (via chokidar) that pushes `change/add/remove` events

- `Tasklist.html` — single-page app entry point. Loads scripts via `<script type="text/babel">` in this order: `tweaks-panel.jsx` → `markdown.jsx` → `sidebar.jsx` → `editor.jsx` → `postit.jsx` → `comments.jsx` → `app.jsx`

**Frontend component map:**

- `app.jsx` — root `App` component; owns all state (vault, active file, comments, tweaks); wires debounced autosave (800ms) and SSE hot-reload
- `sidebar.jsx` — file tree navigation
- `editor.jsx` — markdown task-list editor (plain textarea with task-toggle click overlay)
- `postit.jsx` — post-it board view; renders each `- [ ]` / `- [x]` item as a card
- `markdown.jsx` — shared markdown/task parsing; exports `window.extractTasks` used by `FileHeader` in `app.jsx`
- `comments.jsx` — side rail for per-file comments
- `tweaks-panel.jsx` — reusable design-tweaks shell (`useTweaks` hook + `TweaksPanel`, `TweakSection`, `TweakRadio`, `TweakColor`, `TweakToggle`, `TweakSlider` components); persists to `localStorage`

**Data persistence:**

- File content → written directly to disk as `.md` files via `PUT /api/file`
- Comments → stored in `<vault>/.tasklist-comments.json`, keyed by relative file path
- UI preferences (aesthetic, accent, density) → `localStorage` via `useTweaks`
- Last vault path → `localStorage` key `vaultPath`

**`data.js`** contains a static sample vault used during standalone prototyping (not loaded by the live app).

## Key conventions

- The vault path is user-supplied and stored in `localStorage`; `resolveSafe()` in `server.js` prevents path traversal outside the vault root
- File IDs are relative paths from the vault root (e.g., `"trabalho/Semana atual.md"`)
- The `TWEAK_DEFAULTS` block in `app.jsx` is wrapped in `/*EDITMODE-BEGIN*/…/*EDITMODE-END*/` comments — the tweaks-panel edit-mode protocol reads this to pre-populate the panel
- Timestamps are formatted in pt-BR (e.g., "agora", "hoje, 14:32", "ontem")
