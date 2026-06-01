// Comments rail — timeline of comments on the current file.

function CommentItem({ comment, onDelete }) {
  return (
    <div className="comment-item">
      <div className="comment-meta">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-when">{comment.when}</span>
        <button className="comment-del" onClick={() => onDelete(comment.id)} title="apagar">
          ×
        </button>
      </div>
      <div className="comment-text">{comment.text}</div>
    </div>
  );
}

function CommentsRail({ comments, onAdd, onDelete, fileName }) {
  const [draft, setDraft] = React.useState("");
  const taRef = React.useRef(null);

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
          <span>comentários</span>
          <span className="comments-count">{comments.length}</span>
        </div>
        <div className="comments-sub">sobre {fileName.replace(/\.md$/, "")}</div>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">nenhum comentário ainda. escreve algo abaixo.</div>
        ) : (
          comments
            .slice()
            .reverse()
            .map((c) => <CommentItem key={c.id} comment={c} onDelete={onDelete} />)
        )}
      </div>

      <div className="comments-compose">
        <textarea
          ref={taRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="comentar nesse arquivo…"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="comments-compose-row">
          <span className="comments-hint">⌘ + enter</span>
          <button className="comments-send" onClick={submit} disabled={!draft.trim()}>
            comentar
          </button>
        </div>
      </div>
    </aside>
  );
}

window.CommentsRail = CommentsRail;
