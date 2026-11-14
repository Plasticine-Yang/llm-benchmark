# Reactive Spreadsheet Engine

A compact full-stack spreadsheet (10 columns × 20 rows, `A1:J20`) with a **hand-written formula
engine**, a **real dependency graph**, incremental recalculation, cycle detection, error propagation,
undo/redo, and **backend persistence**.

No spreadsheet library is used: the tokenizer, parser, evaluator, dependency graph, cycle detection
and topological scheduler are all implemented from scratch in `shared/engine/` and are shared by the
React frontend *and* the Node backend.

---

## Quick start

Requires **Node.js 18+** (tested on Node 24/26) and npm.

```bash
npm install
```

### Development (hot reload)

```bash
npm run dev
```

* Vite dev server: **http://localhost:5173**
* API server: **http://127.0.0.1:4310** (Vite proxies `/api` to it)

Both processes are started by one command and shut down together on `Ctrl+C`.

### Production

```bash
npm run build     # outputs dist/
npm start         # Node serves the API + the built frontend
```

Open **http://127.0.0.1:4310**. `npm run preview` does `build` + `start` in one step.

The port/host can be changed with environment variables:

```bash
PORT=9000 HOST=0.0.0.0 npm start
```

### Tests

```bash
npm test          # 25 engine tests via node:test (no extra dependencies)
```

---

## What is implemented

| # | Requirement | Where |
|---|-------------|-------|
| 1 | 20 × 10 editable grid, keyboard selection, `Enter` to edit, arrow navigation, copy/paste (TSV, multi-cell) | `src/components/Grid.jsx` |
| 2 | Text, numbers, booleans and `=` formulas | `shared/engine/workbook.js` (`literalValue`, `rawKind`) |
| 3 | Own parser/evaluator: A1 refs, `+ - * / ^ &`, comparisons, parentheses, precedence, `SUM(A1:A5)`, `AVG(B1:B5)`, mixed expressions | `shared/engine/tokenizer.js`, `parser.js`, `evaluator.js`, `functions.js` |
| 4 | Real dependency graph; only affected cells recalculate; multi-level + forward references | `Workbook.linkDependencies`, `affectedCells`, `recalculate` |
| 5 | Direct **and** indirect cycles → every participant shows `#CYCLE!`, never hangs | `findCycleNodes` (iterative Tarjan SCC) |
| 6 | `#DIV/0!`, `#REF!`, `#VALUE!` produced and propagated (plus `#NAME?`, `#NUM!`) | `evaluator.js`, `functions.js` |
| 7 | Selecting a cell highlights its precedents **and** dependents, with an inspector + dependency graph | `src/components/Grid.jsx`, `Inspector.jsx` |
| 8 | Undo/redo for the last **60** edits (requirement: ≥ 20), multi-cell paste = one step | `Workbook.history` / `future`, `undo`, `redo` |
| 9 | Backend persistence: raw values, formulas and computed results survive a reload | `server/index.mjs`, `server/data/workbook.json` |
| 10 | README + working production build | this file, `npm run build` |

Extras: `IF` / `IFERROR` (lazy branches), `MIN`, `MAX`, `COUNT`, `COUNTA`, `PRODUCT`, `ABS`, `INT`,
`SIGN`, `SQRT`, `ROUND`, `POWER`, `MOD`, `PI`, `CONCAT`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `AND`, `OR`,
`NOT`, string concatenation with `&`, comparisons (`= <> < > <= >=`), absolute references (`$A$1`),
error literals (`=#DIV/0!`), a recalculation log showing the exact topological order, and demo
buttons for the acceptance scenario.

---

## Architecture

```
shared/engine/            pure ESM JavaScript, zero dependencies — used by browser AND server
  address.js              A1 <-> (col,row), bounds checks, range expansion
  errors.js               error values ({ error: '#DIV/0!' }) + range values
  tokenizer.js            numbers, strings, refs, operators, error literals
  parser.js               recursive-descent parser -> AST + reference extraction
  functions.js            function library, numeric coercion, truthiness
  evaluator.js            AST evaluation, operator precedence, error propagation
  workbook.js             dependency graph, incremental recalc, Tarjan cycles, undo/redo
  index.js                public API
  engine.test.mjs         25 node:test cases

server/index.mjs          node:http API + static host for dist/, atomic JSON persistence
src/                      React 18 + Vite frontend
  useSpreadsheet.js       workbook lifecycle, selection, editing, debounced autosave
  components/Grid.jsx     grid rendering, keyboard/mouse/clipboard handling
  components/FormulaBar.jsx
  components/Inspector.jsx  raw/computed/type, precedent & dependent chips, SVG dependency graph, recalc log
  components/Toolbar.jsx  undo/redo, demos, save status, counters
  demo.js                 chain / cycle / error scenarios
```

### Recalculation algorithm

1. An edit updates the raw cell, re-parses it, and rewires its graph edges
   (`deps: cell → precedents`, `dependents: cell → dependents`).
2. `affectedCells()` takes the transitive closure over **dependents only** — untouched branches are
   never re-evaluated.
3. `findCycleNodes()` runs an **iterative Tarjan SCC** over that subgraph (no recursion, so deep
   chains cannot blow the stack). Every node in a non-trivial SCC — or a self-loop — gets `#CYCLE!`.
4. The remaining nodes are sorted with **Kahn's algorithm** and evaluated in that order, so a cell
   always reads already-updated precedents. Forward references work because the graph is built from
   formulas, not from cell order.
5. Cells downstream of a cycle inherit `#CYCLE!` through normal error propagation.

The last run is exposed in the UI (`Last recalculation` panel): trigger cells, number of recomputed
cells, and the full topological order. Recalculated cells flash amber so a cascade is visible.

### Persistence

* `PUT /api/workbook` validates every address/value, rebuilds the workbook **on the server** with the
  same engine, and writes `server/data/workbook.json` atomically (temp file + rename).
* The file stores `cells` (raw), `computed` (values/errors), `cycles`, `savedAt` and stats.
* `GET /api/workbook` returns that payload; the frontend loads it on boot and recomputes, so raw
  formulas, computed results and errors are identical after a reload.
* Autosave is debounced (300 ms) after every edit, undo, redo, paste or demo load. The toolbar shows
  `saving… / saved <time> / save failed + retry`. If the backend is unreachable the sheet keeps
  working in memory and says so in the status bar.

### API

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/health` | liveness + grid size + stats |
| `GET` | `/api/workbook` | raw cells, computed values, cycles, `savedAt` |
| `PUT`/`POST` | `/api/workbook` | replace workbook (`{ "cells": { "A1": "=B1*2" } }`), recomputes and persists |
| `POST` | `/api/workbook/clear` | empty the workbook and persist |

Invalid addresses, non-scalar values, oversized cells (>2000 chars), malformed JSON and bodies >1 MB
are rejected with `400`/`413`. Static file serving is confined to `dist/` (path traversal → `403`).

---

## Using the sheet

| Action | Keys |
|--------|------|
| Move selection | `↑ ↓ ← →`, `Tab`, `Home`, `PgUp/PgDn` |
| Extend selection (range) | `Shift` + arrows, `Shift` + click, drag, click row/column headers |
| Edit cell | `Enter`, `F2`, double-click, or just start typing |
| Commit / cancel edit | `Enter` (down), `Tab` (right), `Shift+Enter` (up), `Esc` (cancel) |
| Clear cells | `Delete` / `Backspace` |
| Copy / cut / paste | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` (TSV; paste fills a block, one undo step) |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` or `Ctrl+Y` |
| Select all | `Ctrl+A` |

The formula bar always shows the **raw** content of the selected cell while the grid shows the
**computed** result; hovering a cell shows its raw content too. Formula cells carry a small blue
corner marker. Blue cells = referenced by the selection, green cells = depend on the selection,
red = cycle members, amber outline = references in the formula being typed.

### Acceptance walkthrough (matches the challenge scenario)

1. Click **Chain demo** — builds `A1 → A2 → A3 → A4 → A5 → A6 → B1 → B2 → B3` (8 levels).
2. Select `A1`, press `Enter`, type `20`, press `Enter`. The *Last recalculation* panel shows exactly
   9 recomputed cells in topological order and the affected cells flash; unrelated cells are untouched.
3. Click **Inject cycle** — adds `E1=F1+1`, `F1=G1+1`, `G1=E1+1` plus `H1=SUM(E1:G1)`.
   `E1/F1/G1` are cycle members (`#CYCLE!`, red) and `H1` inherits `#CYCLE!`. Selecting `E1` shows the
   `in cycle` badge, the explanation, and its dependents `G1`/`H1`. Nothing hangs.
4. `Ctrl+Z` removes the whole cycle injection in one step; `Ctrl+Shift+Z` brings it back.
   25+ consecutive edits are undoable (limit 60).
5. Reload the page (`F5`): raw formulas, computed values, errors and cycles are restored from the
   backend. `server/data/workbook.json` holds the same data.
6. **Error demo** loads `#DIV/0!` (with propagation through `+`, `SUM` and `IF`), `#REF!` (`=Z99+1`),
   `#VALUE!` (text arithmetic and a malformed formula) and an `IFERROR` recovery.

---

## Formula language

```
=1+2*3                  → 7          precedence: ^ > unary - > * / > + - > & > comparisons
=(1+2)*3                → 9
=A1*2+SUM(B1:B5)/3      refs, ranges, functions and arithmetic combine freely
=SUM(A1:A5)             =AVG(B1:B5)   (AVERAGE is an alias)
=IF(A1>10,"big","small")              =IFERROR(A1/0,42)
=$A$1&" units"                        absolute refs and string concatenation
```

Errors: `#DIV/0!` (zero divisor), `#REF!` (address outside `A1:J20`), `#VALUE!` (bad operand type,
range used as a scalar, malformed formula), `#CYCLE!` (circular reference), `#NAME?` (unknown
function), `#NUM!` (non-finite result). Any error in an operand propagates to the result.
Empty cells are `0` in arithmetic and are ignored by `SUM`/`AVG`/`COUNT`.

## Notes

* Grid size is fixed at 10 × 20 (`ROWS`/`COLS` in `shared/engine/address.js`); references outside it
  are `#REF!` by design.
* Undo history is per session (60 steps) and is not persisted; the workbook itself is.
* `server/data/` is created at runtime and git-ignored — delete `workbook.json` for a factory reset.