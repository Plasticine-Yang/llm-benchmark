import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVE_PHASES } from '../shared/launch';
import type { LogLine, RunState } from '../shared/launch';

/** 写操作统一带这个头：跨源页面（比如被预览的产出）发不出带自定义头的简单请求。 */
const WRITE_HEADERS = { 'X-Bench-Studio': '1' };

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `HTTP ${response.status}`;
}

export async function startRun(id: string): Promise<{ state: RunState; evicted?: string }> {
  const response = await fetch(`/api/run/start?id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: WRITE_HEADERS,
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as { state: RunState; evicted?: string };
}

export async function stopRun(id: string): Promise<void> {
  const response = await fetch(`/api/run/stop?id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: WRITE_HEADERS,
  });
  if (!response.ok && response.status !== 404) throw new Error(await readError(response));
}

/** 全部运行状态。有进程在启动/运行时 1 秒轮询一次，否则 4 秒。 */
export function useRuns() {
  const [runs, setRuns] = useState<RunState[]>([]);
  const [token, setToken] = useState(0);

  const refresh = useCallback(() => setToken((value) => value + 1), []);
  const anyActive = runs.some((run) => ACTIVE_PHASES.has(run.phase));

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/runs')
        .then((response) => (response.ok ? (response.json() as Promise<RunState[]>) : null))
        .then((data) => {
          if (!cancelled && data) setRuns(data);
        })
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, anyActive ? 1000 : 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [anyActive, token]);

  const byId = useMemo(() => new Map(runs.map((run) => [run.id, run])), [runs]);
  const active = useMemo(() => runs.filter((run) => ACTIVE_PHASES.has(run.phase)), [runs]);
  return { runs, byId, active, refresh };
}

/** 某个产出的增量日志。live 时 0.8 秒拉一次，否则只拉一次补齐。 */
export function useLogs(id: string | null, live: boolean) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    setLines([]);
    seqRef.current = 0;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/run/logs?id=${encodeURIComponent(id)}&after=${seqRef.current}`)
        .then((response) => (response.ok ? (response.json() as Promise<{ lines: LogLine[] }>) : null))
        .then((data) => {
          if (cancelled || !data || data.lines.length === 0) return;
          seqRef.current = data.lines[data.lines.length - 1]!.seq;
          setLines((prev) => {
            const next = prev.concat(data.lines);
            return next.length > 1500 ? next.slice(next.length - 1500) : next;
          });
        })
        .catch(() => undefined);
    void load();
    if (!live) return () => {
      cancelled = true;
    };
    const timer = window.setInterval(load, 800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, live]);

  return lines;
}
