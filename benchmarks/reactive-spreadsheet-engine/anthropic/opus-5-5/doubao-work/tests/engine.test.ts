import { describe, it, expect } from 'vitest';
import { Sheet } from '../src/engine/sheet';
import { shiftFormula } from '../src/engine/parser';

const v = (s: Sheet, a: string) => s.getDisplay(a);

describe('parser & evaluator', () => {
  it('respects precedence and parentheses', () => {
    const s = new Sheet({ A1: '=1+2*3', A2: '=(1+2)*3', A3: '=10-4-3', A4: '=2^3^2', A5: '=-2^2', A6: '=8/4/2' });
    expect(v(s, 'A1')).toBe('7');
    expect(v(s, 'A2')).toBe('9');
    expect(v(s, 'A3')).toBe('3');
    expect(v(s, 'A4')).toBe('64'); // Excel: ^ is left-associative
    expect(v(s, 'A5')).toBe('4'); // Excel: unary minus binds tighter than ^
    expect(v(s, 'A6')).toBe('1');
  });

  it('supports SUM / AVG over ranges combined with refs and arithmetic', () => {
    const s = new Sheet({ A1: '1', A2: '2', A3: '3', A4: '4', A5: '5', B1: '10', B2: '20', B3: '', B4: 'text', B5: '30' });
    s.setCells({ C1: '=SUM(A1:A5)', C2: '=AVG(B1:B5)', C3: '=SUM(A1:A5)*2 + AVG(B1:B5) / (A2+A3) - B1', C4: '=sum(a1:a2, 10, A5)' });
    expect(v(s, 'C1')).toBe('15');
    expect(v(s, 'C2')).toBe('20'); // text and blanks in ranges are ignored
    expect(v(s, 'C3')).toBe('24'); // 30 + 20/5 - 10
    expect(v(s, 'C4')).toBe('18');
  });

  it('handles text, numbers and literal detection', () => {
    const s = new Sheet({ A1: 'hello', A2: '42', A3: '3.5', A4: "'123", A5: '=A2+A3', A6: '=A1&" world"' });
    expect(s.getValue('A2')).toBe(42);
    expect(s.getValue('A4')).toBe('123');
    expect(v(s, 'A5')).toBe('45.5');
    expect(v(s, 'A6')).toBe('hello world');
  });
});

describe('dependency graph', () => {
  it('cascades through a multi-level chain and only recalculates affected cells', () => {
    const s = new Sheet({ A1: '5', B1: '=A1*2', C1: '=B1+1', D1: '=C1*C1', E1: '=SUM(B1:D1)', Z9: '=1+1', F1: '100' });
    expect(v(s, 'D1')).toBe('121');
    expect(v(s, 'E1')).toBe('142');
    const r = s.setCell('A1', '10');
    expect(v(s, 'B1')).toBe('20');
    expect(v(s, 'C1')).toBe('21');
    expect(v(s, 'D1')).toBe('441');
    expect(v(s, 'E1')).toBe('482');
    expect(r.order).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']); // topological; F1/Z9 untouched
  });

  it('supports forward references (formula before its input exists)', () => {
    const s = new Sheet();
    s.setCell('A1', '=B1+C1');
    expect(v(s, 'A1')).toBe('0');
    s.setCell('C1', '=D1*3');
    s.setCell('D1', '4');
    expect(v(s, 'C1')).toBe('12');
    expect(v(s, 'A1')).toBe('12');
    s.setCell('B1', '1');
    expect(v(s, 'A1')).toBe('13');
    expect(s.directDependents('B1')).toEqual(['A1']);
    expect(s.allPrecedents('A1')).toEqual(['B1', 'C1', 'D1']);
  });

  it('rewires edges when a formula changes', () => {
    const s = new Sheet({ A1: '1', A2: '2', B1: '=A1' });
    s.setCell('B1', '=A2');
    expect(s.directDependents('A1')).toEqual([]);
    expect(s.directDependents('A2')).toEqual(['B1']);
    s.setCell('A1', '99');
    expect(v(s, 'B1')).toBe('2');
  });
});

describe('cycles', () => {
  it('flags direct self reference', () => {
    const s = new Sheet({ A1: '=A1+1' });
    expect(v(s, 'A1')).toBe('#CYCLE!');
  });

  it('flags every member of an indirect cycle, propagates to dependents, and recovers', () => {
    const s = new Sheet({ A1: '=C1+1', B1: '=A1*2', C1: '5', D1: '=B1+100' });
    expect(v(s, 'D1')).toBe('112');
    s.setCell('C1', '=B1');
    expect(v(s, 'A1')).toBe('#CYCLE!');
    expect(v(s, 'B1')).toBe('#CYCLE!');
    expect(v(s, 'C1')).toBe('#CYCLE!');
    expect(v(s, 'D1')).toBe('#CYCLE!'); // depends on a cycle -> error propagates
    expect(s.isInCycle('D1')).toBe(false); // ...but D1 itself is not a member
    expect(s.cycleCells).toEqual(['A1', 'B1', 'C1']);
    s.setCell('C1', '1');
    expect(v(s, 'A1')).toBe('2');
    expect(v(s, 'D1')).toBe('104');
    expect(s.cycleCells).toEqual([]);
  });

  it('handles a large chain without stack overflow', () => {
    const s = new Sheet();
    const changes: Record<string, string> = { A1: '1' };
    for (let r = 2; r <= 30; r++) changes[`A${r}`] = `=A${r - 1}+1`;
    for (let r = 1; r <= 30; r++) changes[`B${r}`] = `=A${r}*2`;
    s.setCells(changes);
    expect(v(s, 'A30')).toBe('30');
    s.setCell('A1', '=A30');
    expect(v(s, 'A15')).toBe('#CYCLE!');
    expect(v(s, 'B15')).toBe('#CYCLE!');
  });
});

describe('errors', () => {
  it('produces and propagates #DIV/0!, #REF!, #VALUE!', () => {
    const s = new Sheet({
      A1: '=1/0',
      A2: '=A1+1',
      A3: '=SUM(A1:A2)',
      B1: '=ZZ999',
      B2: '=B1*2',
      B3: '=SUM(A1:A9999)',
      C1: 'abc',
      C2: '=C1*2',
      C3: '=C2+1',
      D1: '=AVG(E1:E3)',
      D2: '=1/(E1-E1)',
      D3: '=1+',
      D4: '=FOO(1)',
    });
    expect(v(s, 'A1')).toBe('#DIV/0!');
    expect(v(s, 'A2')).toBe('#DIV/0!');
    expect(v(s, 'A3')).toBe('#DIV/0!');
    expect(v(s, 'B1')).toBe('#REF!');
    expect(v(s, 'B2')).toBe('#REF!');
    expect(v(s, 'B3')).toBe('#REF!');
    expect(v(s, 'C2')).toBe('#VALUE!');
    expect(v(s, 'C3')).toBe('#VALUE!');
    expect(v(s, 'D1')).toBe('#DIV/0!');
    expect(v(s, 'D2')).toBe('#DIV/0!');
    expect(v(s, 'D3')).toBe('#ERROR!');
    expect(v(s, 'D4')).toBe('#NAME?');
  });
});

describe('copy/paste reference shifting', () => {
  it('shifts relative refs, keeps absolute refs, and turns off-grid refs into #REF!', () => {
    expect(shiftFormula('=A1+$B$2+C$3+$D4', 1, 1)).toBe('=B2+$B$2+D$3+$D5');
    expect(shiftFormula('=SUM(A1:A5)', 0, 2)).toBe('=SUM(C1:C5)');
    expect(shiftFormula('=A1*2', -1, 0)).toBe('=#REF!*2');
    const s = new Sheet({ A1: shiftFormula('=A1*2', -1, 0) });
    expect(v(s, 'A1')).toBe('#REF!');
  });
});
