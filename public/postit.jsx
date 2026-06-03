// Board view: tasks grouped by section as clean GitHub-Projects-style cards.
// Each section gets a steady accent (no rotation / fake paper).

const SECTION_ACCENTS = [
  "#0969da", // blue
  "#8250df", // purple
  "#1a7f37", // green
  "#bc4c00", // orange
  "#bf3989", // pink
  "#9a6700", // yellow
  "#1b7c83", // teal
];

function PostIt({ task, accent, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(task.text);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (editing && ref.current) { ref.current.focus(); ref.current.select(); }
  }, [editing]);

  const commit = () => { onEdit(task, draft); setEditing(false); };

  return (
    <div className={`postit ${task.done ? "is-done" : ""}`} style={{ "--card-accent": accent }}>
      <div className="postit-row">
        <button
          className={`postit-check ${task.done ? "is-done" : ""}`}
          onClick={() => onToggle(task)}
          aria-label={task.done ? "Desmarcar" : "Marcar como feita"}
        >
          {task.done ? (
            <svg viewBox="0 0 16 16" width="13" height="13"><path d="M3 8.5l3 3 6.5-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : null}
        </button>
        {editing ? (
          <textarea
            ref={ref}
            className="postit-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
              else if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <div className="postit-text" onClick={() => setEditing(true)}>{window.renderInline(task.text)}</div>
        )}
        <button className="postit-delete" onClick={() => onDelete(task)} aria-label="Excluir task" title="Excluir task">
          <svg viewBox="0 0 16 16" width="13" height="13"><path d="M5 5l6 6M11 5l-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}

function PostItBoard({ content, onChange }) {
  const tasks = window.extractTasks(content);

  const handleToggle = (task) => onChange(window.toggleTaskLine(content, task.lineIdx));

  const handleEdit = (task, newText) => {
    const lines = content.split("\n");
    const indent = " ".repeat(task.indent);
    lines[task.lineIdx] = `${indent}- [${task.done ? "x" : " "}] ${newText}`;
    onChange(lines.join("\n"));
  };

  const handleDelete = (task) => onChange(window.deleteLine(content, task.lineIdx));

  const addToSection = (sectionName) => {
    const lines = content.split("\n");
    if (!sectionName) {
      while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
      lines.push("- [ ] nova task");
      onChange(lines.join("\n"));
      return;
    }
    let headingIdx = -1, headingLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(#{1,3})\s+(.*)$/);
      if (m && m[2] === sectionName) { headingIdx = i; headingLevel = m[1].length; break; }
    }
    if (headingIdx === -1) return;
    let insertAt = lines.length;
    for (let i = headingIdx + 1; i < lines.length; i++) {
      const m = lines[i].match(/^(#{1,3})\s+/);
      if (m && m[1].length <= headingLevel) { insertAt = i; break; }
    }
    while (insertAt > headingIdx + 1 && lines[insertAt - 1].trim() === "") insertAt--;
    lines.splice(insertAt, 0, "- [ ] nova task");
    onChange(lines.join("\n"));
  };

  const addSection = () => {
    const lines = content.split("\n");
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    lines.push("", "## Nova seção", "- [ ] nova task");
    onChange(lines.join("\n"));
  };

  // Group tasks by section, preserving order
  const sections = [];
  const sectionMap = new Map();
  tasks.forEach((t) => {
    const key = t.section || "_";
    if (!sectionMap.has(key)) { sectionMap.set(key, { section: t.section, tasks: [] }); sections.push(sectionMap.get(key)); }
    sectionMap.get(key).tasks.push(t);
  });

  if (tasks.length === 0) {
    return (
      <div className="postit-empty">
        <div className="postit-empty-card">
          <div className="postit-empty-text">Nenhuma task nesse arquivo ainda.</div>
          <button className="postit-empty-add" onClick={() => addToSection(null)}>+ adicionar a primeira</button>
        </div>
      </div>
    );
  }

  return (
    <div className="postit-board">
      {sections.map((sec, si) => {
        const accent = SECTION_ACCENTS[si % SECTION_ACCENTS.length];
        const doneCount = sec.tasks.filter((t) => t.done).length;
        return (
          <section className="postit-section-group" key={si}>
            <div className="postit-section-head">
              <span className="postit-section-dot" style={{ background: accent }} />
              {sec.section ? (
                <h3 className="postit-section-title">{sec.section}</h3>
              ) : (
                <h3 className="postit-section-title postit-section-title--ghost">sem seção</h3>
              )}
              <span className="postit-section-count">{doneCount}/{sec.tasks.length}</span>
              <button className="postit-section-add" onClick={() => addToSection(sec.section)}>+ task</button>
            </div>
            <div className="postit-grid">
              {sec.tasks.map((t, i) => (
                <PostIt key={`${t.lineIdx}-${i}`} task={t} accent={accent}
                  onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        );
      })}
      <button className="postit-add-section" onClick={addSection}>+ nova seção</button>
    </div>
  );
}

window.PostItBoard = PostItBoard;
