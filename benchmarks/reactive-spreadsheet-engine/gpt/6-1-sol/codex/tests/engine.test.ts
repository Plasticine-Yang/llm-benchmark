import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Workbook } from '../src/engine.ts';
const value = (book: Workbook, id: string) => book.get(id).value;
test('arithmetic precedence, parentheses, unary signs, decimals and scientific notation', () => {
  const book = new Workbook({ A1: '=2+3*4', A2: '=(2+3)*4', A3: '=-2*-3+4/2', A4: '=10-3-2', A5: '=24/4/2', A6: '=1e2+.5' });
  assert.deepEqual(['A1','A2','A3','A4','A5','A6'].map(id => value(book,id)), [14,20,8,5,3,100.5]);
});
test('ranges, combined functions, nested expressions, forward and lowercase references', () => {
  const book = new Workbook({ A1: '2', A2: '4', A3: '6', B1: '=SUM(A1:A3)+AVG(A1:A3)*2', B2: '=sum(a1:a3, B3*2)', B3: '5', B4: '=SUM(A3:A1)', B5: '=AVG(A1:B3)' });
  assert.equal(value(book, 'B1'), 20); assert.equal(value(book, 'B2'),22); assert.equal(value(book,'B4'),12);
  assert.equal(value(book,'B5'),59/6);
});
test('three-level cascade recalculates only affected cells in dependency order', () => {
  const book = new Workbook({ A1: '10', B1: '=A1*2', C1: '=B1+5', D1: '=C1/5', E1: '=100+1' });
  assert.equal(value(book,'D1'),5);
  book.applyEdits([{ id: 'A1', raw: '20' }]);
  assert.equal(value(book,'D1'),9);
  assert.deepEqual(book.lastRecalculated,['A1','B1','C1','D1']);
  assert.equal(value(book,'E1'),101);
  assert.deepEqual([...book.relations('A1','dependents')],['B1','C1','D1']);
});
test('direct and indirect cycles mark all participants, propagate, and recover', () => {
  const book = new Workbook({ A1: '=B1', B1: '=C1', C1: '=A1', D1: '=B1+1', E1: '=E1', F1: '15' });
  for (const id of ['A1','B1','C1','D1','E1']) assert.equal(book.get(id).error,'#CYCLE!');
  assert.equal(value(book,'F1'),15);
  book.applyEdits([{ id: 'C1', raw: '4' }, { id: 'E1', raw: '6' }]);
  for (const id of ['A1','B1','C1']) assert.equal(value(book,id),4);
  assert.equal(value(book,'D1'),5); assert.equal(value(book,'E1'),6);
});
test('cycles within ranges and non-leading strongly connected nodes are detected', () => {
  const book = new Workbook({ A1: '=SUM(A1:A3)', A2: '=A3', A3: '=A2' });
  for (const id of ['A1','A2','A3']) assert.equal(value(book,id),'#CYCLE!');
});
test('all required errors propagate through arithmetic and aggregates', () => {
  const book = new Workbook({ A1: '=5/0', B1: '=A1+1', C1: '=SUM(A1:B1)', A2: '=Z99+1', B2: '=A2*2', C2: '=SUM(A1:Z2)', A3: 'hello', B3: '=A3+2', C3: '=B3/2', A4: '=SUM()', B4: '=AVG(I1:I3)', C4: '=A0', D4: '=1+' });
  for (const id of ['A1','B1','C1','B4']) assert.equal(value(book,id),'#DIV/0!');
  for (const id of ['A2','B2','C2','C4']) assert.equal(value(book,id),'#REF!');
  for (const id of ['B3','C3','A4','D4']) assert.equal(value(book,id),'#VALUE!');
});
test('changing formula replaces dependency edges; blank references and range text behavior', () => {
  const book = new Workbook({ A1: '3', A2: 'words', A3: '', B1: '=A1', B2: '=SUM(A1:A3)', B3: '=AVG(A1:A3)', C1: '=J24+1' });
  assert.equal(value(book,'B2'),3); assert.equal(value(book,'B3'),3); assert.equal(value(book,'C1'),1);
  book.applyEdits([{ id: 'B1', raw: '=A2' }]);
  assert(!book.dependents.get('A1')!.has('B1')); assert(book.dependents.get('A2')!.has('B1'));
  book.applyEdits([{ id: 'A1', raw: '8' }]);
  assert(!book.lastRecalculated.includes('B1'));
});
test('batched edits and serialized raw values reconstruct computed results', () => {
  const book = new Workbook({ A1: '=B1+1', B1: '=C1+1', C1: '=D1+1' });
  book.applyEdits([{ id: 'D1', raw: '5' }, { id: 'B1', raw: '=C1*2' }]);
  const reload = new Workbook(JSON.parse(JSON.stringify(book.rawCells())));
  assert.equal(value(reload,'A1'),13); assert.equal(value(reload,'B1'),12);
});
test('malformed and excessively deep formulas fail safely', () => {
  const book = new Workbook({ A1: '=UNKNOWN(A2)', A2: '=1+(', A3: '=SUM(A1:)', A4: '=' + '('.repeat(200) + '1' + ')'.repeat(200), A5: '=1e999' });
  for (const id of ['A1','A2','A3','A4','A5']) assert(book.get(id).error);
});
