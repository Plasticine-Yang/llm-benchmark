// End-to-end acceptance test against the production server (npm run build && npm start).
// Usage: BASE_URL=http://localhost:3001 CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node tests/e2e.mjs
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await fetch(`${BASE}/api/workbook/reset`, { method: 'POST' });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--window-size=1500,1000'] });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000 });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => m.type() === 'error' && pageErrors.push(m.text()));

const text = (addr) => page.$eval(`[data-addr="${addr}"] .cell-text`, (el) => el.textContent);
const cls = (addr) => page.$eval(`[data-addr="${addr}"]`, (el) => el.className);
const click = (addr) => page.click(`[data-addr="${addr}"]`);
const waitSaved = async () => {
  await page.waitForFunction(() => document.querySelector('.save-badge')?.classList.contains('saved'), { timeout: 5000 });
  await sleep(150);
};
async function typeInto(addr, value) {
  await click(addr);
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-addr="A1"]');
check('grid has >= 20 rows x 10 cols', await page.$$eval('td[data-addr]', (els) => els.length >= 200), true);

// 1. Dependency chain 4 levels deep, typed via keyboard. B4 is a forward reference typed first.
await typeInto('B4', '=B3*2+SUM(A1:A3)');
check('forward reference evaluates to 0 before inputs exist', await text('B4'), '0');
await typeInto('A1', '5');
await typeInto('B1', '=A1*2');
await typeInto('B2', '=B1+A1');
await typeInto('B3', '=(B2-B1)*AVG(A1:A2)');
check('chain B1', await text('B1'), '10');
check('chain B2', await text('B2'), '15');
check('chain B3', await text('B3'), '25');
check('chain B4', await text('B4'), '55');

// Enter moved selection down after commit
check('Enter commits and moves down', await page.$eval('.name-box', (el) => el.textContent), 'B4');

// Change root -> cascade
await typeInto('A1', '10');
check('cascade B1', await text('B1'), '20');
check('cascade B2', await text('B2'), '30');
check('cascade B3', await text('B3'), '100');
check('cascade B4', await text('B4'), '210');
const order = await page.$$eval('.order .chip', (els) => els.map((e) => e.textContent));
check('recalc order is topological and minimal', order, ['A1', 'B1', 'B2', 'B3', 'B4']);

// 2. Highlighting of references and dependents for B2
await click('B2');
check('B2 direct precedent B1 highlighted', (await cls('B1')).includes('prec-direct'), true);
check('B2 direct precedent A1 highlighted', (await cls('A1')).includes('prec-direct'), true);
check('B2 direct dependent B3 highlighted', (await cls('B3')).includes('dep-direct'), true);
check('B2 indirect dependent B4 highlighted', (await cls('B4')).includes('dep-indirect') || (await cls('B4')).includes('dep-direct'), true);
check('unrelated C5 not highlighted', /prec|dep/.test(await cls('C5')), false);

// 3. Arrow navigation + Enter edit mode
await click('B1');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowDown');
check('arrow navigation', await page.$eval('.name-box', (el) => el.textContent), 'C2');
await page.keyboard.press('Enter');
check('Enter opens editor', !!(await page.$('.cell-editor')), true);
await page.keyboard.type('=B4/(A1-10)');
await page.keyboard.press('Enter');
check('#DIV/0!', await text('C2'), '#DIV/0!');
await typeInto('C3', '=C2+1');
check('#DIV/0! propagates', await text('C3'), '#DIV/0!');
await typeInto('D1', 'hello');
await typeInto('D2', '=D1*3');
check('#VALUE!', await text('D2'), '#VALUE!');
await typeInto('D3', '=AB300+1');
check('#REF!', await text('D3'), '#REF!');
await typeInto('D4', '=SUM(D2:D3)');
check('error propagates through SUM', await text('D4'), '#VALUE!');

// 4. Indirect circular reference: E1 -> E2 -> E3 -> E1, with F1 depending on the cycle
await typeInto('E1', '=E3+1');
await typeInto('E2', '=E1*2');
await typeInto('F1', '=E2+100');
await typeInto('E3', '=E2-1');
for (const a of ['E1', 'E2', 'E3']) {
  check(`${a} shows #CYCLE!`, await text(a), '#CYCLE!');
  check(`${a} has cycle styling`, (await cls(a)).includes('cycle'), true);
}
check('dependent of cycle shows #CYCLE!', await text('F1'), '#CYCLE!');
check('app still responsive after cycle', await page.$eval('.name-box', (el) => el.textContent), 'E4');

// 5. Undo / redo
await page.keyboard.down(MOD);
await page.keyboard.press('z');
await page.keyboard.up(MOD);
check('undo breaks the cycle (E3 cleared)', await text('E3'), '');
check('undo recomputes E1', await text('E1'), '1');
check('undo recomputes F1', await text('F1'), '102');
await page.keyboard.down(MOD);
await page.keyboard.down('Shift');
await page.keyboard.press('z');
await page.keyboard.up('Shift');
await page.keyboard.up(MOD);
check('redo restores cycle', await text('E1'), '#CYCLE!');
// Undo many steps via the button, then redo all
const undoCount = await page.$eval('.actions button', (b) => Number(b.querySelector('.count').textContent));
check('history holds all edits so far', undoCount >= 15, true);
for (let i = 0; i < undoCount; i++) await page.click('.actions button:nth-child(1)');
check('undo all -> A1 empty', await text('A1'), '');
check('undo all -> B4 empty', await text('B4'), '');
for (let i = 0; i < undoCount; i++) await page.click('.actions button:nth-child(2)');
check('redo all -> B4', await text('B4'), '210');
check('redo all -> E2 cycle', await text('E2'), '#CYCLE!');

// 6. Copy / paste with relative reference shifting (copy event + Cmd/Ctrl+V)
await click('B2');
await page.evaluate(() => document.execCommand('copy'));
await click('C6');
await page.keyboard.down(MOD);
await page.keyboard.press('v');
await page.keyboard.up(MOD);
await sleep(300);
await click('C6');
check('pasted formula is shifted', await page.$eval('#formula-input', (el) => el.value), '=C5+B5');
// External TSV paste (as from Excel / another app)
await click('G1');
await page.evaluate(() => {
  const dt = new DataTransfer();
  dt.setData('text/plain', '1\t2\n3\t=G1+H1+G2');
  document.querySelector('.grid').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
});
await sleep(100);
check('TSV paste block', [await text('G1'), await text('H1'), await text('G2'), await text('H2')], ['1', '2', '3', '6']);

// 7. Persistence across a full reload
await waitSaved();
const before = await page.$$eval('td[data-addr]', (els) => els.map((e) => [e.dataset.addr, e.textContent]));
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.overlay'));
const after = await page.$$eval('td[data-addr]', (els) => els.map((e) => [e.dataset.addr, e.textContent]));
check('all displayed values identical after reload', JSON.stringify(after) === JSON.stringify(before), true);
await click('B3');
check('raw formula persisted', await page.$eval('#formula-input', (el) => el.value), '=(B2-B1)*AVG(A1:A2)');
check('cycle persisted', await text('E3'), '#CYCLE!');
check('server values match client engine', await page.$eval('.inspector', (el) => /all \d+ stored values match/.test(el.textContent)), true);
// Root change after reload still cascades
await typeInto('A1', '1');
// B1=1*2=2, B2=2+1=3, B3=(3-2)*AVG(1)=1, B4=1*2+SUM(1)=3
check('cascade after reload', [await text('B1'), await text('B2'), await text('B3'), await text('B4')], ['2', '3', '1', '3']);
await waitSaved();

await page.screenshot({ path: 'tests/e2e-screenshot.png' });
check('no page errors', pageErrors, []);
await browser.close();
console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll e2e checks passed');
process.exit(failures ? 1 : 0);
