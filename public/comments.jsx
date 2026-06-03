// Comments rail — GitHub-style timeline of comments on the current file.

function CommentItem({ comment, onDelete }) {
  return (
    <div className="comment-item">
      <div className="comment-bubble">
        <div className="comment-meta">
          <span className="comment-author">{comment.author}</span>
          <span className="comment-when">{comment.when}</span>
          <button className="comment-del" onClick={() => onDelete(comment.id)} title="Apagar">×</button>
        </div>
        <div className="comment-text">{comment.text}</div>
      </div>
    </div>
  );
}

function CommentsRail({ comments, onAdd, onDelete, fileName }) {
  const [draft, setDraft] = React.useState("");

  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <aside className="comments-rail">
      <div className="comments-head">
        <div className="comments-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--fg-subtle)" }}><path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Z" /></svg>
          <span>Comentários</span>
          <span className="comments-count">{comments.length}</span>
        </div>
        <div className="comments-sub">em {fileName.replace(/\.md$/, "")}</div>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">Nenhum comentário ainda.<br />Escreve algo abaixo.</div>
        ) : (
          comments.slice().reverse().map((c) => <CommentItem key={c.id} comment={c} onDelete={onDelete} />)
        )}
      </div>

      <div className="comments-compose">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Comentar nesse arquivo…"
          rows={3}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
        />
        <div className="comments-compose-row">
          <span className="comments-hint">⌘ + enter</span>
          <button className="comments-send" onClick={submit} disabled={!draft.trim()}>Comentar</button>
        </div>
      </div>
    </aside>
  );
}

window.CommentsRail = CommentsRail;
