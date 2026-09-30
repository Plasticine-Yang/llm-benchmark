/* Visual + behavioural verification harness (dev-only, not part of the site). */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

/* Point CHROME_PATH at any installed Chromium/Chrome build. */
const EXEC =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5273/';
const OUT = 'verify3';
mkdirSync(OUT, { recursive: true });

const problems = [];

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ['--no-sandbox', '--force-device-scale-factor=2'],
});

async function newPage(width, height, reducedMotion = 'no-preference') {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion,
    locale: 'zh-CN',
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning')
      problems.push(`[${width}px][console.${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[${width}px][pageerror] ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  return { ctx, page };
}

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

async function scrollTo(page, fraction) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * f, behavior: 'instant' });
  }, fraction);
  await page.waitForTimeout(900);
}

/* ------------------------------------------------------------------ desktop */
{
  const { ctx, page } = await newPage(1512, 950);
  await page.waitForTimeout(2600); // let the entrance finish

  await shot(page, '01-hero');

  // horizontal overflow check
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  if (overflow.scrollW > overflow.clientW + 1)
    problems.push(
      `desktop horizontal overflow: ${overflow.scrollW} > ${overflow.clientW}`,
    );

  // nav scrolled state
  await scrollTo(page, 0.06);
  await shot(page, '02-nav-scrolled');

  // soundstage
  await page.locator('#sound').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const box = await page.locator('.viz').boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.3);
    await page.waitForTimeout(900);
    await page.mouse.move(box.x + box.width * 0.24, box.y + box.height * 0.66);
    await page.waitForTimeout(700);
  }
  await shot(page, '03-soundstage');

  // structure — three stages of the sticky dissolve
  const structTop = await page.evaluate(
    () => document.getElementById('structure').offsetTop,
  );
  const structH = await page.evaluate(
    () => document.getElementById('structure').offsetHeight,
  );
  const vh = 950;
  for (const [i, f] of [0.12, 0.48, 0.85].entries()) {
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: 'instant' }),
      structTop + (structH - vh) * f,
    );
    await page.waitForTimeout(800);
    await shot(page, `04-structure-${i + 1}`);
  }

  // colourways
  await page.locator('#colorways').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, '05-colorways-obsidian');
  await page.getByRole('radio', { name: /雾银/ }).click();
  await page.waitForTimeout(1300);
  await shot(page, '06-colorways-mist');
  await page.getByRole('radio', { name: /燃琥珀/ }).click();
  await page.waitForTimeout(1300);
  await shot(page, '07-colorways-amber');

  // specs + purchase
  await page.locator('#specs').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, '08-specs');
  await page.locator('#purchase').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, '09-purchase');

  // footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(900);
  await shot(page, '10-footer');

  // ------------------------------------------------------ design story
  await page.locator('.hero__secondary').click();
  await page.waitForTimeout(1300);
  await shot(page, '16-story-open');
  const ticks = await page.locator('.story__tick').count();
  if (ticks !== 5) problems.push(`expected 5 story chapters, got ${ticks}`);
  await page.locator('.story__tick').nth(3).click();
  await page.waitForTimeout(900);
  await shot(page, '17-story-chapter-4');
  await page.locator('.story__play').click();
  await page.waitForTimeout(400);
  await shot(page, '18-story-paused');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  if (await page.locator('.story').count())
    problems.push('Escape did not close the design story');
  const restored = await page.evaluate(
    () => document.activeElement?.className?.includes('hero__secondary') ?? false,
  );
  if (!restored) problems.push('focus was not restored to the story trigger');

  // ------------------------------------------------- reservation flow
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(700);

  await page.getByRole('button', { name: '预约试听' }).first().click();
  await page.waitForTimeout(900);
  await shot(page, '11-reservation-default');

  // validation error state
  await page.getByRole('button', { name: '提交预约' }).click();
  await page.waitForTimeout(500);
  await shot(page, '12-reservation-error');
  const errCount = await page.locator('.field__error').count();
  if (errCount < 2) problems.push(`expected >=2 validation errors, got ${errCount}`);

  // fill + submit -> submitting
  await page.locator('#rsv-name').fill('林知远');
  await page.locator('#rsv-phone').fill('13800138000');
  await shot(page, '13-reservation-filled');
  await page.getByRole('button', { name: '提交预约' }).click();
  await page.waitForTimeout(320);
  await shot(page, '14-reservation-submitting');
  await page.waitForTimeout(1900);
  await shot(page, '15-reservation-success');
  const ok = await page.getByText('预约成功。').count();
  if (!ok) problems.push('success state did not appear');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  const stillOpen = await page.locator('.rsv').count();
  if (stillOpen) problems.push('Escape did not close the reservation panel');

  await ctx.close();
}

/* ------------------------------------------------------------- reduced motion */
{
  const { ctx, page } = await newPage(1512, 950, 'reduce');
  await page.waitForTimeout(1600);
  await shot(page, '20-reduced-hero');
  await page.locator('#structure').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, '21-reduced-structure');
  await ctx.close();
}

/* ------------------------------------------------------------------- mobile */
for (const [w, h, tag] of [
  [390, 844, 'mobile'],
  [768, 1024, 'tablet'],
]) {
  const { ctx, page } = await newPage(w, h);
  await page.waitForTimeout(2400);
  await shot(page, `30-${tag}-hero`);

  const ov = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyW: document.body.scrollWidth,
  }));
  if (ov.scrollW > ov.clientW + 1)
    problems.push(`${tag} horizontal overflow: ${ov.scrollW} > ${ov.clientW}`);

  if (w < 900) {
    await page.getByRole('button', { name: '打开菜单' }).click();
    await page.waitForTimeout(700);
    await shot(page, `31-${tag}-menu`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  await page.locator('#sound').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, `32-${tag}-sound`);

  await page.locator('#structure').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, `33-${tag}-structure`);

  await page.locator('#colorways').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, `34-${tag}-colors`);

  await page.locator('#purchase').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await shot(page, `35-${tag}-purchase`);

  await page.locator('.hero__primary').click();
  await page.waitForTimeout(1000);
  await shot(page, `36-${tag}-reservation`);
  await page.locator('#rsv-name').fill('林知远');
  await page.locator('#rsv-phone').fill('13911112222');
  await page.locator('.rsv__submit-btn').click();
  await page.waitForTimeout(2100);
  await shot(page, `37-${tag}-reservation-success`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await ctx.close();
}

await browser.close();

console.log('\n===== VERIFY REPORT =====');
if (problems.length === 0) console.log('no console errors, no overflow issues');
else for (const p of problems) console.log('!', p);
console.log(`screenshots written to ${OUT}/`);
