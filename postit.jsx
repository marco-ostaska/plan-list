// Post-it view: each task becomes a post-it card on a soft board.
// Sticky colors rotate based on section, slight rotation for charm.

const STICKY_COLORS = [
  { bg: "#fef3a8", ink: "#5c4a16", tape: "rgba(180,150,60,0.35)" },   // yellow
  { bg: "#ffd9b8", ink: "#6b3a1d", tape: "rgba(180,100,50,0.35)" },   // peach
  { bg: "#d4f0c8", ink: "#2d4a26", tape: "rgba(80,140,60,0.3)" },     // mint
  { bg: "#ffc9d4", ink: "#6b2a3a", tape: "rgba(180,80,110,0.3)" },    // pink
  { bg: "#cfe2ff", ink: "#1f3a5c", tape: "rgba(80,120,180,0.3)" },    // blue
  { bg: "#e8d6ff", ink: "#3e2659", tape: "rgba(130,100,180,0.3)" },   // lavender
];

const ROTATIONS = [-1.4, 0.8, -0.6, 1.6, -1.1, 0.4, 1.2, -0.9, 0.3];

function PostIt({ task, color, rotation, onToggle, onEdit }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(task.text);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    onEdit(task, draft);
    setEditing(false);
  };

  return (
    <div
      className={`postit ${task.done ? "is-done" : ""}`}
      style={{
        "--postit-bg": color.bg,
        "--postit-ink": color.ink,
        "--postit-tape": color.tape,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className="postit-tape" />
      <div className="postit-row">
        <button
          className={`postit-check ${task.done ? "is-done" : ""}`}
          onClick={() => onToggle(task)}
          aria-label={task.done ? "Desmarcar" : "Marcar como feita"}
        >
          {task.done ? (
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path
                d="M3 8.5l3 3 6.5-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                setEditing(false);
              }
            }}
          />
        ) : (
          <div className="postit-text" onClick={() => setEditing(true)}>
            {window.renderInline(task.text)}
          </div>
        )}
      </div>
    </div>
  );
}

function PostItBoard({ content, onChange }) {
  const tasks = window.extractTasks(content);

  const handleToggle = (task) => {
    onChange(window.toggleTaskLine(content, task.lineIdx));
  };

  const handleEdit = (task, newText) => {
    const lines = content.split("\n");
    const indent = " ".repeat(task.indent);
    lines[task.lineIdx] = `${indent}- [${task.done ? "x" : " "}] ${newText}`;
    onChange(lines.join("\n"));
  };

  // Add a new task to a specific section (or at the end if no section)
  const addToSection = (sectionName) => {
    const lines = content.split("\n");
    if (!sectionName) {
      // Append at the bottom
      while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
      lines.push("- [ ] nova task");
      onChange(lines.join("\n"));
      return;
    }
    // Find the heading line for this section
    let headingIdx = -1;
    let headingLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(#{1,3})\s+(.*)$/);
      if (m && m[2] === sectionName) {
        headingIdx = i;
        headingLevel = m[1].length;
        break;
      }
    }
    if (headingIdx === -1) return;
    // Find the last line of this section (before next heading of same/higher level)
    let insertAt = lines.length;
    for (let i = headingIdx + 1; i < lines.length; i++) {
      const m = lines[i].match(/^(#{1,3})\s+/);
      if (m && m[1].length <= headingLevel) {
        insertAt = i;
        break;
      }
    }
    // Walk back to skip trailing blank lines in the section
    while (insertAt > headingIdx + 1 && lines[insertAt - 1].trim() === "") insertAt--;
    lines.splice(insertAt, 0, "- [ ] nova task");
    onChange(lines.join("\n"));
  };

  const addSection = () => {
    const lines = content.split("\n");
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    lines.push("");
    lines.push("## Nova seção");
    lines.push("- [ ] nova task");
    onChange(lines.join("\n"));
  };

  // Group tasks by section, preserving order
  const sections = [];
  const sectionMap = new Map();
  tasks.forEach((t) => {
    const key = t.section || "_";
    if (!sectionMap.has(key)) {
      sectionMap.set(key, { section: t.section, tasks: [] });
      sections.push(sectionMap.get(key));
    }
    sectionMap.get(key).tasks.push(t);
  });

  if (tasks.length === 0) {
    return (
      <div className="postit-empty">
        <div className="postit-empty-card">
          <div className="postit-tape" style={{ "--postit-tape": "rgba(180,150,60,0.35)" }} />
          <div className="postit-empty-text">nenhuma task nesse arquivo ainda</div>
          <button className="postit-empty-add" onClick={() => addToSection(null)}>
            + adicionar a primeira
          </button>
        </div>
      </div>
    );
  }

  let rotIdx = 0;

  return (
    <div className="postit-board">
      {sections.map((sec, si) => {
        const colorIdx = si % STICKY_COLORS.length;
        const color = STICKY_COLORS[colorIdx];
        return (
          <section className="postit-section-group" key={si}>
            <div className="postit-section-head">
              {sec.section ? (
                <h3 className="postit-section-title">{sec.section}</h3>
              ) : (
                <h3 className="postit-section-title postit-section-title--ghost">sem seção</h3>
              )}
              <button className="postit-section-add" onClick={() => addToSection(sec.section)}>
                + post-it
              </button>
            </div>
            <div className="postit-grid">
              {sec.tasks.map((t, i) => (
                <PostIt
                  key={`${t.lineIdx}-${i}`}
                  task={t}
                  color={color}
                  rotation={ROTATIONS[rotIdx++ % ROTATIONS.length]}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </section>
        );
      })}
      <button className="postit-add-section" onClick={addSection}>
        + nova seção
      </button>
    </div>
  );
}

window.PostItBoard = PostItBoard;
