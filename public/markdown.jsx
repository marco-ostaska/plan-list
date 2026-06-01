// Lightweight markdown renderer focused on what this app supports:
// - # / ## / ### headings
// - - [ ] / - [x] tasks (interactive)
// - - bullets
// - paragraphs
// - inline #tags and @dates get styled
//
// We render to React elements so we can attach onChange handlers to checkboxes,
// and so we can detect tasks for the post-it view.

window.parseMarkdown = function parseMarkdown(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2], lineIdx: i });
      i++;
      continue;
    }

    // Task
    const task = line.match(/^(\s*)- \[( |x|X)\]\s+(.*)$/);
    if (task) {
      blocks.push({
        kind: "task",
        indent: task[1].length,
        done: task[2].toLowerCase() === "x",
        text: task[3],
        lineIdx: i,
      });
      i++;
      continue;
    }

    // Bullet
    const bullet = line.match(/^(\s*)-\s+(.*)$/);
    if (bullet) {
      blocks.push({ kind: "bullet", indent: bullet[1].length, text: bullet[2], lineIdx: i });
      i++;
      continue;
    }

    // Blank
    if (line.trim() === "") {
      blocks.push({ kind: "blank", lineIdx: i });
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const start = i;
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^(\s*)- \[( |x|X)\]\s+/.test(lines[i]) &&
      !/^(\s*)-\s+/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "para", text: buf.join("\n"), lineIdx: start });
  }

  return blocks;
};

// Inline decorations: tags (#foo) and dates (@today / @sexta / @maio)
window.renderInline = function renderInline(text) {
  const parts = [];
  const regex = /(#[\p{L}\p{N}\-_]+)|(@[\p{L}\p{N}\-_:]+)/gu;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]) {
      parts.push(<span key={key++} className="md-tag">{match[1]}</span>);
    } else if (match[2]) {
      parts.push(<span key={key++} className="md-date">{match[2]}</span>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

// Extract all tasks from a file (for post-it view and progress)
window.extractTasks = function extractTasks(content) {
  const blocks = window.parseMarkdown(content);
  const out = [];
  let currentHeading = null;
  for (const b of blocks) {
    if (b.kind === "heading") currentHeading = b.text;
    if (b.kind === "task") {
      out.push({ ...b, section: currentHeading });
    }
  }
  return out;
};

// Toggle a task on line N in the raw text. Returns new text.
window.toggleTaskLine = function toggleTaskLine(text, lineIdx) {
  const lines = text.split("\n");
  const line = lines[lineIdx];
  const m = line.match(/^(\s*)- \[( |x|X)\]\s+(.*)$/);
  if (!m) return text;
  const done = m[2].toLowerCase() === "x";
  lines[lineIdx] = `${m[1]}- [${done ? " " : "x"}] ${m[3]}`;
  return lines.join("\n");
};
