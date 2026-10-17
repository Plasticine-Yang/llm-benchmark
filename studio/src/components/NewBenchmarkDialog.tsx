import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { cx, MOD_KEY } from '../lib/text';
import { suggestProjectId, validateProjectId, validatePrompt } from '../shared/project';
import { Icon } from './Icon';

type Props = {
  /** 已有项目，用于实时查重 */
  existing: string[];
  onClose: () => void;
  /** 创建成功后回调新项目 id */
  onCreated: (id: string, chars: number) => void;
};

/**
 * 只在打开时挂载：Chrome 在页面加载阶段会给 DOM 里已存在的 input 恢复上次输入，
 * 若弹窗常驻 DOM，项目名输入框会被塞进旧值而 React 状态是空的（看着有名、校验却报空）。
 * 打开时才挂载，加载阶段没有这个 input，就不会被恢复。
 */
async function createBenchmark(id: string, prompt: string): Promise<{ id: string; chars: number }> {
  const response = await fetch('/api/benchmark/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bench-Studio': '1' },
    body: JSON.stringify({ id, prompt }),
  });
  const body = (await response.json().catch(() => null)) as { id?: string; chars?: number; error?: string } | null;
  if (!response.ok || !body?.id) throw new Error(body?.error ?? `HTTP ${response.status}`);
  return { id: body.id, chars: body.chars ?? prompt.length };
}

/**
 * 新建 benchmark：粘贴题目 prompt、起一个项目名，写入 benchmarks/<项目名>/prompt.md。
 * 校验规则和 `pnpm bench new` 同一份（shared/project.ts），服务端会再校验一次。
 */
export function NewBenchmarkDialog({ existing, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState('');
  const [id, setId] = useState('');
  /** 用户亲手改过项目名后，就不再根据 prompt 自动改写 */
  const [idTouched, setIdTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const idFieldId = useId();
  const promptFieldId = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
    promptRef.current?.focus();
  }, []);

  const suggested = useMemo(() => suggestProjectId(prompt), [prompt]);
  const effectiveId = idTouched ? id : id || suggested;
  const idError = validateProjectId(effectiveId, existing);
  const promptError = validatePrompt(prompt);
  // 名字非空后就实时提示（重名、格式）；空着时等提交再说，免得一打开就满屏报错
  const showIdError = idError && (submitted || effectiveId.length > 0);
  const showPromptError = promptError && submitted;
  const lines = prompt ? prompt.replace(/\n$/, '').split('\n').length : 0;

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (idError || promptError || saving) return;
    setSaving(true);
    createBenchmark(effectiveId, prompt)
      .then((result) => onCreated(result.id, result.chars))
      .catch((error: unknown) => setServerError(error instanceof Error ? error.message : String(error)))
      .finally(() => setSaving(false));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // 弹窗里的按键不交给工作区的全局快捷键（⌘↵ 在外面是复制 prompt）
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="nb"
      aria-labelledby={`${idFieldId}-title`}
      onClose={onClose}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        // 点遮罩关闭：只有点到 dialog 自身（::backdrop 区域）时 target 才是它
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form className="nb-card" onSubmit={submit} noValidate>
        <header className="nb-head">
          <div>
            <p className="nb-kicker">新建 benchmark</p>
            <h2 className="nb-title" id={`${idFieldId}-title`}>
              粘贴题目，起个名字
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭" disabled={saving}>
            <Icon name="close" size={14} />
          </button>
        </header>

        <div className="nb-field nb-field-prompt">
          <div className="nb-label-row">
            <label className="nb-label" htmlFor={promptFieldId}>
              题目 prompt
            </label>
            <span className="nb-meta">
              {prompt ? (
                <>
                  <b>{prompt.length.toLocaleString('en-US')}</b> 字符 · <b>{lines}</b> 行
                </>
              ) : (
                '原文照存，不做改写'
              )}
            </span>
          </div>
          <textarea
            ref={promptRef}
            id={promptFieldId}
            className={cx('nb-textarea', showPromptError && 'is-invalid')}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="把这道题的 prompt 原文粘贴到这里。shared-prompt.md 会在拼装时自动追加，不用一起贴。"
            spellCheck={false}
            aria-invalid={showPromptError ? true : undefined}
          />
          {showPromptError && <p className="nb-error">{promptError}</p>}
        </div>

        <div className="nb-field">
          <label className="nb-label" htmlFor={idFieldId}>
            项目名
          </label>
          <div className={cx('nb-path', showIdError && 'is-invalid')}>
            <span className="nb-path-fix">benchmarks/</span>
            <input
              id={idFieldId}
              className="nb-input"
              value={effectiveId}
              onChange={(event) => {
                setIdTouched(true);
                setId(event.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              placeholder="rainy-night-convenience-store"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={showIdError ? true : undefined}
            />
            <span className="nb-path-fix">/prompt.md</span>
          </div>
          {showIdError ? (
            <p className="nb-error">{idError}</p>
          ) : (
            <p className="nb-hint">
              {!idTouched && suggested ? '已从首行标题推荐，可以改。' : '小写字母、数字和连字符，会成为目录名和组合 id 的第一段。'}
            </p>
          )}
        </div>

        {serverError && (
          <p className="nb-server-error" role="alert">
            <Icon name="alert" size={14} />
            {serverError}
          </p>
        )}

        <footer className="nb-foot">
          <span className="nb-foot-note">不需要改 catalog.txt</span>
          <div className="nb-actions">
            <button type="button" className="btn btn-sm" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <span className="btn-label">{saving ? '创建中…' : '创建'}</span>
              <span className="btn-kbd" aria-hidden="true">
                <kbd className="kbd">{MOD_KEY}</kbd>
                <kbd className="kbd">↵</kbd>
              </span>
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
