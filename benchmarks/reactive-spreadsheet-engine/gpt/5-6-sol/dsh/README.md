# Gridline — Reactive Spreadsheet Engine

A compact full-stack spreadsheet built with browser JavaScript and Node.js. It includes a hand-written formula parser, an incremental dependency graph, circular-reference detection, undo/redo, keyboard editing, copy/paste, and durable backend persistence.

## Run it

Requirements: Node.js 18 or newer. There are no third-party dependencies to install.

```bash
npm run build
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The production server serves `dist/public` and persists the workbook in `data/workbook.json`.

For development with server auto-restart:

```bash
npm run dev
```

To use another port:

```bash
PORT=8080 npm start
```

## Test and build

```bash
npm test
npm run build
```

The test suite covers precedence, ranges, `SUM`/`AVG`, forward references, three-level cascade recalculation, affected-cell-only recalculation, direct and indirect cycles, cycle recovery, error propagation, and serialization/reload.

## Using the sheet

- Click a cell to select it. Type immediately or press **Enter** / **F2** to edit.
- Use arrow keys to move; Enter accepts an edit and moves down.
- Enter values in the formula bar or directly in a cell.
- Copy a selected cell with **Ctrl/⌘ C**. Paste one cell or tab/newline-delimited ranges with **Ctrl/⌘ V**.
- Undo with **Ctrl/⌘ Z** and redo with **Ctrl/⌘ Shift Z** or **Ctrl Y**. The app retains up to 100 edit operations (well above the required 20).
- Selecting a formula highlights its direct references in green. Selecting any cell highlights all direct and indirect dependents in purple. The inspector lists both; dashed dependent chips indicate indirect relationships.
- Each accepted edit is saved automatically. The status in the header confirms persistence.

Try the acceptance scenario by entering:

```text
A1: 2
B1: =A1*3
C1: =B1+4
D1: =C1/2
```

Change `A1` and watch the chain update. Then create an indirect cycle, for example:

```text
A1: =B1+1
B1: =C1+1
C1: =A1+1
```

All three cycle members show `#CYCLE!`; any formulas downstream propagate that error. Replace one cycle formula with a value to recover immediately.

## Formula language

Supported syntax:

- A1 references within the 20 × 10 grid (`A1:J20`)
- `+`, `-`, `*`, `/`, unary `+` / `-`, and parentheses
- `SUM(A1:A5)` and `AVG(B1:B5)`
- Reversed ranges, multiple function arguments, nested functions, and mixed expressions such as `=SUM(A1:A5) + AVG(B1:B5) * 2`

Errors are values that propagate through dependent formulas:

- `#DIV/0!` — division by zero or averaging no numeric values
- `#REF!` — a cell/range outside the grid
- `#VALUE!` — invalid syntax, unknown functions, or arithmetic on text
- `#CYCLE!` — every vertex in a direct or indirect circular dependency

Blank referenced cells act as zero in arithmetic. `SUM` and `AVG` ignore blank/text values, matching common spreadsheet behavior.

## Implementation notes

`src/public/engine.js` owns parsing, evaluation, dependency edges, reverse edges, and recalculation. On edit, it removes the cell's old edges, adds the new ones, finds strongly connected components with Tarjan's algorithm, then evaluates only the edited cell and the transitive closure of its dependents. Recursive evaluation imposes dependency order, so forward references and multi-level chains work without full-workbook recomputation.

The backend uses Node's built-in HTTP and filesystem APIs. Saves are atomic (`workbook.json.tmp` is renamed over the live file), and the browser serializes both raw formulas and current computed results. On load, raw inputs are reevaluated to guarantee the computed state agrees with the engine.

## Project layout

```text
src/server.js          HTTP API, static server, persistence
src/public/engine.js   parser, evaluator, dependency graph
src/public/app.js      grid interactions, history, save/load
src/public/styles.css  application UI
scripts/build.mjs      dependency-free production build
test/engine.test.js    formula and graph tests
```
