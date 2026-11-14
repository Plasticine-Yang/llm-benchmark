import test from 'node:test';
import assert from 'node:assert/strict';

import { Workbook } from '../src/engine/workbook.js';
import { shiftFormula, ROWS, COLS } from '../src/engine/cells.js';

function make(cells = {}) {
  const w = new Workbook();
  w.load(cells);
  return w;
}
const V = (w, id) => w.getDisplay(id);

test('literal types, operator precedence, parentheses and unary minus', () => {
  const w = make({
    A1: '=2+3*4',
    A2: '=(2+3)*4',
    A3: '=-2^2',
    A4: '=10/4',
    A5: '=SUM(1,2,3)+AVG(2,4)*2',
    A6: '42',
    A7: 'hello',
    A8: '=2*(3+4)/2',
  });
  assert.equal(V(w, 'A1'), '14');
  assert.equal(V(w, 'A2'), '20');
  assert.equal(V(w, 'A3'), '-4');
  assert.equal(V(w, 'A4'), '2.5');
  assert.equal(V(w, 'A5'), '12');
  assert.equal(V(w, 'A6'), '42');
  assert.equal(V(w, 'A7'), 'hello');
  assert.equal(V(w, 'A8'), '7');
  assert.equal(w.getComputed('A6').type, 'number');
  assert.equal(w.getComputed('A7').type, 'text');
});

test('ranges, functions combined with references and arithmetic', () => {
  const w = make({
    A1: 1,
    A2: 2,
    A3: '=A1+A2',
    B1: '=SUM(A1:A3)*2 + AVG(A1:A3)',
    B2: '=ROUND(AVG(A1:A3),2)',
    B3: '=MAX(A1:A3)-MIN(A1:A3)',
    B4: '=COUNT(A1:A3)',
    B5: '=ABS(-3)+2^3',
  });
  assert.equal(V(w, 'A3'), '3');
  assert.equal(V(w, 'B1'), '14'); // (1+2+3)*2 + 2
  assert.equal(V(w, 'B2'), '2');
  assert.equal(V(w, 'B3'), '2');
  assert.equal(V(w, 'B4'), '3');
  assert.equal(V(w, 'B5'), '11');
});

test('three-level dependency chain cascades, and only affected cells recompute', () => {
  const w = make({
    A1: '10',
    B1: '=A1*2',
    C1: '=B1+5',
    C2: '5',
    D1: '=SUM(C1:C2)/2',
    E1: '=D1+C1',
    J1: 'unrelated text',
    J2: '=99',
  });
  assert.equal(V(w, 'B1'), '20');
  assert.equal(V(w, 'C1'), '25');
  assert.equal(V(w, 'D1'), '15');
  assert.equal(V(w, 'E1'), '40');

  const change = w.commit({ A1: '20' });
  assert.equal(V(w, 'B1'), '40');
  assert.equal(V(w, 'C1'), '45');
  assert.equal(V(w, 'D1'), '25');
  assert.equal(V(w, 'E1'), '70');
  assert.equal(V(w, 'J1'), 'unrelated text');
  assert.ok(change.affected.includes('E1'));
  assert.ok(change.affected.includes('D1'));
  assert.ok(!change.affected.includes('J1'), 'unrelated cell must not recalculate');
  assert.ok(!change.affected.includes('J2'), 'unrelated formula must not recalculate');
  assert.equal(change.recomputed, change.affected.length);
  assert.deepEqual(w.getTransitiveDependents('A1'), ['B1', 'C1', 'D1', 'E1']);
});

test('forward references work when the referenced cell is filled later', () => {
  const w = make({ A1: '=B1+1' });
  assert.equal(V(w, 'A1'), '1'); // blank behaves as 0
  w.commit({ B1: '4' });
  assert.equal(V(w, 'A1'), '5');
  assert.deepEqual(w.getDependents('B1'), ['A1']);
});

test('#DIV/0!, #REF!, #VALUE! are produced and propagated', () => {
  const w = make({
    A1: '=1/0',
    A2: '=A1+1',
    A3: '=ZZ100',
    A4: '=A3*2',
    A5: 'hello',
    A6: '=A5+1',
    A7: '=SUM(A1:A2)',
    A8: '=SUM(A1:A40)',
    A9: '=AVG(H1:H2)',
  });
  assert.equal(V(w, 'A1'), '#DIV/0!');
  assert.equal(V(w, 'A2'), '#DIV/0!');
  assert.equal(V(w, 'A3'), '#REF!');
  assert.equal(V(w, 'A4'), '#REF!');
  assert.equal(V(w, 'A6'), '#VALUE!');
  assert.equal(V(w, 'A7'), '#DIV/0!');
  assert.equal(V(w, 'A8'), '#REF!');
  assert.equal(V(w, 'A9'), '#DIV/0!');
});

test('parse/name errors are contained in their own cell', () => {
  const w = make({ A1: '=SUM(', A2: '=FOO(1)', A3: '=A1+1' });
  assert.equal(V(w, 'A1'), '#PARSE!');
  assert.equal(V(w, 'A2'), '#NAME?');
  assert.equal(V(w, 'A3'), '#PARSE!');
});

test('direct and indirect circular references: all cycle members show #CYCLE!', () => {
  const direct = make({ A1: '=A1+1' });
  assert.equal(V(direct, 'A1'), '#CYCLE!');

  const w = make({
    A1: '=B1+1',
    B1: '=C1+1',
    C1: '=A1+1',
    D1: '=A1*2',
    E1: '42',
  });
  assert.equal(V(w, 'A1'), '#CYCLE!');
  assert.equal(V(w, 'B1'), '#CYCLE!');
  assert.equal(V(w, 'C1'), '#CYCLE!');
  assert.equal(V(w, 'D1'), '#CYCLE!'); // error propagates to dependents
  assert.equal(V(w, 'E1'), '42');
  assert.deepEqual(w.lastChange.cycleNodes.sort(), ['A1', 'B1', 'C1']);
});

test('breaking a cycle recovers every affected cell', () => {
  const w = make({ A1: '=B1+1', B1: '=C1+1', C1: '=A1+1', D1: '=A1*2' });
  assert.equal(V(w, 'A1'), '#CYCLE!');
  w.commit({ C1: '=5' });
  assert.equal(V(w, 'C1'), '5');
  assert.equal(V(w, 'B1'), '6');
  assert.equal(V(w, 'A1'), '7');
  assert.equal(V(w, 'D1'), '14');
  assert.equal(w.lastChange.cycleNodes.length, 0);
});

test('undo / redo keeps at least 20 recent edits and stays reversible', () => {
  const w = make({});
  for (let i = 1; i <= 25; i++) w.commit({ A1: String(i) });
  assert.equal(V(w, 'A1'), '25');
  assert.equal(w.undoStack.length, 25);
  for (let i = 0; i < 25; i++) assert.equal(w.undo(), true);
  assert.equal(V(w, 'A1'), '');
  assert.equal(w.undo(), false);
  for (let i = 0; i < 25; i++) assert.equal(w.redo(), true);
  assert.equal(V(w, 'A1'), '25');
  assert.equal(w.redo(), false);
  w.commit({ A1: '100' });
  assert.equal(w.canRedo(), false, 'a new edit clears the redo stack');

  const chained = make({ A1: '1', B1: '=A1*2' });
  chained.commit({ A1: '5' });
  assert.equal(V(chained, 'B1'), '10');
  chained.undo();
  assert.equal(V(chained, 'A1'), '1');
  assert.equal(V(chained, 'B1'), '2', 'undo must restore computed results too');
  chained.redo();
  assert.equal(V(chained, 'B1'), '10');
});

test('formula translation on copy/paste respects absolute references', () => {
  assert.equal(shiftFormula('=SUM(A1:B2)+$C$1*2', 2, 1), '=SUM(B3:C4)+$C$1*2');
  assert.equal(shiftFormula('=$A1+A$1', 3, 0), '=$A4+A$1');
});

test('load/computedSnapshot round trip keeps raw and computed values consistent', () => {
  const w = make({ A1: '3', B1: '=A1*2', C1: '=1/0' });
  const snapshot = w.snapshot();
  const computed = w.computedSnapshot();
  const restored = make(snapshot);
  assert.equal(V(restored, 'B1'), '6');
  assert.equal(V(restored, 'C1'), '#DIV/0!');
  assert.deepEqual(restored.computedSnapshot(), computed);
  assert.ok(ROWS >= 20 && COLS >= 10);
});
