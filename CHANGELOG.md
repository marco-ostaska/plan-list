# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Sidebar search for matching markdown files by file name, folder name, or file content.
- Folder filter controls for narrowing the sidebar explorer to selected markdown folders.
- Explorer-style sidebar metadata, path context, active-folder expansion, and empty-search feedback.
- Live editing updates for auto-focused editor blocks so newly continued blocks persist while typing.
- Sidebar source tests covering search, folder filtering, markdown-folder visibility, and explorer context.

### Changed

- Refined the sidebar layout, icons, spacing, and file/folder presentation for denser vault navigation.

## [1.0.0] - 2026-06-02

### Added

- Initial markdown task-list application with an Express backend and React frontend served from `Tasklist.html`.
- Plain-file vault storage for `.md` files, including file loading, saving, creation, and comments persisted in `.tasklist-comments.json`.
- Post-it board, markdown editor, sidebar navigation, comments panel, and tweak controls for local UI preferences.
- Server-sent event file watching for vault reloads when markdown files change on disk.
- Nested markdown discovery and directory watching up to three levels deep.
- Per-folder new-file creation with a custom name prompt.
- Markdown block rendering tests and server API/path handling tests.
- Dependabot and CodeQL configuration for dependency and code-scanning coverage.
- Repository structure with `src/` for the server and tests, `public/` for frontend assets, README, MIT license, EditorConfig, and Node.js package metadata.

### Changed

- Reorganized the original flat prototype into `src/` and `public/`, with static serving updated to match the new layout.
- Improved markdown block rendering and inline formatting support.
- Switched the interface to readable sans typography and a neutral workbench visual theme.
- Kept markdown content selectable in the editor surface.
- Updated dependencies and package metadata for the released application shape.
- Filtered reviewed CodeQL path alerts through a dedicated CodeQL config.

### Removed

- Removed internal planning docs and assistant-specific repo instructions from tracked project files.

### Fixed

- Fixed path validation for vault access and file writes.
- Fixed nested markdown listing below the vault root.
- Restored scrolling in the main content area and sidebar.
- Fixed frontend robustness issues around stale debounced callbacks, malformed SSE payloads, in-flight file fetch cancellation, dirty editor state, and paragraph newline preservation.
- Fixed server robustness issues around symlink traversal, unsafe file paths, non-markdown writes, oversized content writes, blocking vault scans, orphaned comments, SSE watcher tracking, heartbeats, and watcher cleanup.

### Security

- Hardened vault path resolution with realpath checks to block traversal and symlink bypasses.
- Restricted file write endpoints to safe markdown paths and limited saved content size.
- Addressed remaining CodeQL-reported server path handling alerts.

[Unreleased]: https://github.com/marco-ostaska/plan-list/compare/4a308f742e7d9d12d9ab700b2459e27766ef1036...HEAD
[1.0.0]: https://github.com/marco-ostaska/plan-list/tree/4a308f742e7d9d12d9ab700b2459e27766ef1036
