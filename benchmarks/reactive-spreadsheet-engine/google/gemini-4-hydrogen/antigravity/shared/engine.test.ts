import test from 'node:test';
import assert from 'node:assert/strict';
import { SpreadsheetEngine } from './engine.js';
import { shiftFormulaReferences } from './parser.js';

test('parses and evaluates numbers, text, and empty cells', () => {
  const engine = new SpreadsheetEngine();
  engine.setCells({
    A1: '42',
    A2: '-3.5',
    A3: 'hello',
    A4: '12px',
    A5: '',
  });

  assert.equal(engine.getCell('A1').computed, 42);
  assert.equal(engine.getCell('A1').valueType, 'number');
  assert.equal(engine.getCell('A2').computed, -3.5);
  assert.equal(engine.getCell('A3').computed, 'hello');
  assert.equal(engine.getCell('A3').valueType, 'text');
  assert.equal(engine.getCell('A4').valueType, 'text');
  assert.equal(engine.getCell('A5').valueType, 'empty');
});

test('supports arithmetic operator precedence, unary ops, and parentheses', () => {
  const engine = new SpreadsheetEngine({
    A1: '=2 + 3 * 4',
    A2: '=(2 + 3) * 4',
    A3: '=10 - 3 - 2',
    A4: '=24 / 6 / 2',
    A5: '=-2 + 5',
    A6: '=-(2 + 5) * +2',
    A7: '=0.1 + 0.2',
  });

  assert.equal(engine.getCell('A1').computed, 14);
  assert.equal(engine.getCell('A2').computed, 20);
  assert.equal(engine.getCell('A3').computed, 5);
  assert.equal(engine.getCell('A4').computed, 2);
  assert.equal(engine.getCell('A5').computed, 3);
  assert.equal(engine.getCell('A6').computed, -14);
  assert.equal(engine.getCell('A7').display, '0.3');
});

test('supports SUM, AVG, ranges, mixed formulas, and ignoring text/empty in ranges', () => {
  const engine = new SpreadsheetEngine({
    A1: '10',
    A2: '20',
    A3: 'text',
    A4: '',
    A5: '30',
    B1: '4',
    B2: '8',
    B3: '12',
    C1: '=SUM(A1:A5)',
    C2: '=AVG(B1:B3)',
    C3: '=SUM(A5:A1) + AVG(B1:B3) * 2 - B1',
    C4: '=sum(a1:b2, 5, (10 / 2))',
  });

  assert.equal(engine.getCell('C1').computed, 60);
  assert.equal(engine.getCell('C2').computed, 8);
  assert.equal(engine.getCell('C3').computed, 60 + 8 * 2 - 4);
  assert.equal(engine.getCell('C4').computed, 10 + 20 + 4 + 8 + 5 + 5);
});

test('handles forward references and multi-level dependency cascades recalculating only affected cells', () => {
  const engine = new SpreadsheetEngine({
    A1: '=B1 * 2',       // forward ref -> level 3
    B1: '=C1 + D1',      // forward ref -> level 2
    C1: '=D1 + 5',       // forward ref -> level 1
    D1: '10',            // root -> 10
    H1: '100',           // unrelated island
    H2: '=H1 * 3',       // unrelated island
  });

  assert.equal(engine.getCell('C1').computed, 15);
  assert.equal(engine.getCell('B1').computed, 25);
  assert.equal(engine.getCell('A1').computed, 50);
  assert.equal(engine.getCell('H2').computed, 300);

  const recalc = engine.setCell('D1', '20');
  assert.equal(engine.getCell('C1').computed, 25);
  assert.equal(engine.getCell('B1').computed, 45);
  assert.equal(engine.getCell('A1').computed, 90);

  // Only D1, C1, B1, A1 should have been recalculated (NOT H1 or H2!)
  assert.deepEqual(new Set(recalc.recalculatedIds), new Set(['D1', 'C1', 'B1', 'A1']));
  assert.equal(recalc.recalculatedIds.includes('H1'), false);
  assert.equal(recalc.recalculatedIds.includes('H2'), false);
});

test('detects direct and indirect circular references and recovers when cycle is broken', () => {
  const engine = new SpreadsheetEngine({
    A1: '10',
    B1: '=A1 + 1',
    C1: '=B1 + 1',
    D1: '=C1 + 1',
  });

  assert.equal(engine.getCell('D1').computed, 13);

  // Create indirect 4-node cycle: A1 -> D1 -> C1 -> B1 -> A1
  const cycleRes = engine.setCell('A1', '=D1 + 1');
  for (const id of ['A1', 'B1', 'C1', 'D1']) {
    const snap = engine.getCell(id);
    assert.equal(snap.error, '#CYCLE!');
    assert.equal(snap.display, '#CYCLE!');
    assert.equal(snap.inCycle, true);
    assert.ok(snap.cyclePath && snap.cyclePath.length >= 2);
  }
  assert.equal(new Set(cycleRes.cycleCells).size, 4);

  // Downstream non-cycle cell depending on cycle propagates #CYCLE!
  engine.setCell('E1', '=A1 * 2');
  assert.equal(engine.getCell('E1').error, '#CYCLE!');
  assert.equal(engine.getCell('E1').inCycle, false);

  // Direct self-reference via range
  engine.setCell('F1', '=SUM(F1:F3)');
  assert.equal(engine.getCell('F1').error, '#CYCLE!');
  assert.equal(engine.getCell('F1').inCycle, true);

  // Break the indirect cycle
  engine.setCell('A1', '5');
  assert.equal(engine.getCell('A1').computed, 5);
  assert.equal(engine.getCell('B1').computed, 6);
  assert.equal(engine.getCell('C1').computed, 7);
  assert.equal(engine.getCell('D1').computed, 8);
  assert.equal(engine.getCell('E1').computed, 10);
  assert.equal(engine.getCell('E1').error, null);
});

test('produces and propagates #DIV/0!, #REF!, and #VALUE! errors', () => {
  const engine = new SpreadsheetEngine({
    A1: '10',
    A2: '0',
    A3: '=A1 / A2',       // #DIV/0!
    A4: '=A3 + 5',       // propagated #DIV/0!
    A5: '=AVG(B1:B3)',   // #DIV/0! (all empty)

    C1: '=Z99',          // #REF! (out of bounds col/row)
    C2: '=A0 + 1',       // #REF! (row 0 invalid)
    C3: '=SUM(A1:Z5)',   // #REF! (range out of bounds)
    C4: '=C1 * 2',       // propagated #REF!

    D1: 'hello',
    D2: '=D1 + 1',       // #VALUE!
    D3: '=-D1',          // #VALUE!
    D4: '=SUM("abc")',   // #VALUE!
    D5: '=UNKNOWN(1)',   // #VALUE!
    D6: '=1 +',          // #VALUE!
    D7: '=D2 + 10',      // propagated #VALUE!
  });

  assert.equal(engine.getCell('A3').display, '#DIV/0!');
  assert.equal(engine.getCell('A4').display, '#DIV/0!');
  assert.equal(engine.getCell('A5').display, '#DIV/0!');

  assert.equal(engine.getCell('C1').display, '#REF!');
  assert.equal(engine.getCell('C2').display, '#REF!');
  assert.equal(engine.getCell('C3').display, '#REF!');
  assert.equal(engine.getCell('C4').display, '#REF!');

  assert.equal(engine.getCell('D2').display, '#VALUE!');
  assert.equal(engine.getCell('D3').display, '#VALUE!');
  assert.equal(engine.getCell('D4').display, '#VALUE!');
  assert.equal(engine.getCell('D5').display, '#VALUE!');
  assert.equal(engine.getCell('D6').display, '#VALUE!');
  assert.equal(engine.getCell('D7').display, '#VALUE!');
});

test('shifts relative references on copy/paste and preserves absolute $ refs', () => {
  assert.equal(
    shiftFormulaReferences('=SUM(A1:$B$2) + C3 + "A1"', 1, 2),
    '=SUM(B3:$B$2) + D5 + "A1"'
  );
  assert.equal(
    shiftFormulaReferences('=A1 + B$1 + $A2', -1, 0),
    '=#REF! + A$1 + $A2'
  );
  // Shifted #REF! inside formula still evaluates cleanly to #REF!
  const engine = new SpreadsheetEngine({
    A1: '=#REF! + 1',
    A2: '=SUM(#REF!:B2)',
  });
  assert.equal(engine.getCell('A1').display, '#REF!');
  assert.equal(engine.getCell('A2').display, '#REF!');
});

test('reports direct and indirect dependencies and dependents accurately', () => {
  const engine = new SpreadsheetEngine({
    A1: '2',
    B1: '=A1 + 3',
    C1: '=SUM(A1:B1)',
    D1: '=C1 * 2',
  });

  assert.deepEqual(engine.getDirectDependencies('C1'), ['A1', 'B1']);
  assert.deepEqual(engine.getDirectDependencies('D1'), ['C1']);
  assert.deepEqual(engine.getIndirectDependencies('D1'), ['A1', 'B1']);

  assert.deepEqual(engine.getDirectDependents('A1'), ['B1', 'C1']);
  assert.deepEqual(engine.getIndirectDependents('A1'), ['D1']);
});
