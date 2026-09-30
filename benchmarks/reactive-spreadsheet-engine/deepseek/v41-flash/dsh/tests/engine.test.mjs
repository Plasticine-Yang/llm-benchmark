/**
 * Engine tests: formula evaluation, dependency ordering, incremental
 * recalculation, cycle detection and error propagation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { SpreadsheetEngine, formatNumber } from '../src/engine/engine.js';
import { ERR } from '../src/engine/errors.js';
import { parseFormula, precedentsOf } from '../src/engine/parser.js';

function sheet(cells = {}) {
  const e = new SpreadsheetEngine();
  e.load(cells);
  return e;
}

const num = (e, ref) => e.getValue(ref).v;
const err = (e, ref) => e.getValue(ref).e;

test('literal classification: numbers, text, booleans, apostrophe', () => {
  const e = sheet({ A1: '12', A2: '3.5', A3: 'hello', A4: 'TRUE', A5: "'123", A6: '-4e2' });
  assert.equal(num(e, 'A1'), 12);
  assert.equal(num(e, 'A2'), 3.5);
  assert.equal(num(e, 'A3'), 'hello');
  assert.equal(num(e, 'A4'), true);
  assert.equal(num(e, 'A5'), '123');
  assert.equal(num(e, 'A6'), -400);
  assert.equal(e.getKind('A1'), 'number');
  assert.equal(e.getKind('A3'), 'text');
  assert.equal(e.getKind('A9'), 'empty');
});

test('operator precedence and parentheses', () => {
  const e = sheet({
    A1: '=1+2*3',
    A2: '=(1+2)*3',
    A3: '=2^3^2',
    A4: '=10/4',
    A5: '=-3+1',
    A6: '=50%',
    A7: '=-(2+3)*2',
    A8: '=1+2=3',
  });
  assert.equal(num(e, 'A1'), 7);
  assert.equal(num(e, 'A2'), 9);
  assert.equal(num(e, 'A3'), 512);
  assert.equal(num(e, 'A4'), 2.5);
  assert.equal(num(e, 'A5'), -2);
  assert.equal(num(e, 'A6'), 0.5);
  assert.equal(num(e, 'A7'), -10);
  assert.equal(num(e, 'A8'), true);
});

test('cell references, forward references and text values', () => {
  const e = sheet({
    A1: '2',
    B1: '=A1*3',
    C1: '=B1+A1',
    D1: '=C1&"!"',
    // forward reference: A2 reads B2 before B2 is evaluated
    A2: '=B2+1',
    B2: '=5',
  });
  assert.equal(num(e, 'B1'), 6);
  assert.equal(num(e, 'C1'), 8);
  assert.equal(num(e, 'D1'), '8!');
  assert.equal(num(e, 'A2'), 6);
  assert.deepEqual(e.getPrecedents('C1'), ['B1', 'A1']);
});

test('SUM and AVG over ranges, combined with arithmetic', () => {
  const e = sheet({
    A1: '1', A2: '2', A3: '3', A4: '4', A5: '5',
    B1: '=SUM(A1:A5)',
    B2: '=AVG(A1:A5)',
    B3: '=SUM(A1:A5)/AVG(A1:A5)',
    B4: '=SUM(A1:A2)+AVG(A3:A5)*2',
    B5: '=SUM(A1:A5)+SUM(B1:B2)',
    C1: '=AVG(A1:A2)*SUM(A3:A4)',
  });
  assert.equal(num(e, 'B1'), 15);
  assert.equal(num(e, 'B2'), 3);
  assert.equal(num(e, 'B3'), 5);
  assert.equal(num(e, 'B4'), 3 + 4 * 2);
  assert.equal(num(e, 'B5'), 15 + 18);
  assert.equal(num(e, 'C1'), 1.5 * 7);
});

test('ranges ignore blanks and non-numeric text (Excel behaviour)', () => {
  const e = sheet({ A1: 'Header', A2: '10', A3: '', A4: '20', B1: '=SUM(A1:A4)', B2: '=AVG(A1:A4)', B3: '=COUNT(A1:A4)' });
  assert.equal(num(e, 'B1'), 30);
  assert.equal(num(e, 'B2'), 15);
  assert.equal(num(e, 'B3'), 2);
});

test('AVG of an empty range is #DIV/0!', () => {
  const e = sheet({ A1: '=', B1: '=AVG(C1:C9)' });
  assert.equal(err(e, 'B1'), ERR.DIV0);
});

test('incremental recalculation touches only affected cells, in order', () => {
  const e = sheet({
    A1: '1', A2: '=A1*2', A3: '=A2+5', A4: '=SUM(A1:A3)',
    B1: '100', B2: '=B1+1', // unrelated island
  });
  assert.equal(num(e, 'A4'), 1 + 2 + 7);

  const res = e.setRaw('A1', '10');
  assert.deepEqual(res.changed, ['A1']);
  // the pass covers the edited cell plus its transitive dependents, in
  // dependency order; the unrelated island is never visited
  assert.deepEqual(res.recalculated, ['A1', 'A2', 'A3', 'A4']);
  assert.ok(!res.recalculated.includes('B1'));
  assert.ok(!res.recalculated.includes('B2'));
  assert.equal(num(e, 'A2'), 20);
  assert.equal(num(e, 'A3'), 25);
  assert.equal(num(e, 'A4'), 10 + 20 + 25);
  // untouched island keeps its previous value
  assert.equal(num(e, 'B2'), 101);
});

test('the recalculation order is a valid topological order of a deep chain', () => {
  const e = new SpreadsheetEngine();
  const entries = [['A1', '1']];
  for (let i = 2; i <= 60; i += 1) entries.push([`A${i}`, `=A${i - 1}+1`]);
  e.load(Object.fromEntries(entries));
  assert.equal(num(e, 'A60'), 60);

  const res = e.setRaw('A1', '100');
  assert.equal(res.recalculated.length, 60); // A1 plus the 59 dependent cells
  assert.equal(num(e, 'A60'), 159);
  // strictly ordered: every cell appears after its input
  const pos = new Map(res.recalculated.map((ref, i) => [ref, i]));
  for (let i = 2; i <= 60; i += 1) {
    assert.ok(pos.get(`A${i}`) > pos.get(`A${i - 1}`), `A${i} after A${i - 1}`);
  }
});

test('direct circular reference -> every participant is #CYCLE!', () => {
  const e = sheet({ A1: '=A1+1', B1: '=A1*2' });
  assert.equal(err(e, 'A1'), ERR.CYCLE);
  assert.equal(err(e, 'B1'), ERR.CYCLE);
  assert.ok(e.cycles.has('A1'));
});

test('indirect circular reference (A->B->C->A) never hangs', () => {
  const e = sheet({ A1: '=B1+1', B1: '=C1+1', C1: '=A1+1', D1: '=SUM(A1:C1)' });
  for (const ref of ['A1', 'B1', 'C1']) assert.equal(err(e, ref), ERR.CYCLE);
  assert.equal(err(e, 'D1'), ERR.CYCLE);
  assert.equal(e.cycles.size, 3);
});

test('breaking a cycle restores normal values', () => {
  const e = sheet({ A1: '=B1+1', B1: '=A1+1' });
  assert.equal(err(e, 'A1'), ERR.CYCLE);
  e.setRaw('B1', '5');
  assert.equal(num(e, 'A1'), 6);
  assert.equal(num(e, 'B1'), 5);
  assert.equal(e.cycles.size, 0);
});

test('a large chain plus a cycle completes quickly', () => {
  const e = new SpreadsheetEngine();
  const cells = {};
  for (let c = 0; c < 26; c += 1) {
    for (let r = 1; r <= 20; r += 1) {
      const ref = `${String.fromCharCode(65 + c)}${r}`;
      if (r === 1) cells[ref] = '1';
      else if (r === 10 && c === 5) cells[ref] = `=${String.fromCharCode(65 + c)}9+${String.fromCharCode(65 + c)}11`;
      else cells[ref] = `=${String.fromCharCode(65 + c)}${r - 1}+1`;
    }
  }
  const t0 = Date.now();
  e.load(cells);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 2000, `full recalculation took ${elapsed}ms`);
  assert.equal(num(e, 'Z20'), 20);
});

test('error values: #DIV/0!, #REF!, #VALUE!, #NAME?, #PARSE!', () => {
  const e = sheet({
    A1: '10',
    A2: 'text',
    B1: '=1/0',
    B2: '=A1/0',
    B3: '=A0',           // row 0 cannot exist
    B4: '=AAAA1',        // too many letters for a column
    B5: '="text"*2',     // text in arithmetic
    B6: '=A2+1',         // reference to text in arithmetic
    B7: '=NOSUCH(1)',    // unknown function
    B8: '=1+',           // malformed
    B9: '=#REF!+1',      // explicit error literal
  });
  assert.equal(err(e, 'B1'), ERR.DIV0);
  assert.equal(err(e, 'B2'), ERR.DIV0);
  assert.equal(err(e, 'B3'), ERR.REF);
  assert.equal(err(e, 'B4'), ERR.REF);
  assert.equal(err(e, 'B5'), ERR.VALUE);
  assert.equal(err(e, 'B6'), ERR.VALUE);
  assert.equal(err(e, 'B7'), ERR.NAME);
  assert.equal(err(e, 'B8'), ERR.PARSE);
  assert.equal(err(e, 'B9'), ERR.REF);
});

test('errors propagate through the dependency graph and clear when fixed', () => {
  const e = sheet({ A1: '5', A2: '0', B1: '=A1/A2', C1: '=B1+1', D1: '=SUM(B1:C1)' });
  assert.equal(err(e, 'C1'), ERR.DIV0);
  assert.equal(err(e, 'D1'), ERR.DIV0);
  e.setRaw('A2', '5');
  assert.equal(num(e, 'B1'), 1);
  assert.equal(num(e, 'C1'), 2);
  assert.equal(num(e, 'D1'), 3);
});

test('deleting a referenced cell makes dependents read blank', () => {
  const e = sheet({ A1: '7', B1: '=A1+1' });
  assert.equal(num(e, 'B1'), 8);
  e.setRaw('A1', '');
  assert.equal(num(e, 'B1'), 1); // blank counts as 0
  assert.deepEqual(e.getDependents('A1'), ['B1']);
});

test('dependency queries expose direct and transitive links', () => {
  const e = sheet({ A1: '1', A2: '=A1+1', A3: '=A2+1', A4: '=A3+1' });
  assert.deepEqual(e.getPrecedents('A3'), ['A2']);
  assert.deepEqual(e.getDependents('A2'), ['A3']);
  const prec = e.transitivePrecedents('A4');
  assert.deepEqual([...prec.keys()].sort(), ['A1', 'A2', 'A3']);
  assert.equal(prec.get('A3'), 1);
  assert.equal(prec.get('A1'), 3);
  const dep = e.transitiveDependents('A1');
  assert.deepEqual([...dep.keys()].sort(), ['A2', 'A3', 'A4']);
  assert.equal(e.getRecalcClosure('A1').size, 3);
});

test('serialize / load round-trips raw values and recomputes the same results', () => {
  const e = sheet({ A1: '2', A2: '=A1*3', A3: '=SUM(A1:A2)', B1: 'hello' });
  const snapshot = e.serialize();
  const clone = new SpreadsheetEngine();
  clone.load(snapshot);
  assert.deepEqual(clone.serialize(), snapshot);
  assert.equal(num(clone, 'A3'), 8);
  assert.equal(clone.getDisplay('B1'), 'hello');
});

test('range precedents expand to every cell in the rectangle', () => {
  const prec = precedentsOf('SUM(A1:B3)+C4');
  assert.deepEqual([...prec].sort(), ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C4']);
});

test('parser rejects malformed input with #PARSE!', () => {
  assert.equal(parseFormula('1+').error, ERR.PARSE);
  assert.equal(parseFormula('(1+2').error, ERR.PARSE);
  assert.equal(parseFormula('SUM(1,').error, ERR.PARSE);
  assert.equal(parseFormula('1+2').error, null);
});

test('formula referencing a formula keeps a compact graph after edits', () => {
  const e = sheet({ A1: '1', B1: '=A1', C1: '=B1' });
  e.setRaw('B1', '=A1*2');
  assert.deepEqual(e.getDependents('A1').sort(), ['B1']);
  assert.deepEqual(e.getDependents('B1'), ['C1']);
  assert.equal(num(e, 'C1'), 2);
  e.setRaw('C1', 'plain');
  assert.deepEqual(e.getDependents('B1'), []);
  assert.equal(e.getDisplay('C1'), 'plain');
});

test('number formatting', () => {
  assert.equal(formatNumber(3), '3');
  assert.equal(formatNumber(3.14159), '3.14159');
  assert.equal(formatNumber(1 / 3), '0.3333333333');
});
