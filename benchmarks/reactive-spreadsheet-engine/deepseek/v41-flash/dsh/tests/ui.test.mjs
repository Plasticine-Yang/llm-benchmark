/**
 * Interface tests: keyboard model, editing, undo/redo, clipboard,
 * dependency highlighting and persistence wiring — driven through jsdom.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import { SpreadsheetEngine } from '../src/engine/engine.js';
import { mountApp } from '../src/ui/app.js';

let dom;
let app;
let engine;

function setup(cells = {}, options = {}) {
  dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  engine = new SpreadsheetEngine({ rows: 24, cols: 12 });
  if (Object.keys(cells).length) engine.load(cells);
  const root = dom.window.document.getElementById('app');
  app = mountApp(root, { engine, api: options.api || null, autoLoad: options.autoLoad });
  return app;
}

function key(target, k, opts = {}) {
  const ev = new dom.window.KeyboardEvent('keydown', {
    key: k, bubbles: true, cancelable: true, ...opts,
  });
  target.dispatchEvent(ev);
  return ev;
}

function textOf(ref) {
  const td = document.querySelector(`td.cell[data-ref="${ref}"]`);
  return td ? td.firstChild.textContent : null;
}

function classOf(ref) {
  const td = document.querySelector(`td.cell[data-ref="${ref}"]`);
  return td ? td.className : '';
}

function clipboardEvent(type, data = '') {
  const ev = new dom.window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'clipboardData', {
    value: {
      store: { 'text/plain': data },
      getData(kind) { return this.store[kind] || ''; },
      setData(kind, val) { this.store[kind] = val; },
    },
  });
  return ev;
}

test('grid renders the required rows and columns', () => {
  setup();
  assert.equal(document.querySelectorAll('td.cell').length, 24 * 12);
  const heads = [...document.querySelectorAll('th.col-head')].map((th) => th.textContent);
  assert.deepEqual(heads.slice(0, 4), ['A', 'B', 'C', 'D']);
  assert.ok(document.querySelectorAll('th.row-head').length >= 20);
});

test('typing a value starts an edit and Enter commits it', () => {
  setup();
  key(document, '5');
  const editor = document.querySelector('input.cell-editor');
  assert.ok(editor, 'an inline editor appears');
  editor.value = '5';
  key(editor, 'Enter');
  assert.equal(engine.getRaw('A1'), '5');
  assert.equal(textOf('A1'), '5');
  assert.equal(app.getActiveRef(), 'A2', 'Enter moves down');
});

test('Enter edits an existing cell, Escape cancels, formula bar commits', () => {
  setup({ A1: '7' });
  app.selectRef('A1');
  key(document, 'Enter');
  let editor = document.querySelector('input.cell-editor');
  assert.equal(editor.value, '7');
  key(editor, 'Escape');
  assert.equal(engine.getRaw('A1'), '7');

  // formula bar
  app.selectRef('C3');
  const bar = document.querySelector('.formula-input');
  bar.value = '=1+1';
  key(bar, 'Enter');
  assert.equal(engine.getRaw('C3'), '=1+1');
  assert.equal(engine.getValue('C3').v, 2);
});

test('arrow keys navigate and shift+arrow extends the selection', () => {
  setup();
  key(document, 'ArrowDown');
  key(document, 'ArrowRight');
  assert.equal(app.getActiveRef(), 'B2');
  key(document, 'ArrowUp');
  assert.equal(app.getActiveRef(), 'B1');
  key(document, 'ArrowLeft');
  assert.equal(app.getActiveRef(), 'A1');

  key(document, 'ArrowRight', { shiftKey: true });
  key(document, 'ArrowDown', { shiftKey: true });
  assert.equal(document.querySelectorAll('td.cell.selected').length, 4);
});

test('undo and redo cover more than 20 edits and restore computed values', () => {
  setup({ A1: '=1+1' });
  // 25 edits alternating between two values
  for (let i = 0; i < 25; i += 1) {
    app.applyChanges([{ ref: 'A1', before: engine.getRaw('A1'), after: String(i) }]);
  }
  assert.equal(engine.getValue('A1').v, 24);
  for (let i = 0; i < 25; i += 1) key(document, 'z', { ctrlKey: true });
  assert.equal(engine.getRaw('A1'), '=1+1');
  assert.equal(engine.getValue('A1').v, 2);

  for (let i = 0; i < 25; i += 1) key(document, 'z', { ctrlKey: true, shiftKey: true });
  assert.equal(engine.getRaw('A1'), '24');
});

test('copy writes TSV and paste expands a block with one undo step', () => {
  setup({ A1: '1', B1: '2' });
  app.selectRef('A1');
  key(document, 'ArrowRight', { shiftKey: true });

  const copyEvent = clipboardEvent('copy');
  document.dispatchEvent(copyEvent);
  assert.equal(copyEvent.clipboardData.store['text/plain'], '1\t2');

  app.selectRef('A3');
  const pasteEvent = clipboardEvent('paste', 'x\ty\nz\t=1+2');
  document.dispatchEvent(pasteEvent);

  assert.equal(engine.getRaw('A3'), 'x');
  assert.equal(engine.getRaw('B3'), 'y');
  assert.equal(engine.getRaw('A4'), 'z');
  assert.equal(engine.getRaw('B4'), '=1+2');
  assert.equal(engine.getValue('B4').v, 3);

  key(document, 'z', { ctrlKey: true });
  assert.equal(engine.getRaw('A3'), '');
  assert.equal(engine.getRaw('A4'), '');
  assert.equal(engine.getRaw('B4'), '');
});

test('Delete clears the selected block and is undoable', () => {
  setup({ A1: '1', A2: '2', A3: '3' });
  app.selectRef('A1');
  key(document, 'ArrowDown', { shiftKey: true });
  key(document, 'ArrowDown', { shiftKey: true });
  key(document, 'Delete');
  assert.equal(engine.getRaw('A1'), '');
  assert.equal(engine.getRaw('A3'), '');
  key(document, 'z', { ctrlKey: true });
  assert.equal(engine.getRaw('A1'), '1');
  assert.equal(engine.getRaw('A3'), '3');
});

test('the selected cell highlights its inputs and its consumers', () => {
  setup({ A1: '1', A2: '=A1+1', A3: '=A2+1', B1: '=A3*2' });
  app.selectRef('A2');
  assert.match(classOf('A1'), /trace-prec/);
  assert.match(classOf('A1'), /trace-direct/);
  assert.match(classOf('A3'), /trace-dep/);
  assert.match(classOf('A3'), /trace-direct/);
  assert.match(classOf('B1'), /trace-dep/);
  assert.doesNotMatch(classOf('B1'), /trace-direct/);

  app.selectRef('A1');
  assert.match(classOf('A3'), /trace-dep/);
  assert.equal(textOf('A1'), '1');
});

test('trace highlighting can be switched off', () => {
  setup({ A1: '1', B1: '=A1+1' });
  const box = document.querySelector('.toggle input');
  box.checked = false;
  box.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  app.selectRef('A1');
  assert.doesNotMatch(classOf('B1'), /trace-dep/);
});

test('circular references render #CYCLE! in every participating cell', () => {
  setup({ E1: '=E2+1', E2: '=E1+1', E3: '=E1*2' });
  assert.equal(textOf('E1'), '#CYCLE!');
  assert.equal(textOf('E2'), '#CYCLE!');
  assert.equal(textOf('E3'), '#CYCLE!');
  assert.match(classOf('E1'), /cycle/);
});

test('errors render with the error class and a tooltip', () => {
  setup({ A1: '1', B1: '=A1/0', B2: '=A0', B3: '="t"*2' });
  assert.equal(textOf('B1'), '#DIV/0!');
  assert.equal(textOf('B2'), '#REF!');
  assert.equal(textOf('B3'), '#VALUE!');
  assert.match(classOf('B1'), /error/);
});

test('changing a root value cascades through a 4-level chain in the UI', () => {
  setup({ A1: '10', A2: '=A1*2', A3: '=A2+5', A4: '=SUM(A1:A3)' });
  assert.equal(textOf('A4'), '55');

  app.selectRef('A1');
  key(document, 'Enter');
  const editor = document.querySelector('input.cell-editor');
  editor.value = '100';
  key(editor, 'Enter');

  assert.equal(textOf('A2'), '200');
  assert.equal(textOf('A3'), '205');
  assert.equal(textOf('A4'), '505');
  const status = document.querySelector('.statusbar').textContent;
  assert.match(status, /4 recalculated last pass/); // A1 + the 3 dependents
});

test('the inspector lists precedents, dependents and recalculation order', () => {
  setup({ A1: '1', A2: '=A1+1', A3: '=A2+1' });
  app.applyChanges([{ ref: 'A1', before: '1', after: '5' }]);
  app.selectRef('A2');
  const html = document.querySelector('.inspector').innerHTML;
  assert.match(html, /References/);
  assert.match(html, /Dependents/);
  assert.match(html, /data-goto="A1"/);
  assert.match(html, /data-goto="A3"/);
  assert.match(html, /Last recalculation order/);
  assert.match(html, /1\. A1/);
  assert.match(html, /2\. A2/);
});

test('the demo buttons build a chain, a cycle and error cells', () => {
  setup();
  app.loadSample({ A1: '10', A2: '=A1*2', A3: '=A2+5', A4: '=SUM(A1:A3)' });
  assert.equal(textOf('A4'), '55');
  app.loadSample({ E1: '=E2+1', E2: '=E1+1' });
  assert.equal(textOf('E1'), '#CYCLE!');
  app.loadSample({ F1: '=A1/0' });
  assert.equal(textOf('F1'), '#DIV/0!');
  app.clearAll();
  assert.equal(engine.serialize().A1, undefined);
});

test('workbook is loaded from the backend on mount and saved after edits', async () => {
  const saved = [];
  const api = {
    async load() { return { cells: { A1: '3', B1: '=A1*7', C1: '=SUM(A1:B1)' } }; },
    async save(cells) { saved.push(cells); return { cells }; },
  };
  setup({}, { api });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(textOf('B1'), '21');
  assert.equal(textOf('C1'), '24');

  app.applyChanges([{ ref: 'A1', before: '3', after: '10' }]);
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.ok(saved.length >= 1, 'a save was issued');
  assert.equal(saved[saved.length - 1].A1, '10');
  assert.equal(saved[saved.length - 1].B1, '=A1*7');
  assert.match(document.querySelector('.save-status').textContent, /saved/);
});
