import test from 'node:test';
import assert from 'node:assert/strict';
import { Workbook, formatValue, refsInFormula, parseFormula, ERRORS } from './index.js';

const book = (cells) => new Workbook({ cells });
const display = (wb, id) => formatValue(wb.getValue(id));

test('operator precedence and parentheses', () => {
  const wb = book({ A1: '=1+2*3', A2: '=(1+2)*3', A3: '=10/2-1', A4: '=2^3^2', A5: '=-4+10/2' });
  assert.equal(wb.getValue('A1'), 7);
  assert.equal(wb.getValue('A2'), 9);
  assert.equal(wb.getValue('A3'), 4);
  assert.equal(wb.getValue('A4'), 512);
  assert.equal(wb.getValue('A5'), 1);
});

test('text, numbers and booleans are stored as typed', () => {
  const wb = book({ A1: 'hello', A2: '42', A3: '3.5', A4: 'TRUE', A5: '  spaced text  ' });
  assert.equal(wb.getValue('A1'), 'hello');
  assert.equal(wb.getValue('A2'), 42);
  assert.equal(wb.getValue('A3'), 3.5);
  assert.equal(wb.getValue('A4'), true);
  assert.equal(wb.getValue('A5'), '  spaced text  ');
});

test('A1 references, SUM/AVG ranges and mixed expressions', () => {
  const wb = book({
    A1: '1', A2: '2', A3: '3', A4: '4', A5: '5',
    B1: '10', B2: '20',
    C1: '=SUM(A1:A5)',
    C2: '=AVG(A1:A5)',
    C3: '=SUM(A1:A3)*2+AVG(B1:B2)',
    C4: '=A1+B1*2',
    C5: '=SUM(A1:A5)/COUNT(A1:A5)',
  });
  assert.equal(wb.getValue('C1'), 15);
  assert.equal(wb.getValue('C2'), 3);
  assert.equal(wb.getValue('C3'), 27);
  assert.equal(wb.getValue('C4'), 21);
  assert.equal(wb.getValue('C5'), 3);
});

test('forward references resolve regardless of definition order', () => {
  const wb = book({ A1: '=B1*2', B1: '=C1+1', C1: '7' });
  assert.equal(wb.getValue('B1'), 8);
  assert.equal(wb.getValue('A1'), 16);
});

test('multi-level cascade recalculates only affected cells in dependency order', () => {
  const wb = book({
    A1: '10',
    A2: '=A1*2',
    A3: '=A2+A1',
    A4: '=SUM(A2:A3)',
    A5: '=AVG(A1:A4)',
    B1: '=A4*100',
    C1: '=99',
    D1: '=C1+1',
  });
  assert.equal(wb.getValue('A5'), 27.5);
  assert.equal(wb.getValue('B1'), 5000);

  wb.setCell('A1', '20');
  const log = wb.recalcLog;
  assert.deepEqual([...log.order].sort(), ['A1', 'A2', 'A3', 'A4', 'A5', 'B1']);
  const position = (id) => log.order.indexOf(id);
  assert.ok(position('A1') < position('A2'));
  assert.ok(position('A2') < position('A3'));
  assert.ok(position('A3') < position('A4'));
  assert.ok(position('A4') < position('A5'));
  assert.ok(position('A4') < position('B1'));
  assert.equal(log.evaluated, 6);
  assert.equal(wb.getValue('A2'), 40);
  assert.equal(wb.getValue('A3'), 60);
  assert.equal(wb.getValue('A4'), 100);
  assert.equal(wb.getValue('A5'), 55);
  assert.equal(wb.getValue('B1'), 10000);
  assert.equal(wb.getValue('D1'), 100, 'unrelated branch keeps its value');
  assert.equal(wb.recalcLog.order.includes('C1'), false);
});

test('editing a mid-chain cell only touches its downstream dependents', () => {
  const wb = book({ A1: '2', A2: '=A1+1', A3: '=A2*10', A4: '=A3+5' });
  wb.setCell('A2', '=A1+100');
  assert.deepEqual(wb.recalcLog.order, ['A2', 'A3', 'A4']);
  assert.equal(wb.getValue('A3'), 1020);
  assert.equal(wb.getValue('A4'), 1025);
});

test('direct circular reference marks every participant with #CYCLE!', () => {
  const wb = book({ A1: '=A1+1', B1: '=A1', C1: '5' });
  assert.equal(display(wb, 'A1'), ERRORS.CYCLE);
  assert.equal(display(wb, 'B1'), ERRORS.CYCLE, 'cells depending on a cycle inherit the error');
  assert.equal(wb.getValue('C1'), 5);
  assert.ok(wb.cycles.has('A1'));
});

test('indirect circular reference across three cells', () => {
  const wb = book({ A1: '=B1+1', B1: '=C1+1', C1: '=A1+1', D1: '=SUM(A1:C1)' });
  for (const id of ['A1', 'B1', 'C1']) assert.equal(display(wb, id), ERRORS.CYCLE);
  assert.equal(display(wb, 'D1'), ERRORS.CYCLE);
  assert.deepEqual([...wb.cycles].sort(), ['A1', 'B1', 'C1']);
});

test('cycle introduced by an edit is detected, and broken again by undo', () => {
  const wb = book({ A1: '1', A2: '=A1+1', A3: '=A2+1' });
  assert.equal(wb.getValue('A3'), 3);
  wb.setCell('A1', '=A3+1');
  assert.equal(display(wb, 'A1'), ERRORS.CYCLE);
  assert.equal(display(wb, 'A2'), ERRORS.CYCLE);
  assert.equal(display(wb, 'A3'), ERRORS.CYCLE);
  wb.undo();
  assert.equal(wb.getValue('A1'), 1);
  assert.equal(wb.getValue('A3'), 3);
  assert.equal(wb.cycles.size, 0);
});

test('range cycle detection', () => {
  const wb = book({ A1: '1', A2: '2', A3: '=SUM(A1:A3)' });
  assert.equal(display(wb, 'A3'), ERRORS.CYCLE);
});

test('#DIV/0! is produced and propagated', () => {
  const wb = book({ A1: '0', B1: '=10/A1', C1: '=B1+1', D1: '=SUM(B1:C1)' });
  assert.equal(display(wb, 'B1'), ERRORS.DIV0);
  assert.equal(display(wb, 'C1'), ERRORS.DIV0);
  assert.equal(display(wb, 'D1'), ERRORS.DIV0);
  wb.setCell('A1', '5');
  assert.equal(wb.getValue('B1'), 2);
  assert.equal(wb.getValue('C1'), 3);
  assert.equal(wb.getValue('D1'), 5);
});

test('#REF! for out-of-grid references and broken ranges', () => {
  const wb = book({ A1: '=Z99+1', A2: '=A18:A25', A3: '=SUM(A1:A2)', A4: '=A0+1' });
  assert.equal(display(wb, 'A1'), ERRORS.REF);
  assert.equal(display(wb, 'A2'), ERRORS.REF);
  assert.equal(display(wb, 'A3'), ERRORS.REF);
  assert.equal(display(wb, 'A4'), ERRORS.REF);
});

test('#VALUE! for type errors and malformed formulas', () => {
  const wb = book({ A1: 'abc', A2: '=A1+1', A3: '=1+', A4: '=SUM(', A5: '=A1:A2+1', A6: '=NOPE(1)' });
  assert.equal(display(wb, 'A2'), ERRORS.VALUE);
  assert.equal(display(wb, 'A3'), ERRORS.VALUE);
  assert.equal(display(wb, 'A4'), ERRORS.VALUE);
  assert.equal(display(wb, 'A5'), ERRORS.VALUE);
  assert.equal(display(wb, 'A6'), ERRORS.NAME);
});

test('errors propagate through functions and arithmetic but IFERROR recovers', () => {
  const wb = book({ A1: '=1/0', A2: '=SUM(A1,5)', A3: '=IFERROR(A1,42)', A4: '=IF(A1>0,1,2)' });
  assert.equal(display(wb, 'A2'), ERRORS.DIV0);
  assert.equal(wb.getValue('A3'), 42);
  assert.equal(display(wb, 'A4'), ERRORS.DIV0);
});

test('empty cells behave as zero in arithmetic and are ignored by SUM', () => {
  const wb = book({ A1: '5', A3: '7', B1: '=A1+A2', B2: '=SUM(A1:A3)', B3: '=AVG(A1:A3)', B4: '=COUNT(A1:A3)' });
  assert.equal(wb.getValue('B1'), 5);
  assert.equal(wb.getValue('B2'), 12);
  assert.equal(wb.getValue('B3'), 6);
  assert.equal(wb.getValue('B4'), 2);
});

test('dependency graph exposes precedents and dependents', () => {
  const wb = book({ A1: '2', A2: '3', B1: '=SUM(A1:A2)', C1: '=B1*2', D1: '=B1+C1' });
  assert.deepEqual(wb.getPrecedents('B1'), ['A1', 'A2']);
  assert.deepEqual(wb.getDependents('B1'), ['C1', 'D1']);
  assert.deepEqual(wb.getPrecedents('D1'), ['B1', 'C1']);
  assert.deepEqual(wb.getDependents('A1'), ['B1']);
  wb.setCell('B1', '=A1');
  assert.deepEqual(wb.getPrecedents('B1'), ['A1']);
  assert.deepEqual(wb.getDependents('A2'), []);
});

test('undo and redo restore values across at least 20 edits', () => {
  const wb = book({ A1: '0', B1: '=A1*2' });
  for (let i = 1; i <= 25; i += 1) wb.setCell('A1', String(i));
  assert.equal(wb.getValue('A1'), 25);
  assert.equal(wb.getValue('B1'), 50);
  for (let i = 0; i < 25; i += 1) assert.equal(wb.undo(), true);
  assert.equal(wb.getValue('A1'), 0);
  assert.equal(wb.getValue('B1'), 0);
  for (let i = 0; i < 25; i += 1) assert.equal(wb.redo(), true);
  assert.equal(wb.getValue('A1'), 25);
  assert.equal(wb.getValue('B1'), 50);
  assert.equal(wb.undo(), true);
  assert.equal(wb.getValue('A1'), 24);
  assert.equal(wb.redo(), true);
  assert.equal(wb.getValue('A1'), 25);
});

test('undo restores formulas, deletions and error states', () => {
  const wb = book({ A1: '4', A2: '=A1/0' });
  wb.setCell('A2', '=A1*3');
  assert.equal(wb.getValue('A2'), 12);
  wb.setCell('A1', '');
  assert.equal(wb.getValue('A2'), 0);
  wb.undo();
  assert.equal(wb.getValue('A1'), 4);
  assert.equal(wb.getValue('A2'), 12);
  wb.undo();
  assert.equal(display(wb, 'A2'), ERRORS.DIV0);
  assert.equal(wb.canRedo, true);
});

test('a new edit clears the redo branch', () => {
  const wb = book({ A1: '1' });
  wb.setCell('A1', '2');
  wb.undo();
  assert.equal(wb.canRedo, true);
  wb.setCell('A1', '9');
  assert.equal(wb.canRedo, false);
  assert.equal(wb.getValue('A1'), 9);
});

test('batch paste is a single undo step', () => {
  const wb = book({ A1: '1', B1: '=SUM(A1:A3)' });
  wb.setCells([['A1', '10'], ['A2', '20'], ['A3', '30']]);
  assert.equal(wb.getValue('B1'), 60);
  wb.undo();
  assert.equal(wb.getValue('B1'), 1);
  assert.equal(wb.getRaw('A2'), '');
});

test('serialization round-trip keeps raw formulas and computed results', () => {
  const wb = book({ A1: '6', A2: '=A1*7', A3: '=SUM(A1:A2)', A4: '=A5', A5: '=A4' });
  const json = JSON.parse(JSON.stringify(wb.toJSON()));
  const restored = Workbook.fromJSON(json);
  assert.equal(restored.getRaw('A2'), '=A1*7');
  assert.equal(restored.getValue('A2'), 42);
  assert.equal(restored.getValue('A3'), 48);
  assert.equal(display(restored, 'A4'), ERRORS.CYCLE);
  assert.deepEqual(restored.getPrecedents('A3'), ['A1', 'A2']);
  assert.deepEqual(json.computed.A2, 42);
});

test('clearing the workbook removes values, dependencies and cycles', () => {
  const wb = book({ A1: '=B1', B1: '=A1', C1: '=1+1' });
  wb.clear();
  assert.equal(wb.raw.size, 0);
  assert.equal(wb.values.size, 0);
  assert.equal(wb.cycles.size, 0);
  wb.undo();
  assert.equal(display(wb, 'A1'), ERRORS.CYCLE);
  assert.equal(wb.getValue('C1'), 2);
});

test('large dependency fan-out stays correct and fast', () => {
  const binomial = (n, k) => {
    let result = 1;
    for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
    return Math.round(result);
  };
  const cells = { A1: '1' };
  for (let col = 1; col <= 9; col += 1) cells[`${String.fromCharCode(65 + col)}1`] = '=$A$1';
  for (let row = 1; row <= 19; row += 1) cells[`A${row + 1}`] = '=$A$1';
  for (let row = 1; row <= 19; row += 1) {
    for (let col = 1; col <= 9; col += 1) {
      const id = `${String.fromCharCode(65 + col)}${row + 1}`;
      const above = `${String.fromCharCode(65 + col)}${row}`;
      const left = `${String.fromCharCode(64 + col)}${row + 1}`;
      cells[id] = `=${above}+${left}`;
    }
  }
  const started = Date.now();
  const wb = book(cells);
  const expected = binomial(28, 9);
  assert.equal(wb.getValue('J20'), expected);
  assert.equal(wb.recalcLog.evaluated, 200);
  wb.setCell('A1', '2');
  assert.equal(wb.getValue('J20'), expected * 2);
  assert.equal(wb.recalcLog.evaluated, 200);
  assert.ok(Date.now() - started < 3000, 'recalculation should stay well under a second');
});

test('formula reference extraction ignores invalid addresses', () => {
  assert.deepEqual(refsInFormula('=SUM(A1:B2)+C3'), ['A1', 'B1', 'A2', 'B2', 'C3']);
  assert.deepEqual(refsInFormula('=Z99+1'), []);
  assert.deepEqual(refsInFormula('plain text'), []);
  assert.equal(parseFormula('=1+').error.error, ERRORS.VALUE);
});

test('string, comparison and conditional functions', () => {
  const wb = book({
    A1: 'hello', A2: '=UPPER(A1)&" "&LEN(A1)', A3: '=IF(2>1,"yes","no")',
    A4: '=IF(1>2,10,20)', A5: '=ROUND(3.14159,2)', A6: '=MOD(10,3)', A7: '=CONCAT(A1,"-",A5)',
  });
  assert.equal(wb.getValue('A2'), 'HELLO 5');
  assert.equal(wb.getValue('A3'), 'yes');
  assert.equal(wb.getValue('A4'), 20);
  assert.equal(wb.getValue('A5'), 3.14);
  assert.equal(wb.getValue('A6'), 1);
  assert.equal(wb.getValue('A7'), 'hello-3.14');
});