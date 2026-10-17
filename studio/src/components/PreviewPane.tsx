import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVE_PHASES } from '../shared/launch';
import type { LaunchInfo, LogLine, RunState } from '../shared/launch';
import type { Selection } from '../shared/compose';
import { useLogs } from '../lib/runs';
import { cx } from '../lib/text';
import { Icon } from './Icon';

type Props = {
  selection: Selection;
  /** 组合 id：<project>/<family>/<model>/<harness> */
  comboId: string;
  launch: LaunchInfo | undefined;
  run: RunState | undefined;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onReveal: () => void;
  onShowPrompt: () => void;
};

const PHASE_LABEL: Record<RunState['phase'], string> = {
  setup: '准备依赖',
  starting: '启动中',
  running: '运行中',
  failed: '启动失败',
  stopped: '已停止',
};

function previewSrc(comboId: string, entry: string): string {
  return `/preview/${comboId}/${entry.split('/').map(encodeURIComponent).join('/')}`;
}

function LogPanel({ lines, open, onToggle, tone }: { lines: LogLine[]; open: boolean; onToggle: () => void; tone: 'normal' | 'error' }) {
  const bodyRef = useRef<HTMLPreElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    const node = bodyRef.current;
    if (node && stick.current) node.scrollTop = node.scrollHeight;
  }, [lines, open]);

  const last = lines[lines.length - 1];

  return (
    <div className={cx('logs', open && 'is-open', tone === 'error' && 'is-error')}>
      <button type="button" className="logs-bar" onClick={onToggle} aria-expanded={open}>
        <Icon name="terminal" size={13} />
        <span className="logs-title">日志</span>
        <span className="logs-count">{lines.length}</span>
        <span className="logs-last">{open ? '' : last?.text ?? '暂无输出'}</span>
        <Icon name={open ? 'chevronDown' : 'chevronUp'} size={13} />
      </button>
      {open && (
        <pre
          className="logs-body"
          ref={bodyRef}
          onScroll={(event) => {
            const node = event.currentTarget;
            stick.current = node.scrollHeight - node.scrollTop - node.clientHeight < 24;
          }}
        >
          {lines.length === 0 ? (
            <span className="log-empty">还没有输出</span>
          ) : (
            lines.map((line) => (
              <span key={line.seq} className={cx('log-line', `is-${line.stream}`)}>
                {line.text}
                {'\n'}
              </span>
            ))
          )}
        </pre>
      )}
    </div>
  );
}

/** 舞台上的占位说明：没有可看的页面时告诉用户为什么、下一步做什么。 */
function Placard({
  tone = 'plain',
  title,
  children,
}: {
  tone?: 'plain' | 'warn' | 'error';
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx('placard', `is-${tone}`)}>
      <p className="placard-title">{title}</p>
      {children}
    </div>
  );
}

export function PreviewPane({
  selection,
  comboId,
  launch,
  run,
  busy,
  onStart,
  onStop,
  onRestart,
  onReveal,
  onShowPrompt,
}: Props) {
  const [frameKey, setFrameKey] = useState(0);
  const [logsOpen, setLogsOpen] = useState(false);

  const isProcess = launch?.spec === 'process';
  const active = run ? ACTIVE_PHASES.has(run.phase) : false;
  const lines = useLogs(isProcess && run ? comboId : null, active);

  // 启动失败时自动展开日志
  useEffect(() => {
    if (run?.phase === 'failed') setLogsOpen(true);
  }, [run?.phase, run?.startedAt]);
  useEffect(() => setLogsOpen(false), [comboId]);

  const frameSrc = useMemo(() => {
    if (launch?.spec === 'static') return previewSrc(comboId, launch.entry);
    if (launch?.spec === 'process' && run?.phase === 'running') return run.url;
    return null;
  }, [launch, run?.phase, run?.url, comboId]);

  const status = (() => {
    if (!selection.exists) return { tone: 'todo', text: '还没有产出' };
    if (!launch || launch.spec === 'missing') return { tone: 'warn', text: launch?.empty ? '空目录' : '待规范' };
    if (launch.spec === 'invalid') return { tone: 'error', text: 'bench.json 有误' };
    if (launch.spec === 'unavailable') return { tone: 'warn', text: '无法预览' };
    if (launch.spec === 'static') return { tone: 'ok', text: '静态页面' };
    if (!run) return { tone: 'idle', text: '未启动' };
    return {
      tone: run.phase === 'running' ? 'ok' : run.phase === 'failed' ? 'error' : run.phase === 'stopped' ? 'idle' : 'busy',
      text: PHASE_LABEL[run.phase],
    };
  })();

  const portText = run && active ? Object.entries(run.ports).map(([name, port]) => (Object.keys(run.ports).length > 1 ? `${name}:${port}` : `:${port}`)).join(' ') : '';

  let stage: React.ReactNode;
  if (!selection.exists) {
    stage = (
      <Placard title="这个组合还没跑过">
        <p>先在 Prompt 页复制完整 prompt 去跑，产出落到 target 目录后这里就能预览。</p>
        <button type="button" className="btn btn-sm" onClick={onShowPrompt}>
          去复制 Prompt
        </button>
      </Placard>
    );
  } else if (!launch || launch.spec === 'missing') {
    stage = launch?.empty ? (
      <Placard tone="warn" title="产出目录是空的">
        <p>harness 可能中途失败了。不打算重跑的话，可以让 bench-launch 写一份 unavailable 规范记下原因。</p>
      </Placard>
    ) : (
      <Placard tone="warn" title="还没有启动规范">
        <p>跑完一批 benchmark 后，调用 <b>bench-launch</b> skill 为它们补写 <code>bench.json</code>，规范好的产出就能在这里一键查看。</p>
        <code className="placard-cmd">pnpm bench status</code>
      </Placard>
    );
  } else if (launch.spec === 'invalid') {
    stage = (
      <Placard tone="error" title="bench.json 有误">
        <code className="placard-cmd is-multiline">{launch.error}</code>
        <p>让 bench-launch 修一下，或者手动改完后点顶栏的刷新。</p>
      </Placard>
    );
  } else if (launch.spec === 'unavailable') {
    stage = (
      <Placard tone="warn" title="这个产出无法预览">
        <p>{launch.reason}</p>
      </Placard>
    );
  } else if (frameSrc) {
    stage = (
      <iframe
        key={`${frameSrc}#${frameKey}`}
        className="frame"
        src={frameSrc}
        title={`${comboId} 预览`}
        allow="autoplay; fullscreen; clipboard-read; clipboard-write; xr-spatial-tracking"
      />
    );
  } else if (isProcess && run && (run.phase === 'setup' || run.phase === 'starting')) {
    stage = (
      <Placard title={run.phase === 'setup' ? '正在准备依赖…' : '正在启动…'}>
        <span className="state-spinner" aria-hidden="true" />
        <code className="placard-cmd">{run.command}</code>
      </Placard>
    );
  } else if (isProcess && run?.phase === 'failed') {
    stage = (
      <Placard tone="error" title="启动失败">
        <p>{run.error}</p>
        <button type="button" className="btn btn-sm" onClick={onStart} disabled={busy}>
          <Icon name="refresh" size={13} />
          <span className="btn-label">重试</span>
        </button>
      </Placard>
    );
  } else if (isProcess) {
    stage = (
      <Placard title="需要启动服务">
        <code className="placard-cmd">{launch.start}</code>
        {launch.notes && <p className="placard-note">{launch.notes}</p>}
        <button type="button" className="btn btn-primary btn-start" onClick={onStart} disabled={busy}>
          <Icon name="play" size={14} />
          <span className="btn-label">启动并预览</span>
          <span className="btn-kbd" aria-hidden="true">
            <kbd className="kbd">R</kbd>
          </span>
        </button>
      </Placard>
    );
  }

  return (
    <div className="preview">
      <header className="preview-bar">
        <div className="preview-id">
          <span className="preview-project" title={selection.benchmarkId}>{selection.benchmarkId}</span>
          <span className="preview-combo">
            {selection.family.id}/{selection.model.id}/<b>{selection.harness}</b>
          </span>
        </div>

        <span className={cx('run-status', `is-${status.tone}`)}>
          <i aria-hidden="true" />
          {status.text}
          {portText && <code>{portText}</code>}
        </span>

        <div className="preview-actions">
          {isProcess && active && (
            <>
              <button type="button" className="btn btn-sm" onClick={onRestart} disabled={busy} title="停止后重新启动">
                <Icon name="refresh" size={13} />
                <span className="btn-label">重启</span>
              </button>
              <button type="button" className="btn btn-sm btn-stop" onClick={onStop} disabled={busy} title="停止进程（S）">
                <Icon name="stop" size={12} />
                <span className="btn-label">停止</span>
              </button>
            </>
          )}
          {isProcess && !active && (
            <button type="button" className="btn btn-sm btn-go" onClick={onStart} disabled={busy} title="按 bench.json 启动（R）">
              <Icon name="play" size={12} />
              <span className="btn-label">启动</span>
            </button>
          )}
          {frameSrc && (
            <>
              <button type="button" className="icon-btn" onClick={() => setFrameKey((key) => key + 1)} title="刷新页面" aria-label="刷新页面">
                <Icon name="reload" size={15} />
              </button>
              <a className="icon-btn" href={frameSrc} target="_blank" rel="noreferrer" title="在新标签页打开" aria-label="在新标签页打开">
                <Icon name="external" size={15} />
              </a>
            </>
          )}
          {selection.exists && (
            <button type="button" className="icon-btn" onClick={onReveal} title="在访达中显示" aria-label="在访达中显示">
              <Icon name="reveal" size={15} />
            </button>
          )}
        </div>
      </header>

      <div className={cx('stage', frameSrc && 'has-frame')}>{stage}</div>

      {isProcess && run && (
        <LogPanel
          lines={lines}
          open={logsOpen}
          onToggle={() => setLogsOpen((open) => !open)}
          tone={run.phase === 'failed' ? 'error' : 'normal'}
        />
      )}
    </div>
  );
}
