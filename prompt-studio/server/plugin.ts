import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { composeForSelection, selectCombo } from '../src/shared/compose.ts';
import { findRepoRoot } from './paths.ts';
import { isInsideBenchmarks, scanManifest } from './scan.ts';

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

/**
 * 三个本地接口：
 *   GET /api/manifest                                  实时扫盘，返回全集 + 各项目覆盖情况
 *   GET /api/prompt?project&family&model&harness        直接返回文字版 prompt（方便 curl / 脚本）
 *   GET /api/reveal?path                                在访达里定位产出目录
 */
export function promptStudioPlugin(): Plugin {
  const attach = (middlewares: Connect.Server) => {
    middlewares.use('/api/manifest', (_req, res) => {
      try {
        sendJson(res, 200, scanManifest());
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      }
    });

    middlewares.use('/api/prompt', (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const manifest = scanManifest();
        const selection = selectCombo(manifest, {
          project: url.searchParams.get('project') ?? '',
          family: url.searchParams.get('family') ?? '',
          model: url.searchParams.get('model') ?? '',
          harness: url.searchParams.get('harness') ?? '',
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
        const url = new URL(req.url ?? '/', 'http://localhost');
        const target = url.searchParams.get('path') ?? '';
        const repoRoot = findRepoRoot(process.cwd());
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
  };

  return {
    name: 'prompt-studio',
    configureServer: (server) => attach(server.middlewares),
    configurePreviewServer: (server) => attach(server.middlewares),
  };
}
