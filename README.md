# plan-list

A lightweight markdown task-list app with a post-it board view. All data is stored as plain `.md` files on disk — no database, no lock-in.

## Running locally

```bash
npm install
npm start
```

Then open `http://localhost:8080/Tasklist.html` in your browser.

On first load, enter an absolute path to a folder containing `.md` files as the vault.

## Stack

- **Backend:** Express (Node.js) — handles file I/O, comments persistence, and SSE hot-reload via `chokidar`
- **Frontend:** React 18 (loaded from CDN) + Babel standalone (client-side JSX compilation)
- **Styling:** plain CSS with CSS custom properties

## Project structure

```
plan-list/
├── src/
│   └── server.js          # Express API + static file server
├── public/                # Frontend assets served statically
│   ├── Tasklist.html      # SPA entry point
│   ├── styles.css
│   ├── app.jsx            # Root React component
│   ├── tweaks-panel.jsx
│   ├── markdown.jsx
│   ├── sidebar.jsx
│   ├── editor.jsx
│   ├── postit.jsx
│   ├── comments.jsx
│   └── data.js            # Static sample vault (prototyping)
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── codeql.yml
├── package.json
├── .gitignore
├── .editorconfig
└── LICENSE
```

## Data persistence

- **File content** → written directly to disk as `.md` files via `PUT /api/file`
- **Comments** → stored in `<vault>/.tasklist-comments.json`, keyed by relative file path
- **UI preferences** → `localStorage` via `useTweaks` hook
- **Last vault path** → `localStorage` key `vaultPath`
