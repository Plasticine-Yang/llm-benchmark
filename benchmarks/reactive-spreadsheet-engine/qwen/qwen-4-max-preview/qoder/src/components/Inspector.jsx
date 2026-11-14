import { formatValue, isError } from '../../shared/engine/index.js';

const ERROR_HELP = {
  '#DIV/0!': 'Division by zero — a divisor evaluated to 0 (or an empty cell).',
  '#REF!': 'Invalid reference — the address is outside this 10 × 20 grid.',
  '#VALUE!': 'Wrong operand type, a range used as a scalar, or a malformed formula.',
  '#CYCLE!': 'Circular reference — this cell is part of a dependency cycle.',
  '#NAME?': 'Unknown function or undefined name.',
  '#NUM!': 'Numeric result is not finite (overflow, SQRT of a negative, …).',
};

const KIND_LABEL = {
  empty: 'empty',
  formula: 'formula',
  number: 'number',
  text: 'text',
  boolean: 'boolean',
};

function Chip({ id, tone, workbook, onSelect }) {
  const value = formatValue(workbook.getValue(id));
  return (
    <button type="button" className={`chip ${tone}`} onClick={() => onSelect(id)} title={`${id} = ${value}`}>
      <strong>{id}</strong>
      <span>{value === '' ? '∅' : value}</span>
    </button>
  );
}

function DependencyGraph({ workbook, id, onSelect }) {
  const allPrecedents = workbook.getPrecedents(id);
  const allDependents = workbook.getDependents(id);
  const precedents = allPrecedents.slice(0, 5);
  const dependents = allDependents.slice(0, 5);
  const step = 40;
  const nodeW = 78;
  const nodeH = 30;
  const height = Math.max(104, Math.max(precedents.length, dependents.length, 1) * step + 28);
  const centerY = height / 2;
  const leftX = 6;
  const centerX = 121;
  const rightX = 236;
  const yFor = (index, count) => centerY + (index - (count - 1) / 2) * step;

  const node = (x, y, cellId, tone) => {
    const value = formatValue(workbook.getValue(cellId));
    return (
      <g key={`${tone}-${cellId}`} className={`graph-node ${tone}`} onClick={() => onSelect(cellId)}>
        <rect x={x} y={y - nodeH / 2} width={nodeW} height={nodeH} rx={7} />
        <text x={x + nodeW / 2} y={y - 2} className="graph-id">{cellId}</text>
        <text x={x + nodeW / 2} y={y + 11} className="graph-value">
          {value === '' ? '∅' : value.length > 11 ? `${value.slice(0, 10)}…` : value}
        </text>
      </g>
    );
  };

  return (
    <svg className="dep-graph" viewBox={`0 0 320 ${height}`} role="img" aria-label={`Dependencies of ${id}`}>
      <defs>
        <marker id="arrow-in" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" className="arrow-in" />
        </marker>
        <marker id="arrow-out" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" className="arrow-out" />
        </marker>
      </defs>

      {precedents.map((cellId, index) => {
        const y = yFor(index, precedents.length);
        return (
          <path
            key={`in-${cellId}`}
            className="edge-in"
            markerEnd="url(#arrow-in)"
            d={`M${leftX + nodeW},${y} C${leftX + nodeW + 22},${y} ${centerX - 22},${centerY} ${centerX - 2},${centerY}`}
          />
        );
      })}
      {dependents.map((cellId, index) => {
        const y = yFor(index, dependents.length);
        return (
          <path
            key={`out-${cellId}`}
            className="edge-out"
            markerEnd="url(#arrow-out)"
            d={`M${centerX + nodeW},${centerY} C${centerX + nodeW + 22},${centerY} ${rightX - 22},${y} ${rightX - 2},${y}`}
          />
        );
      })}

      {precedents.map((cellId, index) => node(leftX, yFor(index, precedents.length), cellId, 'pre'))}
      {node(centerX, centerY, id, 'self')}
      {dependents.map((cellId, index) => node(rightX, yFor(index, dependents.length), cellId, 'dep'))}

      {precedents.length === 0 && <text x={leftX + 8} y={centerY} className="graph-empty">no precedents</text>}
      {dependents.length === 0 && <text x={rightX - 4} y={centerY} className="graph-empty">no dependents</text>}
      {allPrecedents.length > precedents.length && (
        <text x={leftX + 8} y={height - 6} className="graph-empty">+{allPrecedents.length - precedents.length} more</text>
      )}
      {allDependents.length > dependents.length && (
        <text x={rightX - 4} y={height - 6} className="graph-empty">+{allDependents.length - dependents.length} more</text>
      )}
    </svg>
  );
}

export default function Inspector({ sheet }) {
  const { workbook, selection, recalcLog, select, version } = sheet;
  const id = selection.focus;
  const raw = workbook.getRaw(id);
  const value = workbook.getValue(id);
  const error = isError(value) ? value.error : null;
  const kind = workbook.getKind(id);
  const precedents = workbook.getPrecedents(id);
  const dependents = workbook.getDependents(id);
  const inCycle = workbook.cycles.has(id);

  return (
    <aside className="inspector">
      <section className="panel">
        <div className="panel-head">
          <h2>Cell inspector</h2>
          <span className="cell-ref">{id}</span>
        </div>
        <div className="badges">
          <span className={`badge kind-${kind}`}>{KIND_LABEL[kind] ?? kind}</span>
          {inCycle && <span className="badge cycle">in cycle</span>}
          {error && <span className="badge error">{error}</span>}
        </div>
        <dl className="fields">
          <dt>raw</dt>
          <dd><code>{raw === '' ? '(empty)' : raw}</code></dd>
          <dt>computed</dt>
          <dd><code className={error ? 'bad' : ''}>{formatValue(value) === '' ? '(empty)' : formatValue(value)}</code></dd>
          <dt>type</dt>
          <dd>{value === null ? 'null (empty)' : isError(value) ? 'error' : typeof value}</dd>
        </dl>
        {error && <p className="error-help">{ERROR_HELP[error] ?? 'Unknown error.'}</p>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Dependencies</h2>
          <span className="hint">{precedents.length} in · {dependents.length} out</span>
        </div>
        <DependencyGraph workbook={workbook} id={id} onSelect={select} key={`${id}-${version}`} />
        <h3>References (this cell reads)</h3>
        <div className="chips">
          {precedents.length === 0 && <span className="hint">none</span>}
          {precedents.map((cellId) => (
            <Chip key={cellId} id={cellId} tone="pre" workbook={workbook} onSelect={select} />
          ))}
        </div>
        <h3>Dependents (cells reading this one)</h3>
        <div className="chips">
          {dependents.length === 0 && <span className="hint">none</span>}
          {dependents.map((cellId) => (
            <Chip key={cellId} id={cellId} tone="dep" workbook={workbook} onSelect={select} />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Last recalculation</h2>
          <span className="hint">#{recalcLog.id}</span>
        </div>
        <p className="recalc-summary">
          <strong>{recalcLog.evaluated}</strong> cell{recalcLog.evaluated === 1 ? '' : 's'} recomputed
          {recalcLog.cycles.length > 0 && <span className="bad"> · {recalcLog.cycles.length} in cycles</span>}
        </p>
        <h3>Trigger</h3>
        <div className="chips">
          {recalcLog.seed.length === 0 && <span className="hint">initial load</span>}
          {recalcLog.seed.map((cellId) => (
            <Chip key={cellId} id={cellId} tone="seed" workbook={workbook} onSelect={select} />
          ))}
        </div>
        <h3>Topological order</h3>
        <ol className="order">
          {recalcLog.order.map((cellId, index) => (
            <li key={cellId}>
              <button type="button" className="order-item" onClick={() => select(cellId)}>
                <span className="order-index">{index + 1}</span>
                <strong>{cellId}</strong>
                <code>{formatValue(workbook.getValue(cellId)) || '∅'}</code>
              </button>
            </li>
          ))}
          {recalcLog.order.length === 0 && <li className="hint">nothing to recompute</li>}
        </ol>
      </section>

      <section className="panel legend">
        <h2>Legend</h2>
        <ul>
          <li><span className="swatch pre" /> referenced by selected cell</li>
          <li><span className="swatch dep" /> depends on selected cell</li>
          <li><span className="swatch cyc" /> member of a circular reference</li>
          <li><span className="swatch flash" /> just recalculated</li>
        </ul>
        <p className="hint">
          Enter edits · arrows move · Shift+arrows select a range · Ctrl+C / Ctrl+V copy &amp; paste TSV ·
          Ctrl+Z / Ctrl+Shift+Z undo &amp; redo · Delete clears
        </p>
      </section>
    </aside>
  );
}