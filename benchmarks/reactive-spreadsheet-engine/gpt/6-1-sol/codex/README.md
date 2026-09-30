# Forma · Reactive Spreadsheet Engine

A complete React + TypeScript spreadsheet with an Express backend, a handwritten formula parser, and incremental dependency tracking. The workbook has 24 rows and 10 columns (A1:J24).

## Setup and run

Requires Node.js 20.19+ (or 22.12+) and npm or pnpm.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite runs on 5173 and proxies `/api` to the Express backend on 3001.

Using pnpm instead:

```sh
pnpm install
pnpm dev
```

## Production

```sh
npm run build
npm start
```

Open http://localhost:3001. Express serves both the built frontend and the persistence API. Set `PORT` to change the production port. `WORKBOOK_FILE` can point to a different storage file. The development proxy assumes the default API port 3001.

## Tests

```sh
npm test
```

Tests cover precedence, nested functions, ranges, forward references, three-level cascades, selective evaluation, graph edge replacement, cycles and recovery, error propagation, malformed inputs, and HTTP persistence across backend restarts.

## Editing

- Click to select, double-click or Enter/F2 to edit. Typing also starts editing.
- Use arrow keys to move; Shift + arrows or mouse drag selects a range.
- Enter applies an edit and moves down. Tab applies and moves right. Escape cancels.
- The formula bar always shows the selected cell's raw content.
- Copy/cut/paste with the usual keyboard shortcuts. A rectangular TSV paste updates the entire block in one undoable edit. Copy preserves raw formulas; CSV export contains computed values. Pasting across the edge clips to A1:J24.
- Delete or Backspace clears the selection.
- Undo: Ctrl/⌘ Z. Redo: Ctrl/⌘ Shift Z or Ctrl Y. The toolbar also exposes both. History keeps 100 edits and batches pasted/cleared blocks into a single edit. History is session-local; workbook content persists.
- “Show formulas” switches the grid between raw formulas and computed values.
- The inspector highlights upstream cells in green and downstream cells in lavender, including indirect dependencies. Click an inspector reference to jump to it.
- Activity displays the actual evaluation order for the most recent edit.
- Restore the included example or clear the sheet using the toolbar. Both actions are undoable.

## Formula language

Examples:

```text
=A1 + B1 * 2
=-(A1 + 3) / 2
=SUM(A1:A5)
=AVG(B1:B5)
=SUM(A1:A5, B2 * 2) + AVG(C1:C5) / 2
```

Cell and function names are case insensitive. Operators are left associative with standard precedence; parentheses and unary signs are supported. Ranges can span rows and columns. `SUM` and `AVG` ignore blank/text cells in ranges; AVG of an empty numeric range returns `#DIV/0!`. Blank references behave as zero in arithmetic; nonnumeric text in arithmetic returns `#VALUE!`.

Errors are tracked separately from ordinary text values and propagate through dependent formulas:

- `#DIV/0!`: division by zero or average with no numeric values.
- `#REF!`: a reference outside A1:J24 or an invalid range endpoint.
- `#VALUE!`: invalid syntax, unsupported function, nonnumeric arithmetic, nonfinite result, or a range used as a scalar.
- `#CYCLE!`: all cells in a circular dependency, and formulas depending on that cycle.

The parser uses tokenization and precedence parsing, never JavaScript `eval`. It limits formula length, token count, and nesting. The graph stores references and reverse edges. After replacing changed edges, only changed cells and their transitive dependents are evaluated; other cells keep cached values. Tarjan strongly connected components detect every cycle participant. Dependency-aware evaluation resolves forward references before their consumers.

## Persistence

`GET /api/workbook` loads the workbook. `PATCH /api/workbook` accepts `{ revision, edits: [{ id, raw }] }`. Saves are serialized and use an atomic temporary-file rename to `data/workbook.json`. The backend saves both raw and computed results; it reconstructs and recalculates the graph on startup, so persisted computed values cannot become stale. New workbooks start with a launch budget and a three-level playground chain.

The client applies changes immediately and queues backend writes in order. The header shows save progress and offers retry on failure. Revision checks reject stale saves from another tab with HTTP 409. A full reload is safe once “All changes saved” appears. The browser warns before leaving with unsaved edits. This compact application has one workbook per server and no authentication.

## Acceptance walkthrough

1. Select H5 and change `10` to `20`: H6 becomes 40, H7 becomes 45, and H8 becomes 9.
2. Set H5 to `=H8`: H5:H8 all display `#CYCLE!`.
3. Undo: the chain recovers. Redo: the cycle returns. Undo again and wait for “All changes saved”.
4. Reload the page: H5 remains 20 and H8 remains 9.
5. Select H6 to inspect H5 as an upstream reference and H7/H8 as downstream dependents. Open Activity to inspect the evaluation order.
