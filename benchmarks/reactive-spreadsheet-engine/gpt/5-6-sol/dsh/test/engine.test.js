import test from 'node:test';
import assert from 'node:assert/strict';
import { ERROR, SpreadsheetEngine, parseFormula } from '../src/public/engine.js';

function value(engine, id) {
  return engine.getCell(id).value;
}

function error(engine, id) {
  return engine.getCell(id).error;
}

test('parser respects precedence, parentheses, unary operators, and references', () => {
  const engine = new SpreadsheetEngine();
  engine.setCells([
    ['A1', '4'],
    ['A2', '=2+3*4'],
    ['A3', '=(2+3)*4'],
    ['A4', '=-A1 + +2']
  ]);
  assert.equal(value(engine, 'A2'), 14);
  assert.equal(value(engine, 'A3'), 20);
  assert.equal(value(engine, 'A4'), -2);
  assert.equal(parseFormula('1+2 trailing').error, ERROR.VALUE);
});

test('SUM and AVG combine ranges, functions, references, and arithmetic', () => {
  const engine = new SpreadsheetEngine();
  engine.setCells([
    ['A1', '1'], ['A2', '2'], ['A3', '3'], ['A4', 'hello'], ['A5', ''],
    ['B1', '=SUM(A1:A5)'],
    ['B2', '=AVG(A1:A3)'],
    ['B3', '=SUM(A1:A3) + AVG(A1:A3) * 2'],
    ['B4', '=SUM(A3:A1, 4)']
  ]);
  assert.equal(value(engine, 'B1'), 6);
  assert.equal(value(engine, 'B2'), 2);
  assert.equal(value(engine, 'B3'), 10);
  assert.equal(value(engine, 'B4'), 10);
  engine.setCell('B5', '=AVG(A1:A5)');
  assert.equal(value(engine, 'B5'), 2);
  engine.setCell('B6', '=A5+1');
  assert.equal(value(engine, 'B6'), 1);
  assert.deepEqual(engine.getDependencies('B1'), ['A1', 'A2', 'A3', 'A4', 'A5']);
});

test('three-level chain recalculates only its affected dependency closure', () => {
  const engine = new SpreadsheetEngine();
  engine.setCells([
    ['A1', '2'],
    ['B1', '=A1*3'],
    ['C1', '=B1+4'],
    ['D1', '=C1/2'],
    ['J20', '=100+1']
  ]);
  assert.equal(value(engine, 'D1'), 5);

  const affected = new Set(engine.setCell('A1', '10'));
  assert.equal(value(engine, 'B1'), 30);
  assert.equal(value(engine, 'C1'), 34);
  assert.equal(value(engine, 'D1'), 17);
  assert.deepEqual(affected, new Set(['A1', 'B1', 'C1', 'D1']));
  assert.ok(!engine.lastRecalculated.includes('J20'));
  assert.ok(engine.lastRecalculated.indexOf('A1') < engine.lastRecalculated.indexOf('B1'));
  assert.ok(engine.lastRecalculated.indexOf('B1') < engine.lastRecalculated.indexOf('C1'));
});

test('forward references work and update after their source is filled', () => {
  const engine = new SpreadsheetEngine();
  engine.setCell('A1', '=B1+1');
  assert.equal(value(engine, 'A1'), 1);
  engine.setCell('B1', '9');
  assert.equal(value(engine, 'A1'), 10);
});

test('direct and indirect cycles mark every participant and propagate downstream', () => {
  const engine = new SpreadsheetEngine();
  engine.setCells([
    ['A1', '=B1+1'],
    ['B1', '=C1+1'],
    ['C1', '=A1+1'],
    ['D1', '=A1*2']
  ]);
  for (const id of ['A1', 'B1', 'C1']) {
    assert.equal(value(engine, id), ERROR.CYCLE);
    assert.equal(error(engine, id), ERROR.CYCLE);
  }
  assert.equal(value(engine, 'D1'), ERROR.CYCLE);
  assert.deepEqual(new Set(engine.cycles), new Set(['A1', 'B1', 'C1']));

  engine.setCell('C1', '5');
  assert.equal(value(engine, 'B1'), 6);
  assert.equal(value(engine, 'A1'), 7);
  assert.equal(value(engine, 'D1'), 14);
  assert.equal(engine.cycles.size, 0);
});

test('direct self-reference is a cycle', () => {
  const engine = new SpreadsheetEngine();
  engine.setCell('A1', '=A1+1');
  assert.equal(value(engine, 'A1'), ERROR.CYCLE);
});

test('division, invalid references, and text arithmetic return and propagate errors', () => {
  const engine = new SpreadsheetEngine();
  engine.setCells([
    ['A1', '=10/0'],
    ['A2', '=A1+1'],
    ['B1', '=K1+1'],
    ['B2', '=B1*2'],
    ['C1', 'words'],
    ['C2', '=C1+1'],
    ['C3', '=NOPE(1)']
  ]);
  assert.equal(value(engine, 'A1'), ERROR.DIV_ZERO);
  assert.equal(value(engine, 'A2'), ERROR.DIV_ZERO);
  assert.equal(value(engine, 'B1'), ERROR.REF);
  assert.equal(value(engine, 'B2'), ERROR.REF);
  assert.equal(value(engine, 'C2'), ERROR.VALUE);
  assert.equal(value(engine, 'C3'), ERROR.VALUE);
});

test('raw snapshots and serialized computed results reload correctly', () => {
  const first = new SpreadsheetEngine();
  first.setCells([['A1', '6'], ['B1', '=A1*7']]);
  const serialized = first.serialize();
  assert.deepEqual(serialized.cells.B1, { raw: '=A1*7', value: 42, error: null });

  const raw = Object.fromEntries(Object.entries(serialized.cells).map(([id, cell]) => [id, cell.raw]));
  const second = new SpreadsheetEngine();
  second.loadRaw(raw);
  assert.equal(value(second, 'B1'), 42);
  assert.deepEqual(second.rawSnapshot(), { A1: '6', B1: '=A1*7' });
});
