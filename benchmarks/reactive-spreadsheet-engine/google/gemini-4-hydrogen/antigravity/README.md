# Reactive Spreadsheet Engine

A full-stack reactive spreadsheet web application featuring a custom formula lexer/parser, AST evaluator, incremental dependency graph with Tarjan SCC cycle detection, undo/redo history, dependency highlighting, and backend persistence.

## Architecture

- **`shared/`** — Pure TypeScript formula engine shared between frontend and backend:
  - `coords.ts`: A1-style coordinate parsing (`A1`–`L25`, `$` absolute anchors), bounds checking, and range expansion.
  - `parser.ts`: Custom tokenizer and recursive-descent AST parser supporting operator precedence (`+`, `-`, `*`, `/`, unary `+`/`-`, parentheses), cell references, ranges (`A1:A5`), functions (`SUM`, `AVG`, `AVERAGE`, `MIN`, `MAX`, `COUNT`), and relative reference shifting on copy/paste.
  - `engine.ts`: Reactive dependency graph (`deps` / `revDeps`) that finds only affected downstream cells on each edit, runs Tarjan's Strongly Connected Components (SCC) algorithm for dependency-first topological evaluation and cycle detection (`#CYCLE!`), and propagates `#DIV/0!`, `#REF!`, and `#VALUE!`.
- **`server/`** — Node.js + Express backend with serialized atomic JSON file persistence (`data/workbook.json` by default) and static production serving.
- **`src/`** — React + TypeScript + Vite UI with Excel-like keyboard navigation, inline & formula bar editing, copy/paste, 100-step undo/redo, visual reference/dependent highlighting, and a live Cell & Dependency Inspector sidebar.

## Setup

Requirements: Node.js 20+ and npm.

```bash
npm install
```

## Development

Start both the backend API server (`http://localhost:3001`) and the Vite frontend dev server (`http://localhost:5173`) with hot module reloading:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Production Build & Start

Build both the React client bundle (`dist/client`) and compiled TypeScript server (`dist/server`):

```bash
npm run build
```

Start the production server (serves both the REST API and the compiled frontend on port `3001` by default):

```bash
npm start
```

Open `http://localhost:3001`.

### Environment Variables

- `PORT` — HTTP listen port (default: `3001`).
- `WORKBOOK_FILE` — Path to the persisted workbook JSON file (default: `./data/workbook.json`).

## Tests & Typechecking

Run the typechecker and unit/API integration test suite:

```bash
npm run typecheck
npm test
```

## Usage & Supported Features

- **Grid**: `25` rows × `12` columns (`A1:L25`).
- **Keyboard Navigation & Editing**:
  - `Arrow` keys / `Tab` / `Shift+Tab`: Navigate cells (`Shift+Arrow` extends selection range).
  - `Enter` or `F2` (or double-click, or start typing): Enter edit mode; `Enter` commits and moves down, `Escape` cancels.
  - `Delete` / `Backspace`: Clear selected cell(s).
  - `Ctrl+C` / `Cmd+C`, `Ctrl+X` / `Cmd+X`, `Ctrl+V` / `Cmd+V`: Copy, cut, and paste (with Excel-style relative reference shifting; use `$A$1` for absolute references).
  - `Ctrl+Z` / `Cmd+Z` and `Ctrl+Y` / `Cmd+Shift+Z`: Undo and Redo (up to 100 recent edits).
- **Formulas**:
  - Arithmetic & precedence: `=2+3*4`, `=(A1+B1)/C1`, `=-A1+5`
  - Functions & ranges: `=SUM(A1:A5)`, `=AVG(B1:B5)`, `=SUM(A1:A3, B1*2, 10)`
- **Errors**:
  - `#CYCLE!`: Direct or indirect circular references (e.g. `A1 = B1`, `B1 = C1`, `C1 = A1`).
  - `#DIV/0!`: Division by zero or `AVG()` over an empty/non-numeric range.
  - `#REF!`: Out-of-bounds cell/range reference (e.g. `=Z99` or `=A0` outside `A1:L25`).
  - `#VALUE!`: Type mismatch (e.g. arithmetic on text), syntax errors, or unknown functions.
- **Visual Inspection**:
  - Selecting any cell highlights **referenced cells (inputs)** in emerald and **dependent cells (outputs)** in amber, and shows raw formula, computed result, error diagnostics, cycle path, and incremental recalculation stats in the right Inspector panel.

## Backend API

- `GET /api/health` — Health status and workbook metadata.
- `GET /api/workbook` — Load persisted workbook cells and computed values.
- `PATCH /api/workbook/cells` — Apply incremental cell updates (`{ updates: Record<string, string> }`), recalculate affected cells, and persist atomically.
- `PUT /api/workbook` — Replace full workbook cells.
- `POST /api/workbook/reset` — Clear all cells and persist empty workbook.
