import FormulaBar from './components/FormulaBar.jsx';
import Grid from './components/Grid.jsx';
import Inspector from './components/Inspector.jsx';
import Toolbar from './components/Toolbar.jsx';
import { useSpreadsheet } from './useSpreadsheet.js';
import { COLS, ROWS } from '../shared/engine/index.js';

export default function App() {
  const sheet = useSpreadsheet();
  const { selection, rect, workbook, status } = sheet;
  const range = rect.c0 === rect.c1 && rect.r0 === rect.r1
    ? selection.focus
    : `${selection.anchor}:${selection.focus}`;
  const kind = workbook.getKind(selection.focus);

  return (
    <div className="app">
      <Toolbar sheet={sheet} />
      <FormulaBar sheet={sheet} />
      <main className="workspace">
        <Grid sheet={sheet} />
        <Inspector sheet={sheet} />
      </main>
      <footer className="statusbar">
        <span><strong>{range}</strong> · {kind}</span>
        <span>grid {COLS} × {ROWS} (A1:{`${String.fromCharCode(64 + COLS)}${ROWS}`})</span>
        <span>
          {status.phase === 'error'
            ? `persistence offline — edits stay in memory (${status.message})`
            : 'autosaved to the Node backend (server/data/workbook.json)'}
        </span>
      </footer>
    </div>
  );
}