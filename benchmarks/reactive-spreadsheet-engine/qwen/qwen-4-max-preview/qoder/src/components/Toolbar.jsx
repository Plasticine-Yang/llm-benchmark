function SaveBadge({ status, onRetry }) {
  if (status.phase === 'loading') return <span className="badge loading">loading…</span>;
  if (status.phase === 'saving') return <span className="badge saving">saving…</span>;
  if (status.phase === 'error') {
    return (
      <span className="badge error" title={status.message}>
        save failed
        <button type="button" className="link" onClick={onRetry}>retry</button>
      </span>
    );
  }
  const time = status.savedAt ? new Date(status.savedAt).toLocaleTimeString() : 'not saved yet';
  return <span className="badge saved" title={status.savedAt ?? ''}>saved {time}</span>;
}

export default function Toolbar({ sheet }) {
  const { status, stats, canUndo, canRedo, undo, redo, loadDemo, clearAll, retrySave } = sheet;

  return (
    <header className="toolbar">
      <div className="brand">
        <h1>Reactive Spreadsheet</h1>
        <span className="subtitle">hand-written formula engine · live dependency graph</span>
      </div>

      <div className="actions">
        <button type="button" onClick={undo} disabled={!canUndo} title="Ctrl+Z">↶ Undo</button>
        <button type="button" onClick={redo} disabled={!canRedo} title="Ctrl+Shift+Z / Ctrl+Y">↷ Redo</button>
        <span className="divider" />
        <button type="button" onClick={() => loadDemo('chain')} title="Load a 8-level dependency chain">Chain demo</button>
        <button type="button" onClick={() => loadDemo('cycle')} title="Add an indirect circular reference">Inject cycle</button>
        <button type="button" onClick={() => loadDemo('errors')} title="Load #DIV/0!, #REF!, #VALUE! examples">Error demo</button>
        <button type="button" className="danger" onClick={clearAll} title="Clear every cell (undoable)">Clear</button>
        <span className="divider" />
        <SaveBadge status={status} onRetry={retrySave} />
      </div>

      <div className="counters">
        <span>{stats.populated} cells</span>
        <span>{stats.formulas} formulas</span>
        <span className={stats.errors ? 'bad' : ''}>{stats.errors} errors</span>
        <span className={stats.cycles ? 'bad' : ''}>{stats.cycles} in cycles</span>
        <span>{stats.history} undo / {stats.future} redo</span>
      </div>
    </header>
  );
}