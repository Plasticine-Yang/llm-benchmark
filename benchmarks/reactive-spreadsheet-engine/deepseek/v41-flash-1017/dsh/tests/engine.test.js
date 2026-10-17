import test from "node:test";
import assert from "node:assert/strict";
import { ReactiveWorkbook, formatResult, cellAddress } from "../public/js/engine.js";

function resultOf(cells, address) {
  return formatResult(new ReactiveWorkbook({ cells }).getResult(address));
}

test("operator precedence, parentheses, unary operators, and text strings", () => {
  const wb = new ReactiveWorkbook({
    cells: {
      A1: "10",
      A2: "20",
      A3: "30",
      B1: "=(A1+A2)*3-A3/2",
      B2: "=-A1+2*3",
      B3: "=2*(A1+5)-A2/10",
      B4: '="north"',
    },
  });
  assert.equal(formatResult(wb.getResult("B1")), "75");
  assert.equal(formatResult(wb.getResult("B2")), "-4");
  assert.equal(formatResult(wb.getResult("B3")), "28");
  assert.equal(formatResult(wb.getResult("B4")), "north");
});

test("SUM and AVG support ranges, literals, nested arithmetic, and text/blank skipping", () => {
  const wb = new ReactiveWorkbook({
    cells: {
      A1: "10",
      A2: "20",
      A3: "30",
      A4: "notes",
      B1: "=SUM(A1:A4)",
      B2: "=AVG(A1:A4)",
      B3: "=SUM(A1:A2)*2+AVG(A2:A3)",
      B4: "=SUM(1, 2, A1, A2)",
      B5: "=AVG(A1:A2)",
      B6: "=AVG(A4:A4)",
    },
  });
  assert.equal(formatResult(wb.getResult("B1")), "60");
  assert.equal(formatResult(wb.getResult("B2")), "20");
  assert.equal(formatResult(wb.getResult("B3")), "85");
  assert.equal(formatResult(wb.getResult("B4")), "33");
  assert.equal(formatResult(wb.getResult("B5")), "15");
  assert.equal(formatResult(wb.getResult("B6")), "#DIV/0!");
});

test("forward references and deep cascades recalculate only affected cells", () => {
  const wb = new ReactiveWorkbook({
    cells: {
      B1: "=A1*2",
      C1: "=B1+3",
      D1: "=C1*10",
      E1: "=SUM(A1:D1)",
      Z1: "not a cell in the grid",
      J20: "99",
    },
  });
  const initial = wb.setCells({ A1: "1" });
  assert.equal(formatResult(wb.getResult("D1")), "50");
  assert.deepEqual(initial.affected, ["A1", "B1", "C1", "D1", "E1"]);
  assert.equal(initial.skipped, 195);

  const cascade = wb.setCells({ A1: "5" });
  assert.equal(formatResult(wb.getResult("B1")), "10");
  assert.equal(formatResult(wb.getResult("C1")), "13");
  assert.equal(formatResult(wb.getResult("D1")), "130");
  assert.equal(formatResult(wb.getResult("E1")), "158");
  assert.equal(cascade.affected.length, 5);
  assert.equal(cascade.skipped, 195);

  const unrelated = wb.setCells({ J20: "100" });
  assert.deepEqual(unrelated.affected, ["J20"]);
  assert.equal(unrelated.evaluated, 0);
  assert.equal(formatResult(wb.getResult("D1")), "130");
});

test("changing a formula reconnects the dependency graph", () => {
  const wb = new ReactiveWorkbook({
    cells: { A1: "2", B1: "10", C1: "=A1*3", D1: "=C1+1" },
  });
  assert.equal(formatResult(wb.getResult("D1")), "7");
  wb.setCells({ C1: "=B1+1" });
  assert.equal(formatResult(wb.getResult("D1")), "12");
  assert.deepEqual(wb.getDependencies("C1"), ["B1"]);
  assert.deepEqual(wb.getDependents("A1"), []);
  assert.deepEqual(wb.getDependents("B1"), ["C1"]);

  const impact = wb.setCells({ A1: "9" });
  assert.deepEqual(impact.affected, ["A1"]);
  assert.equal(formatResult(wb.getResult("D1")), "12");

  wb.setCells({ B1: "20" });
  assert.equal(formatResult(wb.getResult("C1")), "21");
  assert.equal(formatResult(wb.getResult("D1")), "22");
});

test("indirect cycles mark every participant and propagate #CYCLE!", () => {
  const wb = new ReactiveWorkbook({
    cells: {
      A1: "=B1",
      B1: "=C1",
      C1: "=A1+1",
      D1: "=A1+5",
    },
  });
  assert.deepEqual(wb.cycleGroups, [["A1", "B1", "C1"]]);
  for (const address of ["A1", "B1", "C1"]) {
    assert.equal(wb.getResult(address).error, "#CYCLE!", `${address} must be in the cycle`);
    assert.equal(wb.isCycleCell(address), true);
  }
  assert.equal(formatResult(wb.getResult("D1")), "#CYCLE!");
  assert.equal(wb.isCycleCell("D1"), false);

  const broken = wb.setCells({ C1: "5" });
  assert.deepEqual(wb.cycleGroups, []);
  assert.equal(formatResult(wb.getResult("A1")), "5");
  assert.equal(formatResult(wb.getResult("B1")), "5");
  assert.equal(formatResult(wb.getResult("C1")), "5");
  assert.equal(formatResult(wb.getResult("D1")), "10");
  assert.ok(broken.affected.includes("A1"));
});

test("self references and range self references do not hang", () => {
  const wb = new ReactiveWorkbook({
    cells: { A1: "=A1+1", B1: "=SUM(B1:B2)", C1: "=A1" },
  });
  assert.equal(formatResult(wb.getResult("A1")), "#CYCLE!");
  assert.equal(formatResult(wb.getResult("B1")), "#CYCLE!");
  assert.equal(formatResult(wb.getResult("C1")), "#CYCLE!");
  assert.equal(wb.isCycleCell("A1"), true);
  assert.equal(wb.isCycleCell("B1"), true);
  assert.equal(wb.isCycleCell("C1"), false);
});

test("DIV/0, REF, VALUE errors are produced and propagated", () => {
  const wb = new ReactiveWorkbook({
    cells: {
      A1: "hello",
      B1: "=A1+1",
      C1: "=100/0",
      D1: "=K1",
      E1: "=B1*2",
      F1: "=SUM(A1:D1)",
      G1: "=1+",
      H1: "=NOPE(1)",
      A2: "=SUM(K1:K3)",
      A3: "=AVG(K1:K3)",
    },
  });
  assert.equal(formatResult(wb.getResult("B1")), "#VALUE!");
  assert.equal(formatResult(wb.getResult("C1")), "#DIV/0!");
  assert.equal(formatResult(wb.getResult("D1")), "#REF!");
  assert.equal(formatResult(wb.getResult("E1")), "#VALUE!");
  assert.equal(formatResult(wb.getResult("F1")), "#VALUE!");
  assert.equal(formatResult(wb.getResult("G1")), "#VALUE!");
  assert.equal(formatResult(wb.getResult("H1")), "#VALUE!");
  assert.equal(formatResult(wb.getResult("A2")), "#REF!");
  assert.equal(formatResult(wb.getResult("A3")), "#REF!");

  wb.setCells({ A1: "4" });
  assert.equal(formatResult(wb.getResult("B1")), "5");
  assert.equal(formatResult(wb.getResult("E1")), "10");
  assert.equal(formatResult(wb.getResult("F1")), "#DIV/0!");
});

test("blank references behave as zero and ranges are included in the graph", () => {
  const wb = new ReactiveWorkbook({
    cells: {
      B1: "=A1+1",
      B2: "=SUM(A1:A3)",
      B3: "=A1",
    },
  });
  assert.equal(formatResult(wb.getResult("B1")), "1");
  assert.equal(formatResult(wb.getResult("B2")), "0");
  assert.equal(formatResult(wb.getResult("B3")), "0");
  assert.deepEqual(wb.getDependencies("B2"), ["A1", "A2", "A3"]);
  const recalc = wb.setCells({ A2: "7" });
  assert.deepEqual(recalc.affected, ["A2", "B2"]);
  assert.equal(formatResult(wb.getResult("B2")), "7");
});

test("raw workbook state round-trips and recalculates identically after reload", () => {
  const cells = {
    A1: "12",
    B1: "=A1*2",
    C1: "=B1+SUM(A1:A2)",
    D1: "=C1/0",
  };
  const wb = new ReactiveWorkbook({ cells });
  const raw = wb.toJSON();
  assert.deepEqual(raw, cells);
  const reloaded = new ReactiveWorkbook({ cells: raw });
  for (const address of ["A1", "B1", "C1", "D1"]) {
    assert.deepEqual(reloaded.getResult(address), wb.getResult(address));
  }
  assert.deepEqual(reloaded.getDependents("A1"), ["B1", "C1"]);
  assert.equal(formatResult(reloaded.getResult("D1")), "#DIV/0!");
});

test("all 200 grid cells are addressable and selections sanitize to the grid", () => {
  assert.equal(cellAddress(19, 9), "J20");
  const wb = new ReactiveWorkbook();
  wb.setCells({ J20: "=A1", K1: "outside" });
  assert.equal(wb.getRaw("J20"), "=A1");
  assert.equal(wb.getRaw("K1"), "");
  assert.equal(formatResult(wb.getResult("J20")), "0");
});
