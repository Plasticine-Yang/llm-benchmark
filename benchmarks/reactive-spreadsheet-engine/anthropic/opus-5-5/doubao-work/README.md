# Reactive Spreadsheet Engine

A compact full-stack spreadsheet (30 rows × 12 columns) with a **hand-written formula parser/evaluator**, a **real dependency graph** with incremental recalculation, cycle detection, Excel-style error propagation, undo/redo, and a persistent Node backend.

## Requirements

- Node.js 18+ (tested with Node 22) and npm

## Setup & run

```bash
npm install

# Development: API on :3001 + Vite dev server on :5173 (proxies /api)
npm run dev
# open http://localhost:5173

# Production: typecheck + frontend build + bundled server, then serve everything from one port
npm run build
npm start
# open http://localhost:3001
```

Environment variables: `PORT` (default `3001`), `DATA_FILE` (default `./data/workbook.json`).

## Tests

```bash
npm test            # engine unit tests (vitest)
npm run build && npm start   # in one terminal, then in another:
npm run test:e2e    # headless-Chrome acceptance test against http://localhost:3001
                    # (needs Google Chrome; override with CHROME_PATH / BASE_URL)
```

The e2e test **clears the stored workbook** before running, then exercises a 4-level chain + cascade, highlighting, every error type, an indirect cycle, undo/redo of all edits, copy/paste, and a full page reload.

## Using it

| Action | Keys |
| --- | --- |
| Move / extend selection | Arrows / Shift+Arrows, Tab, Home/End, click & drag |
| Edit cell | Enter, F2, double-click, or just start typing (replaces) |
| Commit / cancel | Enter (moves down), Tab (moves right), Esc |
| Clear | Delete / Backspace |
| Copy / cut / paste | Ctrl/⌘+C / X / V (formulas shift relative refs; `$A$1` stays fixed; TSV from Excel works) |
| Undo / redo | Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or Ctrl+Y (last 100 edits; a paste or clear counts as one edit) |
| Toggle raw formulas in grid | "Show formulas" checkbox or Ctrl/⌘+` |
| Insert reference while typing a formula | click another cell |

**Inspecting the sheet:** the formula bar shows the raw contents and computed value. When you select a cell, the cells it **references** are highlighted **blue** and the cells that **depend on it** are highlighted **amber** (strong colour = direct, light = indirect). Members of a circular reference are outlined **red**. The right-hand panel lists references/dependents, the error detail (e.g. the cycle path), the cells evaluated by the last recalculation (in order), undo history, and a server check confirming the backend's stored values match the client engine. "Load demo" fills in a sample chain plus error examples.

## Formula language

- Literals: numbers, `"strings"`, `TRUE`/`FALSE`. A leading `'` forces text (`'123`).
- References: `A1`, `$A$1`, ranges `A1:B5`.
- Operators, in increasing precedence: comparison `= <> < > <= >=`, `&` (concat), `+ -`, `* /`, `^` (left-associative), unary `-`/`+`. Parentheses work as usual. Excel semantics: `-2^2 = 4`, `2^3^2 = 64`.
- Functions: `SUM`, `AVG` (alias `AVERAGE`), `MIN`, `MAX`, `COUNT`, `PRODUCT`, `ABS`, `ROUND`, `IF` (lazy). Arguments can mix ranges, refs and expressions, e.g. `=SUM(A1:A5)*2 + AVG(B1:B5)/(A2+A3)`.
- Empty cells count as 0 in arithmetic. Text and blanks inside ranges are ignored by `SUM`/`AVG`.

| Error | When |
| --- | --- |
| `#DIV/0!` | division by zero, `AVG` of no numbers |
| `#REF!` | reference/range outside the grid (e.g. `=Z99`), or a pasted ref shifted off-grid |
| `#VALUE!` | text used as a number, multi-cell range where one value is expected |
| `#CYCLE!` | every cell in a direct or indirect circular reference, and cells depending on one |
| `#NAME?` / `#ERROR!` | unknown function / syntax error |

Errors propagate through every dependent formula.

## Architecture

```
src/engine/address.ts    A1 helpers, grid size
src/engine/parser.ts     tokenizer, recursive-descent parser → AST, reference collection, paste ref shifting
src/engine/evaluator.ts  AST evaluator, functions, error values, coercion rules
src/engine/sheet.ts      Sheet model: precedents/dependents graph + incremental recalculation
src/App.tsx              React grid, editing, keyboard, clipboard, highlights, undo/redo, inspector
src/api.ts               REST client + coalescing save queue (retries; keepalive for in-flight saves on reload)
server/index.ts          Dependency-free Node http server: REST API, atomic JSON persistence, static hosting
tests/                   vitest engine tests + puppeteer e2e acceptance test
```

**Recalculation.** Each cell stores its parsed AST and its set of precedents; a reverse `dependents` index is kept in sync, including edges to empty cells, so forward references update as soon as the target gets a value. An edit collects the changed cells plus their transitive dependents (the *affected set*). Only that subgraph is processed, using an iterative Tarjan SCC algorithm that cannot overflow the stack. Tarjan emits components in dependency order, so each cell is evaluated exactly once, after its inputs. Any component with more than one cell, or with a self-loop, is a cycle, and all of its members get `#CYCLE!`. A cycle is strongly connected, so if it touches the affected set it lies entirely inside it, which makes the subgraph analysis exact. Breaking a cycle recomputes its former members normally.

**Persistence.** The client sends batched cell changes with `PATCH /api/workbook/cells`. The server applies them to its own `Sheet` (same engine code), writes `{cells, values, version}` atomically to `data/workbook.json` (temp file + rename), and returns the computed values. The client compares those values with its own as a consistency check. On reload, raw contents are fetched and recomputed. Other endpoints: `GET /api/workbook`, `PUT /api/workbook`, `POST /api/workbook/reset`, `GET /api/health`.
