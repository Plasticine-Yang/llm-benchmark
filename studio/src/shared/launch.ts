/**
 * 启动规范：每个产出目录里的 bench.json。
 *
 * 由 bench-launch skill 在 benchmark 跑完之后补写，Studio 和 `pnpm bench` 只读取它，
 * 不再自己猜启动方式。三种形态：
 *
 *   static       纯静态页面，Studio 直接托管目录，不起进程
 *   process      需要起进程：可选的 setup 步骤 + 一条 start 命令，端口由 Studio 分配
 *   unavailable  规范过了但确实起不来（空目录、产出不完整……），写明原因
 *
 * 这份文件在浏览器、Vite 插件和 CLI 之间共用，所以只能依赖纯 TS。
 */

export const SPEC_FILE = 'bench.json';
export const SPEC_VERSION = 1;

/** 未写 ports 时的默认端口表：一个自动分配的端口，名字叫 app。 */
export const DEFAULT_PORTS: Record<string, PortRequest> = { app: 'auto' };
export const DEFAULT_URL = 'http://127.0.0.1:{port}/';
export const DEFAULT_READY_TIMEOUT_SEC = 90;

export type PortRequest = 'auto' | number;

export type SetupStep = {
  /** shell 命令，在产出目录（或 cwd）下执行 */
  run: string;
  /** 产出目录下的相对路径；它已存在就跳过这一步，例如 node_modules、dist */
  unless?: string;
  /** 相对产出目录的工作目录 */
  cwd?: string;
};

export type StaticSpec = {
  version: 1;
  kind: 'static';
  /** 入口文件，相对产出目录，默认 index.html */
  entry: string;
  notes?: string;
};

export type ProcessSpec = {
  version: 1;
  kind: 'process';
  setup: SetupStep[];
  /** 常驻进程的 shell 命令，可以用 {port} / {port.<name>} 占位 */
  start: string;
  cwd?: string;
  env: Record<string, string>;
  /** 端口表：auto 由 Studio 分配空闲端口；写死的数字启动前会检查是否被占用 */
  ports: Record<string, PortRequest>;
  /** 打开的页面地址，可用端口占位符 */
  url: string;
  /** 就绪检查：轮询这个地址直到有 HTTP 响应，默认就是 url */
  readyUrl?: string;
  readyTimeoutSec: number;
  notes?: string;
};

export type UnavailableSpec = {
  version: 1;
  kind: 'unavailable';
  reason: string;
  notes?: string;
};

export type LaunchSpec = StaticSpec | ProcessSpec | UnavailableSpec;

export type SpecResult = { ok: true; spec: LaunchSpec } | { ok: false; error: string };

const PLACEHOLDER = /\{port(?:\.([A-Za-z0-9_-]+))?\}/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeRelative(path: string): boolean {
  return path !== '' && !path.startsWith('/') && !path.split(/[\\/]/).includes('..');
}

function optionalString(raw: Record<string, unknown>, key: string, errors: string[]): string | undefined {
  const value = raw[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    errors.push(`${key} 必须是字符串`);
    return undefined;
  }
  return value;
}

/** 检查文本里的端口占位符都在端口表里。 */
function checkPlaceholders(field: string, text: string, ports: Record<string, PortRequest>, errors: string[]) {
  const names = Object.keys(ports);
  for (const match of text.matchAll(PLACEHOLDER)) {
    const name = match[1] ?? names[0];
    if (!name || !(name in ports)) errors.push(`${field} 里的 ${match[0]} 在 ports 里没有对应端口`);
  }
}

/** 解析并校验 bench.json 的内容。所有错误一次报全，方便 skill 一轮修完。 */
export function parseSpec(text: string): SpecResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `不是合法 JSON：${error instanceof Error ? error.message : String(error)}` };
  }
  if (!isRecord(raw)) return { ok: false, error: '顶层必须是对象' };

  const errors: string[] = [];
  if (raw.version !== SPEC_VERSION) errors.push(`version 必须是 ${SPEC_VERSION}`);
  const notes = optionalString(raw, 'notes', errors);

  switch (raw.kind) {
    case 'static': {
      const entry = optionalString(raw, 'entry', errors) ?? 'index.html';
      if (!isSafeRelative(entry)) errors.push('entry 必须是产出目录内的相对路径');
      if (errors.length) return { ok: false, error: errors.join('；') };
      return { ok: true, spec: { version: 1, kind: 'static', entry, ...(notes ? { notes } : {}) } };
    }

    case 'unavailable': {
      const reason = optionalString(raw, 'reason', errors);
      if (!reason?.trim()) errors.push('unavailable 需要写明 reason');
      if (errors.length || !reason) return { ok: false, error: errors.join('；') };
      return { ok: true, spec: { version: 1, kind: 'unavailable', reason, ...(notes ? { notes } : {}) } };
    }

    case 'process': {
      const start = optionalString(raw, 'start', errors);
      if (!start?.trim()) errors.push('process 需要 start 命令');

      const cwd = optionalString(raw, 'cwd', errors);
      if (cwd !== undefined && !isSafeRelative(cwd)) errors.push('cwd 必须是产出目录内的相对路径');

      let ports: Record<string, PortRequest> = { ...DEFAULT_PORTS };
      if (raw.ports !== undefined) {
        if (!isRecord(raw.ports) || Object.keys(raw.ports).length === 0) {
          errors.push('ports 必须是非空对象，例如 {"app": "auto"}');
        } else {
          ports = {};
          for (const [name, value] of Object.entries(raw.ports)) {
            if (!/^[A-Za-z0-9_-]+$/.test(name)) errors.push(`端口名「${name}」只能用字母、数字、- 和 _`);
            if (value === 'auto' || (Number.isInteger(value) && (value as number) > 0 && (value as number) < 65536)) {
              ports[name] = value as PortRequest;
            } else {
              errors.push(`ports.${name} 只能是 "auto" 或 1–65535 的整数`);
            }
          }
        }
      }

      const env: Record<string, string> = {};
      if (raw.env !== undefined) {
        if (!isRecord(raw.env)) errors.push('env 必须是对象');
        else {
          for (const [key, value] of Object.entries(raw.env)) {
            if (typeof value === 'string' || typeof value === 'number') env[key] = String(value);
            else errors.push(`env.${key} 必须是字符串`);
          }
        }
      }

      const setup: SetupStep[] = [];
      if (raw.setup !== undefined) {
        if (!Array.isArray(raw.setup)) errors.push('setup 必须是数组');
        else {
          raw.setup.forEach((step, index) => {
            if (!isRecord(step) || typeof step.run !== 'string' || !step.run.trim()) {
              errors.push(`setup[${index}] 需要 run 命令`);
              return;
            }
            const item: SetupStep = { run: step.run };
            if (step.unless !== undefined) {
              if (typeof step.unless === 'string' && isSafeRelative(step.unless)) item.unless = step.unless;
              else errors.push(`setup[${index}].unless 必须是产出目录内的相对路径`);
            }
            if (step.cwd !== undefined) {
              if (typeof step.cwd === 'string' && isSafeRelative(step.cwd)) item.cwd = step.cwd;
              else errors.push(`setup[${index}].cwd 必须是产出目录内的相对路径`);
            }
            setup.push(item);
          });
        }
      }

      const url = optionalString(raw, 'url', errors) ?? DEFAULT_URL;
      if (!/^https?:\/\//.test(url)) errors.push('url 必须以 http:// 或 https:// 开头');
      const readyUrl = optionalString(raw, 'readyUrl', errors);

      let readyTimeoutSec = DEFAULT_READY_TIMEOUT_SEC;
      if (raw.readyTimeoutSec !== undefined) {
        if (typeof raw.readyTimeoutSec === 'number' && raw.readyTimeoutSec > 0 && raw.readyTimeoutSec <= 900) {
          readyTimeoutSec = raw.readyTimeoutSec;
        } else errors.push('readyTimeoutSec 必须是 1–900 的秒数');
      }

      if (start) checkPlaceholders('start', start, ports, errors);
      checkPlaceholders('url', url, ports, errors);
      if (readyUrl) checkPlaceholders('readyUrl', readyUrl, ports, errors);
      for (const [key, value] of Object.entries(env)) checkPlaceholders(`env.${key}`, value, ports, errors);
      setup.forEach((step, index) => checkPlaceholders(`setup[${index}].run`, step.run, ports, errors));

      if (errors.length || !start) return { ok: false, error: errors.join('；') };
      return {
        ok: true,
        spec: {
          version: 1,
          kind: 'process',
          setup,
          start,
          ...(cwd ? { cwd } : {}),
          env,
          ports,
          url,
          ...(readyUrl ? { readyUrl } : {}),
          readyTimeoutSec,
          ...(notes ? { notes } : {}),
        },
      };
    }

    default:
      errors.unshift('kind 必须是 static、process 或 unavailable');
      return { ok: false, error: errors.join('；') };
  }
}

/** 把 {port} / {port.<name>} 换成实际分配到的端口。{port} 指端口表里的第一个。 */
export function fillPorts(text: string, ports: Record<string, number>): string {
  const first = Object.values(ports)[0];
  return text.replace(PLACEHOLDER, (whole, name: string | undefined) => {
    const value = name ? ports[name] : first;
    return value === undefined ? whole : String(value);
  });
}

/* ------------------------------------------------------------------------ */
/* 运行状态：服务端维护，前端轮询展示                                         */
/* ------------------------------------------------------------------------ */

/** 产出目录在 manifest 里的启动信息（不含运行状态）。 */
export type LaunchInfo =
  | { spec: 'missing'; empty: boolean }
  | { spec: 'invalid'; error: string }
  | { spec: 'static'; entry: string; notes?: string }
  | { spec: 'process'; start: string; notes?: string }
  | { spec: 'unavailable'; reason: string };

export type RunPhase = 'setup' | 'starting' | 'running' | 'failed' | 'stopped';

export type RunState = {
  /** 组合 id：<project>/<family>/<model>/<harness> */
  id: string;
  phase: RunPhase;
  /** 当前或最后执行的命令，用于展示 */
  command: string;
  ports: Record<string, number>;
  url: string;
  pid?: number;
  startedAt: string;
  readyAt?: string;
  endedAt?: string;
  error?: string;
  /** 最新一行日志的序号，前端据此增量拉取 */
  logSeq: number;
};

export type LogLine = { seq: number; stream: 'out' | 'err' | 'sys'; text: string };

export const ACTIVE_PHASES: ReadonlySet<RunPhase> = new Set(['setup', 'starting', 'running']);
