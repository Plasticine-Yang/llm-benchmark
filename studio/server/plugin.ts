import { execFile } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { composeForSelection, selectCombo } from '../src/shared/compose.ts';
import { findRepoRoot } from './paths.ts';
import { Runner } from './runner.ts';
import { isInsideBenchmarks, scanManifest } from './scan.ts';
import { readSpec } from './spec.ts';

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** 组合 id → 产出目录；id 形如 <project>/<family>/<model>/<harness>，逐段校验防止越界。 */
export function resolveComboDir(id: string, repoRoot: string): string | null {
  const parts = id.split('/');
  if (parts.length !== 4 || !parts.every((part) => SEGMENT.test(part))) return null;
  const dir = join(repoRoot, 'benchmarks', ...parts);
  if (!isInsideBenchmarks(dir, repoRoot) || !existsSync(dir) || !statSync(dir).isDirectory()) return null;
  return dir;
}

/**
 * Runner 挂在 globalThis 上：改 vite.config 触发的服务器重启不会丢掉正在运行的产出，
 * 也不会重复注册退出钩子。Studio 退出时把所有产出进程组一起带走。
 */
type StudioGlobal = typeof globalThis & { __benchStudioRunner?: Runner };
function sharedRunner(): Runner {
  const store = globalThis as StudioGlobal;
  if (!store.__benchStudioRunner) {
    const runner = new Runner(4);
    store.__benchStudioRunner = runner;
    process.once('exit', () => runner.killAll());
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
      process.once(signal, () => {
        runner.killAll();
        // 正常退出：Ctrl-C 关 Studio 是预期操作，不要让 pnpm 报 ELIFECYCLE
        process.exit(0);
      });
    }
  }
  return store.__benchStudioRunner;
}

/**
 * 启动 / 停止只接受 Studio 页面发出的 POST：要求自定义请求头。
 * 被启动的产出跑在别的端口上，跨源发不出带自定义头的请求（预检不会通过），
 * 这样产出页面里的脚本没法反过来操纵 Studio 起停进程。
 */
function isStudioWrite(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: '只接受 POST' });
    return false;
  }
  if (req.headers['x-bench-studio'] !== '1') {
    sendJson(res, 403, { error: '缺少 X-Bench-Studio 请求头' });
    return false;
  }
  return true;
}

function queryOf(req: IncomingMessage): URLSearchParams {
  return new URL(req.url ?? '/', 'http://localhost').searchParams;
}

/** 托管 kind=static 的产出。rest 是 /preview/ 之后的路径：<project>/<family>/<model>/<harness>/<file...> */
function servePreview(rawUrl: string, res: ServerResponse, repoRoot: string) {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);
  } catch {
    sendJson(res, 400, { error: '路径编码有误' });
    return;
  }
  const parts = pathname.split('/').filter(Boolean);
  const id = parts.slice(0, 4).join('/');
  const dir = resolveComboDir(id, repoRoot);
  if (!dir) {
    sendJson(res, 404, { error: '没有这个产出目录' });
    return;
  }
  const spec = readSpec(dir);
  if (!spec?.ok || spec.spec.kind !== 'static') {
    sendJson(res, 404, { error: '这个产出不是 static 规范，不能直接托管' });
    return;
  }
  // 访问目录本身时跳到 entry，保证页面里的相对路径按 entry 所在目录解析
  if (parts.length === 4) {
    res.statusCode = 302;
    res.setHeader('Location', `/preview/${id}/${spec.spec.entry.split('/').map(encodeURIComponent).join('/')}`);
    res.end();
    return;
  }
  let file = resolve(dir, ...parts.slice(4));
  if (!file.startsWith(dir + sep)) {
    sendJson(res, 403, { error: '越界访问' });
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`Not found: ${parts.slice(4).join('/')}`);
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  createReadStream(file).pipe(res);
}

/**
 * 本地接口：
 *   GET  /api/manifest                                 实时扫盘：全集、覆盖情况、各产出的启动规范
 *   GET  /api/prompt?project&family&model&harness       文字版 prompt
 *   GET  /api/reveal?path                               在访达里定位产出目录
 *   GET  /api/runs                                      全部运行状态
 *   POST /api/run/start?id                              按 bench.json 启动
 *   POST /api/run/stop?id                               停止
 *   GET  /api/run/logs?id&after                         增量日志
 *   GET  /preview/<id>/...                              托管 static 产出
 */
export function benchStudioPlugin(): Plugin {
  const runner = sharedRunner();

  const attach = (middlewares: Connect.Server) => {
    const repoRoot = findRepoRoot(process.cwd());

    middlewares.use('/api/manifest', (_req, res) => {
      try {
        sendJson(res, 200, scanManifest());
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      }
    });

    middlewares.use('/api/prompt', (req, res) => {
      try {
        const params = queryOf(req);
        const manifest = scanManifest();
        const selection = selectCombo(manifest, {
          project: params.get('project') ?? '',
          family: params.get('family') ?? '',
          model: params.get('model') ?? '',
          harness: params.get('harness') ?? '',
        });
        if (!selection) {
          sendJson(res, 404, { error: '没有这个组合' });
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(composeForSelection(manifest, selection));
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      }
    });

    middlewares.use('/api/reveal', (req, res) => {
      try {
        const target = queryOf(req).get('path') ?? '';
        if (!target || !isInsideBenchmarks(target, repoRoot) || !existsSync(target)) {
          sendJson(res, 400, { error: '路径不在 benchmarks/ 内或不存在' });
          return;
        }
        const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
        const args = process.platform === 'darwin' ? ['-R', target] : [target];
        execFile(opener, args, (error) => {
          sendJson(res, error ? 500 : 200, error ? { error: error.message } : { ok: true });
        });
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      }
    });

    middlewares.use('/api/runs', (_req, res) => sendJson(res, 200, runner.list()));

    middlewares.use('/api/run/logs', (req, res) => {
      const params = queryOf(req);
      const id = params.get('id') ?? '';
      const after = Number(params.get('after') ?? 0) || 0;
      sendJson(res, 200, { state: runner.get(id) ?? null, lines: runner.logs(id, after) });
    });

    middlewares.use('/api/run/start', (req, res) => {
      if (!isStudioWrite(req, res)) return;
      void (async () => {
        try {
          const id = queryOf(req).get('id') ?? '';
          const dir = resolveComboDir(id, repoRoot);
          if (!dir) {
            sendJson(res, 404, { error: '没有这个产出目录' });
            return;
          }
          const spec = readSpec(dir);
          if (!spec) {
            sendJson(res, 409, { error: '还没有 bench.json，先用 bench-launch skill 规范启动方式' });
            return;
          }
          if (!spec.ok) {
            sendJson(res, 409, { error: `bench.json 有误：${spec.error}` });
            return;
          }
          if (spec.spec.kind !== 'process') {
            sendJson(res, 409, { error: `这个产出是 ${spec.spec.kind}，不需要启动进程` });
            return;
          }
          sendJson(res, 200, await runner.start({ id, dir, spec: spec.spec }));
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      })();
    });

    middlewares.use('/api/run/stop', (req, res) => {
      if (!isStudioWrite(req, res)) return;
      void (async () => {
        const state = await runner.stop(queryOf(req).get('id') ?? '');
        sendJson(res, state ? 200 : 404, state ?? { error: '这个产出没有在运行' });
      })();
    });

    // use() 挂载前缀后 req.url 已经去掉了 /preview
    middlewares.use('/preview', (req, res) => {
      try {
        servePreview(req.url ?? '/', res, repoRoot);
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      }
    });
  };

  return {
    name: 'bench-studio',
    configureServer: (server) => attach(server.middlewares),
    configurePreviewServer: (server) => attach(server.middlewares),
  };
}
