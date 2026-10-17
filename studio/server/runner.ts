import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { connect, createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { ACTIVE_PHASES, fillPorts } from '../src/shared/launch.ts';
import type { LogLine, ProcessSpec, RunState } from '../src/shared/launch.ts';

/**
 * 进程管理：按 bench.json 的 process 规范启动、等待就绪、停止产出。
 *
 * Studio 的 Vite 插件和 `pnpm bench` CLI 共用这一份实现。
 * 每次启动都用独立的进程组（detached），停止时整组发信号，
 * 这样 concurrently / npm run 这类会再派生子进程的命令也能停干净。
 */

const LOG_LIMIT = 3000;
const STOP_GRACE_MS = 3000;
/** 自动分配端口的区间，避开常见开发端口（3000、5173、8080……）。 */
const AUTO_PORT_FROM = 41000;
const AUTO_PORT_TO = 41999;

type Run = {
  state: RunState;
  logs: LogLine[];
  child?: ChildProcess;
  stopping: boolean;
  /** 本次运行被替换或停止后置位，让还在跑的异步步骤及时退出 */
  cancelled: boolean;
};

// 去掉终端颜色和光标控制，日志面板只显示纯文本。
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*\u0007/g;

/** 从 Studio 自己的进程继承的这些变量会干扰被启动的产出，统一去掉。 */
function childEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (/^(npm_|pnpm_|VITE_)/i.test(key) || key === 'INIT_CWD' || key === 'NODE_ENV') continue;
    env[key] = value;
  }
  // 别让 vite / CRA 之类自己弹浏览器
  env.BROWSER = 'none';
  return { ...env, ...extra };
}

/** 端口上有人在听吗？IPv4 和 IPv6 回环都试一下（vite 默认可能只绑 ::1）。 */
function isListening(port: number): Promise<boolean> {
  const probe = (host: string) =>
    new Promise<boolean>((done) => {
      const socket = connect({ host, port });
      const finish = (value: boolean) => {
        socket.destroy();
        done(value);
      };
      socket.setTimeout(400, () => finish(false));
      socket.once('connect', () => finish(true));
      socket.once('error', () => finish(false));
    });
  return Promise.all([probe('127.0.0.1'), probe('::1')]).then(([a, b]) => a || b);
}

/** 能不能在这个端口上监听（检查 0.0.0.0，覆盖绑定在任意地址上的情况）。 */
function canBind(port: number): Promise<boolean> {
  return new Promise((done) => {
    const server = createServer();
    server.once('error', () => done(false));
    server.listen({ port, host: '0.0.0.0', exclusive: true }, () => server.close(() => done(true)));
  });
}

async function isPortFree(port: number): Promise<boolean> {
  if (await isListening(port)) return false;
  return canBind(port);
}

async function waitForHttp(url: string, timeoutMs: number, alive: () => boolean): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    if (!alive()) return 'cancelled';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(url, { signal: controller.signal, redirect: 'manual' });
      clearTimeout(timer);
      await response.body?.cancel().catch(() => undefined);
      // 有 HTTP 响应且不是 5xx 就算起来了（404 也说明服务在听）
      if (response.status < 500) return null;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  return `等待 ${url} 超时（${Math.round(timeoutMs / 1000)}s），最后一次：${lastError || '无响应'}`;
}

export type StartOptions = {
  /** 组合 id：<project>/<family>/<model>/<harness> */
  id: string;
  /** 产出目录绝对路径 */
  dir: string;
  spec: ProcessSpec;
  /** 只在 CLI 里用：日志实时打印 */
  onLog?: (line: LogLine) => void;
};

export class Runner {
  private runs = new Map<string, Run>();
  /** 正在被占用（含启动中）的自动端口，避免两个产出同时分到同一个 */
  private reserved = new Set<number>();

  constructor(private readonly maxActive = 4) {}

  list(): RunState[] {
    return [...this.runs.values()].map((run) => ({ ...run.state }));
  }

  get(id: string): RunState | undefined {
    const run = this.runs.get(id);
    return run ? { ...run.state } : undefined;
  }

  logs(id: string, after = 0): LogLine[] {
    return this.runs.get(id)?.logs.filter((line) => line.seq > after) ?? [];
  }

  private push(run: Run, stream: LogLine['stream'], text: string, onLog?: (line: LogLine) => void) {
    for (const raw of text.replace(ANSI, '').split(/\r?\n|\r/)) {
      if (!raw.trim()) continue;
      const line: LogLine = { seq: run.state.logSeq + 1, stream, text: raw.slice(0, 2000) };
      run.state.logSeq = line.seq;
      run.logs.push(line);
      onLog?.(line);
    }
    if (run.logs.length > LOG_LIMIT) run.logs.splice(0, run.logs.length - LOG_LIMIT);
  }

  /** 哪个运行中的产出占着这个端口 */
  private owner(port: number): string | undefined {
    for (const run of this.runs.values()) {
      if (ACTIVE_PHASES.has(run.state.phase) && Object.values(run.state.ports).includes(port)) {
        return run.state.id;
      }
    }
    return undefined;
  }

  private async allocate(spec: ProcessSpec): Promise<Record<string, number>> {
    const ports: Record<string, number> = {};
    const taken: number[] = [];
    try {
      for (const [name, request] of Object.entries(spec.ports)) {
        if (request !== 'auto') {
          const owner = this.owner(request);
          if (owner) throw new Error(`端口 ${request}（${name}）被正在运行的 ${owner} 占用，先停掉它`);
          if (!(await isPortFree(request))) {
            throw new Error(`端口 ${request}（${name}）已被本机其他程序占用，bench.json 里写死了这个端口`);
          }
          ports[name] = request;
          continue;
        }
        let picked: number | undefined;
        for (let attempt = 0; attempt < 200 && picked === undefined; attempt += 1) {
          const candidate = AUTO_PORT_FROM + Math.floor(Math.random() * (AUTO_PORT_TO - AUTO_PORT_FROM));
          if (this.reserved.has(candidate) || taken.includes(candidate)) continue;
          if (await isPortFree(candidate)) picked = candidate;
        }
        if (picked === undefined) throw new Error('找不到空闲端口');
        ports[name] = picked;
        taken.push(picked);
        this.reserved.add(picked);
      }
      return ports;
    } catch (error) {
      for (const port of taken) this.reserved.delete(port);
      throw error;
    }
  }

  private release(run: Run) {
    for (const port of Object.values(run.state.ports)) this.reserved.delete(port);
  }

  /**
   * 启动一个产出。已经在跑就直接返回现状；超过并发上限时停掉最早启动的那个。
   * 返回值里的 evicted 是因此被停掉的产出。
   */
  async start(options: StartOptions): Promise<{ state: RunState; evicted?: string }> {
    const existing = this.runs.get(options.id);
    if (existing && ACTIVE_PHASES.has(existing.state.phase)) return { state: { ...existing.state } };
    if (existing) existing.cancelled = true;

    let evicted: string | undefined;
    const active = [...this.runs.values()].filter((run) => ACTIVE_PHASES.has(run.state.phase));
    if (active.length >= this.maxActive) {
      const oldest = active.sort((a, b) => a.state.startedAt.localeCompare(b.state.startedAt))[0];
      if (oldest) {
        evicted = oldest.state.id;
        await this.stop(oldest.state.id);
      }
    }

    const run: Run = {
      state: {
        id: options.id,
        phase: 'starting',
        command: options.spec.start,
        ports: {},
        url: '',
        startedAt: new Date().toISOString(),
        logSeq: existing?.state.logSeq ?? 0,
      },
      logs: [],
      stopping: false,
      cancelled: false,
    };
    this.runs.set(options.id, run);

    try {
      run.state.ports = await this.allocate(options.spec);
    } catch (error) {
      this.fail(run, error instanceof Error ? error.message : String(error), options.onLog);
      return { state: { ...run.state }, evicted };
    }

    const { spec } = options;
    run.state.url = fillPorts(spec.url, run.state.ports);
    run.state.command = fillPorts(spec.start, run.state.ports);

    const portEnv: Record<string, string> = {};
    const portEntries = Object.entries(run.state.ports);
    if (portEntries[0]) portEnv.PORT = String(portEntries[0][1]);
    for (const [name, port] of portEntries) portEnv[`PORT_${name.toUpperCase().replace(/-/g, '_')}`] = String(port);
    const env = childEnv({
      ...portEnv,
      ...Object.fromEntries(Object.entries(spec.env).map(([key, value]) => [key, fillPorts(value, run.state.ports)])),
    });

    void this.execute(run, options, env);
    return { state: { ...run.state }, evicted };
  }

  private fail(run: Run, message: string, onLog?: (line: LogLine) => void) {
    run.state.phase = 'failed';
    run.state.error = message;
    run.state.endedAt = new Date().toISOString();
    this.push(run, 'sys', `✗ ${message}`, onLog);
    this.release(run);
  }

  private spawnShell(run: Run, command: string, cwd: string, env: NodeJS.ProcessEnv, onLog?: (line: LogLine) => void) {
    const child = spawn('/bin/sh', ['-c', command], { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    run.child = child;
    run.state.pid = child.pid;
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => this.push(run, 'out', chunk, onLog));
    child.stderr?.setEncoding('utf8').on('data', (chunk: string) => this.push(run, 'err', chunk, onLog));
    return child;
  }

  private async execute(run: Run, options: StartOptions, env: NodeJS.ProcessEnv) {
    const { spec, dir, onLog } = options;
    const alive = () => !run.cancelled && !run.stopping;

    // 1. setup：依次执行，unless 指向的路径已存在就跳过
    for (const step of spec.setup) {
      if (!alive()) return;
      if (step.unless && existsSync(join(dir, step.unless))) {
        this.push(run, 'sys', `跳过 setup：${step.run}（${step.unless} 已存在）`, onLog);
        continue;
      }
      run.state.phase = 'setup';
      run.state.command = fillPorts(step.run, run.state.ports);
      this.push(run, 'sys', `$ ${run.state.command}`, onLog);
      const child = this.spawnShell(run, run.state.command, resolve(dir, step.cwd ?? spec.cwd ?? '.'), env, onLog);
      const code = await new Promise<number | null>((done) => {
        child.once('error', (error) => {
          this.push(run, 'sys', error.message, onLog);
          done(-1);
        });
        child.once('exit', (exitCode, signal) => done(signal ? -1 : exitCode));
      });
      if (!alive()) return;
      if (code !== 0) {
        this.fail(run, `setup 失败（退出码 ${code}）：${run.state.command}`, onLog);
        return;
      }
    }

    // 2. start：常驻进程
    if (!alive()) return;
    run.state.phase = 'starting';
    run.state.command = fillPorts(spec.start, run.state.ports);
    this.push(run, 'sys', `$ ${run.state.command}`, onLog);
    this.push(
      run,
      'sys',
      `端口 ${Object.entries(run.state.ports).map(([name, port]) => `${name}=${port}`).join(' ')}`,
      onLog,
    );
    const child = this.spawnShell(run, run.state.command, resolve(dir, spec.cwd ?? '.'), env, onLog);

    let exited = false;
    child.once('error', (error) => this.push(run, 'sys', error.message, onLog));
    child.once('exit', (code, signal) => {
      exited = true;
      if (run.cancelled) return;
      run.child = undefined;
      run.state.endedAt = new Date().toISOString();
      this.release(run);
      if (run.stopping) {
        run.state.phase = 'stopped';
        this.push(run, 'sys', '已停止', onLog);
      } else {
        const how = signal ? `信号 ${signal}` : `退出码 ${code}`;
        run.state.phase = 'failed';
        run.state.error =
          run.state.readyAt ? `进程意外退出（${how}）` : `进程在就绪前退出（${how}），看日志找原因`;
        this.push(run, 'sys', `✗ ${run.state.error}`, onLog);
      }
    });

    // 3. 就绪检查
    const readyUrl = fillPorts(spec.readyUrl ?? spec.url, run.state.ports);
    const problem = await waitForHttp(readyUrl, spec.readyTimeoutSec * 1000, () => alive() && !exited);
    if (!alive() || exited || problem === 'cancelled') return;
    if (problem) {
      this.push(run, 'sys', `✗ ${problem}`, onLog);
      await this.stop(run.state.id);
      run.state.phase = 'failed';
      run.state.error = problem;
      return;
    }
    run.state.phase = 'running';
    run.state.readyAt = new Date().toISOString();
    this.push(run, 'sys', `✓ 已就绪：${run.state.url}`, onLog);
  }

  /** 停止一个产出：整组 SIGTERM，宽限期后 SIGKILL。 */
  async stop(id: string): Promise<RunState | undefined> {
    const run = this.runs.get(id);
    if (!run) return undefined;
    run.stopping = true;
    const child = run.child;
    if (!child?.pid || child.exitCode !== null || child.signalCode !== null) {
      if (ACTIVE_PHASES.has(run.state.phase)) {
        run.state.phase = 'stopped';
        run.state.endedAt = new Date().toISOString();
        this.release(run);
      }
      return { ...run.state };
    }
    const pid = child.pid;
    const exited = new Promise<void>((done) => child.once('exit', () => done()));
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      /* 进程组已经没了 */
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        /* 已退出 */
      }
    }, STOP_GRACE_MS);
    await exited;
    clearTimeout(timer);
    // 进程组里可能还有孤儿（父进程先退出），补一刀
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      /* 都退出了 */
    }
    return { ...run.state };
  }

  /** 同步杀掉全部进程组：Studio 退出时调用。 */
  killAll() {
    for (const run of this.runs.values()) {
      run.cancelled = true;
      const pid = run.child?.pid;
      if (!pid) continue;
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        /* 已退出 */
      }
    }
  }
}
