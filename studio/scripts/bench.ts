import { existsSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { findRepoRoot } from '../server/paths.ts';
import { Runner } from '../server/runner.ts';
import { scanManifest } from '../server/scan.ts';
import { readSpec } from '../server/spec.ts';
import { SPEC_FILE } from '../src/shared/launch.ts';

/**
 * 启动规范的命令行入口，给 bench-launch skill 和手动排查用：
 *
 *   pnpm bench status [project]          列出所有产出及其 bench.json 状态
 *   pnpm bench check  <产出>              只校验 bench.json，不启动
 *   pnpm bench run    <产出> [--keep]     按 bench.json 真实启动 → 等就绪 → 抓首页 → 停止
 *                                         --keep 就绪后保持运行，Ctrl-C 停止
 *
 * <产出> 可以写组合 id（pelican/gpt/astra/codex），也可以写目录路径（相对或绝对）。
 * 退出码：0 通过，1 失败，2 用法错误。
 */

const repoRoot = findRepoRoot(process.cwd());
const benchmarksRoot = resolve(repoRoot, 'benchmarks');
// pnpm --dir studio 会把 cwd 换成 studio/，INIT_CWD 才是用户敲命令的目录
const userCwd = process.env.INIT_CWD ?? process.cwd();

function fail(message: string, code = 1): never {
  console.error(message);
  process.exit(code);
}

function usage(): never {
  fail(
    [
      '用法:',
      '  pnpm bench status [project]          列出产出与 bench.json 状态',
      '  pnpm bench check  <产出>              校验 bench.json',
      '  pnpm bench run    <产出> [--keep]     真实启动并验证，默认验证后停止',
      '',
      '<产出>：组合 id（如 pelican/gpt/astra/codex）或产出目录路径',
    ].join('\n'),
    2,
  );
}

/** 组合 id 或路径 → { id, dir } */
function locate(target: string): { id: string; dir: string } {
  const candidates = [resolve(userCwd, target), resolve(benchmarksRoot, target)];
  for (const dir of candidates) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    const rel = relative(benchmarksRoot, dir);
    const parts = rel.split(sep);
    if (rel.startsWith('..') || parts.length !== 4) continue;
    return { id: parts.join('/'), dir };
  }
  fail(`找不到产出目录：${target}\n需要是 benchmarks/<project>/<family>/<model>/<harness> 这一层`, 2);
}

function status(project?: string) {
  const manifest = scanManifest();
  const rows: string[][] = [];
  const counts: Record<string, number> = {};
  for (const benchmark of manifest.benchmarks) {
    if (project && benchmark.id !== project) continue;
    for (const key of benchmark.produced) {
      const info = benchmark.launch[key];
      if (!info) continue;
      const label =
        info.spec === 'missing' ? (info.empty ? 'empty' : 'missing') : info.spec;
      counts[label] = (counts[label] ?? 0) + 1;
      const detail =
        info.spec === 'static'
          ? info.entry
          : info.spec === 'process'
            ? info.start
            : info.spec === 'invalid'
              ? info.error
              : info.spec === 'unavailable'
                ? info.reason
                : info.empty
                  ? '空目录'
                  : `缺 ${SPEC_FILE}`;
      rows.push([`${benchmark.id}/${key}`, label, detail]);
    }
  }
  if (project && rows.length === 0) fail(`项目 ${project} 不存在或还没有产出`, 2);
  const width = Math.max(...rows.map((row) => row[0]!.length), 4);
  for (const [id, label, detail] of rows) {
    console.log(`${id!.padEnd(width)}  ${label!.padEnd(11)}  ${detail}`);
  }
  console.log(
    `\n共 ${rows.length} 个产出：` +
      Object.entries(counts)
        .map(([label, n]) => `${label} ${n}`)
        .join('，'),
  );
  console.log('待规范的是 missing / invalid；empty 是空目录，可写 unavailable 说明原因。');
}

function check(target: string) {
  const { id, dir } = locate(target);
  const result = readSpec(dir);
  if (!result) fail(`✗ ${id}：没有 ${SPEC_FILE}`);
  if (!result.ok) fail(`✗ ${id}：${result.error}`);
  console.log(`✓ ${id}：${SPEC_FILE} 合法（kind=${result.spec.kind}）`);
  console.log(JSON.stringify(result.spec, null, 2));
  return { id, dir, spec: result.spec };
}

async function fetchPage(url: string): Promise<{ status: number; bytes: number; title: string }> {
  const response = await fetch(url, { redirect: 'follow' });
  const body = await response.text();
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(body)?.[1]?.trim() ?? '';
  return { status: response.status, bytes: body.length, title };
}

async function run(target: string, keep: boolean) {
  const { id, dir, spec } = check(target);

  if (spec.kind === 'unavailable') {
    console.log(`\n此产出标记为 unavailable：${spec.reason}`);
    return;
  }

  if (spec.kind === 'static') {
    const entry = resolve(dir, spec.entry);
    const html = await import('node:fs').then((fs) => fs.readFileSync(entry, 'utf8'));
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? '';
    console.log(`\n✓ static 入口存在：${spec.entry}（${html.length} 字符${title ? `，title「${title}」` : ''}）`);
    console.log(`Studio 内地址：/preview/${id}/${spec.entry}`);
    return;
  }

  const runner = new Runner(1);
  const stopAndExit = async (code: number) => {
    await runner.stop(id);
    process.exit(code);
  };
  // Ctrl-C 是 --keep 模式下的正常结束方式，停干净后按成功退出，不让 pnpm 报 ELIFECYCLE
  process.once('SIGINT', () => void stopAndExit(0));
  process.once('SIGTERM', () => void stopAndExit(0));

  console.log('');
  const { state } = await runner.start({
    id,
    dir,
    spec,
    onLog: (line) => {
      const prefix = line.stream === 'sys' ? '»' : line.stream === 'err' ? '!' : '│';
      console.log(`${prefix} ${line.text}`);
    },
  });

  // 等到 running / failed
  for (;;) {
    const current = runner.get(id) ?? state;
    if (current.phase === 'running') break;
    if (current.phase === 'failed' || current.phase === 'stopped') {
      await runner.stop(id);
      fail(`\n✗ 启动失败：${current.error ?? current.phase}`);
    }
    await new Promise((done) => setTimeout(done, 300));
  }

  const current = runner.get(id)!;
  try {
    const page = await fetchPage(current.url);
    const ok = page.status < 400;
    console.log(
      `\n${ok ? '✓' : '✗'} GET ${current.url} → HTTP ${page.status}，${page.bytes} 字节${page.title ? `，title「${page.title}」` : ''}`,
    );
    if (!ok) {
      await stopAndExit(1);
    }
  } catch (error) {
    console.error(`\n✗ 抓取首页失败：${error instanceof Error ? error.message : String(error)}`);
    await stopAndExit(1);
  }

  if (keep) {
    console.log(`保持运行中：${current.url}  （Ctrl-C 停止）`);
    await new Promise(() => undefined);
  }

  await runner.stop(id);
  const after = runner.get(id);
  console.log(`✓ 已停止（端口 ${Object.values(current.ports).join(', ')} 已释放）${after?.phase === 'stopped' ? '' : ''}`);
  process.exit(0);
}

const [command, ...rest] = process.argv.slice(2).filter(Boolean);
const flags = new Set(rest.filter((arg) => arg.startsWith('--')));
const args = rest.filter((arg) => !arg.startsWith('--'));

switch (command) {
  case 'status':
    status(args[0]);
    break;
  case 'check':
    if (!args[0]) usage();
    check(args[0]);
    break;
  case 'run':
    if (!args[0]) usage();
    await run(args[0], flags.has('--keep'));
    break;
  default:
    usage();
}
