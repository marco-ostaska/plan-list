// Editor: renders parsed markdown. Tasks are interactive checkboxes.
// Each block is editable on click (becomes a textarea in place).

function EditableBlock({ block, onUpdate, onToggleTask, onContinue, autoFocus }) {
  const [editing, setEditing] = React.useState(!!autoFocus);
  const [draft, setDraft] = React.useState(autoFocus ? blockToEditableText(block) : "");
  const taRef = React.useRef(null);

  React.useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      const len = taRef.current.value.length;
      taRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(blockToEditableText(block));
    setEditing(true);
  };

  const commit = (continueAfter = false) => {
    onUpdate(block, draft);
    setEditing(false);
    if (continueAfter) onContinue?.(block);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <textarea
        ref={taRef}
        className="md-edit-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            // For tasks/bullets/headings: Enter commits + continues with new line
            if (block.kind === "task" || block.kind === "bullet" || block.kind === "heading") {
              commit(true);
            } else {
              commit(false);
            }
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
        rows={Math.max(1, draft.split("\n").length)}
      />
    );
  }

  if (block.kind === "heading") {
    const Tag = `h${block.level}`;
    return (
      <Tag className={`md-h md-h-${block.level}`} onClick={startEdit}>
        {window.renderInline(block.text)}
      </Tag>
    );
  }

  if (block.kind === "task") {
    return (
      <div className={`md-task ${block.done ? "is-done" : ""}`} style={{ marginLeft: block.indent * 12 }}>
        <button
          className={`md-check ${block.done ? "is-done" : ""}`}
          onClick={() => onToggleTask(block)}
          aria-label={block.done ? "Desmarcar" : "Marcar como feita"}
        >
          {block.done ? (
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path
                d="M3 8.5l3 3 6.5-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>
        <span className="md-task-text" onClick={startEdit}>
          {window.renderInline(block.text)}
        </span>
      </div>
    );
  }

  if (block.kind === "bullet") {
    return (
      <div className="md-bullet" style={{ marginLeft: block.indent * 12 }} onClick={startEdit}>
        <span className="md-bullet-dot">•</span>
        <span>{window.renderInline(block.text)}</span>
      </div>
    );
  }

  if (block.kind === "para") {
    return (
      <p className="md-p" onClick={startEdit}>
        {window.renderInline(block.text)}
      </p>
    );
  }

  if (block.kind === "code") {
    return (
      <div className="md-code-block" onClick={startEdit}>
        {block.lang ? <div className="md-code-lang">{block.lang}</div> : null}
        <pre className="md-code"><code>{block.text}</code></pre>
      </div>
    );
  }

  if (block.kind === "table") {
    return (
      <div className="md-table-wrap" onClick={startEdit}>
        <table className="md-table">
          <thead>
            <tr>{block.headers.map((cell, i) => <th key={i}>{window.renderInline(cell)}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>{row.map((cell, c) => <td key={c}>{window.renderInline(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.kind === "hr") {
    return <hr className="md-hr" onClick={startEdit} />;
  }

  if (block.kind === "blank") {
    return <div className="md-blank" />;
  }

  return null;
}

function blockToEditableText(block) {
  if (block.kind === "code") {
    return `\`\`\`${block.lang || ""}\n${block.text}\n\`\`\``;
  }
  if (block.kind === "table") {
    const header = `| ${block.headers.join(" | ")} |`;
    const separator = `| ${block.headers.map(() => "---").join(" | ")} |`;
    const rows = block.rows.map((row) => `| ${row.join(" | ")} |`);
    return [header, separator, ...rows].join("\n");
  }
  if (block.kind === "hr") return "---";
  return block.text || "";
}

function Editor({ content, onChange }) {
  const blocks = window.parseMarkdown(content);
  const [autoFocusLine, setAutoFocusLine] = React.useState(null);

  // Clear autofocus after one render cycle
  React.useEffect(() => {
    if (autoFocusLine !== null) {
      const t = setTimeout(() => setAutoFocusLine(null), 50);
      return () => clearTimeout(t);
    }
  }, [autoFocusLine]);

  const handleUpdate = (block, newText) => {
    const lines = content.split("\n");
    if (block.kind === "para" && block.lineCount) {
      lines.splice(block.lineIdx, block.lineCount, ...newText.split("\n"));
      onChange(lines.join("\n"));
      return;
    }
    if (block.lineCount && block.lineCount > 1) {
      lines.splice(block.lineIdx, block.lineCount, ...newText.split("\n"));
      onChange(lines.join("\n"));
      return;
    }
    if (block.kind === "heading") {
      lines[block.lineIdx] = "#".repeat(block.level) + " " + newText;
    } else if (block.kind === "task") {
      const indent = " ".repeat(block.indent);
      lines[block.lineIdx] = `${indent}- [${block.done ? "x" : " "}] ${newText}`;
    } else if (block.kind === "bullet") {
      const indent = " ".repeat(block.indent);
      lines[block.lineIdx] = `${indent}- ${newText}`;
    } else if (block.kind === "hr") {
      lines[block.lineIdx] = newText;
    }
    onChange(lines.join("\n"));
  };

  const handleToggle = (block) => {
    onChange(window.toggleTaskLine(content, block.lineIdx));
  };

  // Insert a new line of the same kind directly below `block`
  const handleContinue = (block) => {
    const lines = content.split("\n");
    let newLine = "";
    if (block.kind === "task") {
      newLine = `${" ".repeat(block.indent)}- [ ] `;
    } else if (block.kind === "bullet") {
      newLine = `${" ".repeat(block.indent)}- `;
    } else if (block.kind === "heading") {
      // After a heading, default to a blank line + a task
      lines.splice(block.lineIdx + 1, 0, "", "- [ ] ");
      onChange(lines.join("\n"));
      setAutoFocusLine(block.lineIdx + 2);
      return;
    }
    lines.splice(block.lineIdx + 1, 0, newLine);
    onChange(lines.join("\n"));
    setAutoFocusLine(block.lineIdx + 1);
  };

  // Append from footer
  const appendBlock = (kind) => {
    const lines = content.split("\n");
    // Trim trailing blanks then add a blank before the new block
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    let newLine = "";
    if (kind === "task") newLine = "- [ ] ";
    else if (kind === "heading") newLine = "## ";
    else if (kind === "para") newLine = "";

    lines.push("");
    lines.push(newLine);
    onChange(lines.join("\n"));
    setAutoFocusLine(lines.length - 1);
  };

  return (
    <div className="editor">
      {blocks.map((b, i) => (
        <EditableBlock
          key={`${b.lineIdx}-${i}`}
          block={b}
          onUpdate={handleUpdate}
          onToggleTask={handleToggle}
          onContinue={handleContinue}
          autoFocus={b.lineIdx === autoFocusLine}
        />
      ))}
      <div className="editor-add">
        <button className="editor-add-btn" onClick={() => appendBlock("task")}>
          <span className="editor-add-plus">+</span> task
        </button>
        <button className="editor-add-btn" onClick={() => appendBlock("heading")}>
          <span className="editor-add-plus">+</span> seção
        </button>
        <button className="editor-add-btn" onClick={() => appendBlock("para")}>
          <span className="editor-add-plus">+</span> nota
        </button>
      </div>
    </div>
  );
}

window.Editor = Editor;
