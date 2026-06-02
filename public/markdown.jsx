// Lightweight markdown renderer focused on what this app supports:
// - # / ## / ### headings
// - - [ ] / - [x] tasks (interactive)
// - - bullets
// - fenced code blocks
// - tables
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

    // Fenced code block
    const fence = line.match(/^```([^\s`]*)\s*$/);
    if (fence) {
      const start = i;
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({
        kind: "code",
        lang: fence[1] || "",
        text: buf.join("\n"),
        lineIdx: start,
        lineCount: i - start,
      });
      continue;
    }

    // Table
    if (isTableStart(lines, i)) {
      const start = i;
      const headers = parseTableRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ kind: "table", headers, rows, lineIdx: start, lineCount: i - start });
      continue;
    }

    // Horizontal rule
    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ kind: "hr", lineIdx: i, lineCount: 1 });
      i++;
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2], lineIdx: i, lineCount: 1 });
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
        lineCount: 1,
      });
      i++;
      continue;
    }

    // Bullet
    const bullet = line.match(/^(\s*)-\s+(.*)$/);
    if (bullet) {
      blocks.push({ kind: "bullet", indent: bullet[1].length, text: bullet[2], lineIdx: i, lineCount: 1 });
      i++;
      continue;
    }

    // Blank
    if (line.trim() === "") {
      blocks.push({ kind: "blank", lineIdx: i, lineCount: 1 });
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
      !/^(\s*)-\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*---+\s*$/.test(lines[i]) &&
      !isTableStart(lines, i)
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "para", text: buf.join("\n"), lineIdx: start, lineCount: i - start });
  }

  return blocks;
};

function isTableRow(line) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isTableSeparator(line) {
  if (!isTableRow(line)) return false;
  return parseTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isTableStart(lines, i) {
  return i + 1 < lines.length && isTableRow(lines[i]) && isTableSeparator(lines[i + 1]);
}

function parseTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

// Inline decorations: strong, code, line breaks, tags (#foo), and dates (@today / @sexta / @maio)
window.parseInlineMarkdown = function parseInlineMarkdown(text) {
  const tokens = [];
  const regex = /(\*\*([^*\n]+)\*\*)|(`([^`\n]+)`)|(#[\p{L}\p{N}\-_]+)|(@[\p{L}\p{N}\-_:]+)|(\n)/gu;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      tokens.push({ kind: "text", text: text.slice(last, match.index) });
    }
    if (match[2]) {
      tokens.push({ kind: "strong", text: match[2] });
    } else if (match[4]) {
      tokens.push({ kind: "code", text: match[4] });
    } else if (match[5]) {
      tokens.push({ kind: "tag", text: match[5] });
    } else if (match[6]) {
      tokens.push({ kind: "date", text: match[6] });
    } else if (match[7]) {
      tokens.push({ kind: "br" });
    }
    last = regex.lastIndex;
  }

  if (last < text.length) {
    tokens.push({ kind: "text", text: text.slice(last) });
  }

  return tokens;
};

window.renderInline = function renderInline(text) {
  return window.parseInlineMarkdown(text).map((token, key) => {
    if (token.kind === "strong") return <strong key={key} className="md-strong">{token.text}</strong>;
    if (token.kind === "code") return <code key={key} className="md-inline-code">{token.text}</code>;
    if (token.kind === "tag") return <span key={key} className="md-tag">{token.text}</span>;
    if (token.kind === "date") return <span key={key} className="md-date">{token.text}</span>;
    if (token.kind === "br") return <br key={key} />;
    return token.text;
  });
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
