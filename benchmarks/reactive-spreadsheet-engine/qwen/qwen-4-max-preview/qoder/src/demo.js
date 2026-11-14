export const CHAIN_DEMO = {
  A1: '10',
  A2: '=A1*2',
  A3: '=A2+A1',
  A4: '=SUM(A2:A3)',
  A5: '=AVG(A1:A4)',
  A6: '=A5*10',
  B1: '=A6/2',
  B2: '=SUM(A1:A6)+B1',
  B3: '=IF(B2>500,"big","small")',
  C1: 'root value — edit me',
  C2: 'level 1: A1*2',
  C3: 'level 2: A2+A1',
  C4: 'level 3: SUM(A2:A3)',
  C5: 'level 4: AVG(A1:A4)',
  C6: 'level 5: A5*10',
  D1: 'level 6: A6/2',
  D2: 'level 7: SUM(A1:A6)+B1',
  D3: 'level 8: IF(B2>500,...)',
};

export const CYCLE_DEMO = {
  E1: '=F1+1',
  F1: '=G1+1',
  G1: '=E1+1',
  H1: '=SUM(E1:G1)',
  E3: 'indirect cycle: E1 -> F1 -> G1 -> E1',
  E4: 'H1 depends on the cycle, so it inherits #CYCLE!',
};

export const ERROR_DEMO = {
  A1: '0',
  B1: '=10/A1',
  C1: '=B1+1',
  D1: '=SUM(B1:C1)',
  F1: '#DIV/0! at A1=0, propagated through B1 -> C1 -> D1',
  A2: '=Z99+1',
  F2: '#REF! — Z99 is outside the 10x20 grid',
  A3: 'abc',
  B3: '=A3*2',
  F3: '#VALUE! — text used in arithmetic',
  A4: '=SUM(',
  F4: '#VALUE! — malformed formula',
  A5: '=IFERROR(B1,42)',
  F5: 'IFERROR recovers a #DIV/0! into 42',
  A6: '=A1/0',
  B6: '=IF(A6>0,1,2)',
  F6: 'errors also flow through comparisons and IF',
};

export const DEMOS = {
  chain: CHAIN_DEMO,
  cycle: CYCLE_DEMO,
  errors: ERROR_DEMO,
};