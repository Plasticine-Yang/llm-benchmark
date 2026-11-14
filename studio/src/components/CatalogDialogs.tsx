import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { cx, MOD_KEY } from '../lib/text';
import type { CatalogOp } from '../shared/catalog';
import { validateCatalogId, validateHarnesses } from '../shared/catalog';
import { Icon } from './Icon';

/**
 * harness 选择器：已选 chips + 自由输入 + 从现有 harness 里点选。
 * Enter / 逗号提交一个名字，Backspace 在空输入时删掉最后一个已选。
 */
export function HarnessPicker({
  value,
  onChange,
  suggestions,
  autoFocus,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const commit = (raw: string) => {
    const name = raw.trim().replace(/,+$/, '');
    if (!name) return;
    const invalid = validateCatalogId(name, 'harness 名');
    if (invalid) {
      setError(invalid);
      return;
    }
    if (value.includes(name)) {
      setError(`harness「${name}」已经选过了`);
      return;
    }
    setError(null);
    setDraft('');
    onChange([...value, name]);
  };

  const remaining = suggestions.filter((name) => !value.includes(name));

  return (
    <div className="hp">
      <div className={cx('hp-box', error && 'is-invalid')}>
        {value.map((name) => (
          <span key={name} className="hp-chip">
            {name}
            <button
              type="button"
              className="hp-chip-x"
              aria-label={`移除 ${name}`}
              onClick={() => onChange(value.filter((item) => item !== name))}
            >
              <Icon name="close" size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="hp-input"
          value={draft}
          placeholder={value.length === 0 ? '输入 harness 名，回车添加' : '继续添加…'}
          spellCheck={false}
          autoComplete="off"
          aria-label="新增 harness"
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit(draft);
            } else if (event.key === 'Backspace' && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) commit(draft);
          }}
        />
      </div>
      {error && <p className="nb-error">{error}</p>}
      {remaining.length > 0 && (
        <div className="hp-suggestions" aria-label="现有 harness">
          {remaining.map((name) => (
            <button
              key={name}
              type="button"
              className="hp-suggest"
              onClick={() => {
                setError(null);
                setDraft('');
                onChange([...value, name]);
                inputRef.current?.focus();
              }}
            >
              <Icon name="plus" size={10} />
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 新增厂商（带首个模型）或给现有厂商新增模型。校验规则与服务端同一份。 */
export function AddEntryDialog({
  mode,
  family,
  families,
  models,
  suggestions,
  onClose,
  onSubmit,
}: {
  mode: 'family' | 'model';
  /** model 模式下所属厂商 */
  family?: string;
  families: string[];
  models: string[];
  suggestions: string[];
  onClose: () => void;
  /** 返回 null 表示成功（父组件负责关闭），否则是给人看的错误 */
  onSubmit: (op: CatalogOp) => Promise<string | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const [familyName, setFamilyName] = useState('');
  const [modelName, setModelName] = useState('');
  const [harnesses, setHarnesses] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
    firstRef.current?.focus();
  }, []);

  const familyError = mode === 'family' ? validateCatalogId(familyName, '厂商名', families) : null;
  const modelError = validateCatalogId(modelName, '模型名', models);
  const harnessError = validateHarnesses(harnesses);
  const showFamilyError = familyError && (submitted || familyName.length > 0);
  const showError = modelError && (submitted || modelName.length > 0);
  const showHarnessError = harnessError && submitted;

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (familyError || modelError || harnessError || saving) return;
    const op: CatalogOp =
      mode === 'family'
        ? { type: 'add-family', family: familyName, model: modelName, harnesses }
        : { type: 'add-model', family: family ?? '', model: modelName, harnesses };
    setSaving(true);
    onSubmit(op)
      .then((error) => {
        if (error) setServerError(error);
      })
      .finally(() => setSaving(false));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // 弹窗里的按键不交给管理界面的全局快捷键
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="nb cd"
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form className="nb-card" onSubmit={submit} noValidate>
        <header className="nb-head">
          <div>
            <p className="nb-kicker">{mode === 'family' ? '新增厂商' : `新增模型 · ${family}`}</p>
            <h2 className="nb-title" id={`${id}-title`}>
              {mode === 'family' ? '厂商 + 首个模型' : `给 ${family} 加一个模型`}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭" disabled={saving}>
            <Icon name="close" size={14} />
          </button>
        </header>

        {mode === 'family' && (
          <div className="nb-field">
            <label className="nb-label" htmlFor={`${id}-family`}>
              厂商名
            </label>
            <input
              ref={firstRef}
              id={`${id}-family`}
              className={cx('nb-input-title cd-mono', showFamilyError && 'is-invalid')}
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value.trim())}
              placeholder="如 qwen、mistral"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={showFamilyError ? true : undefined}
            />
            {showFamilyError ? (
              <p className="nb-error">{familyError}</p>
            ) : (
              <p className="nb-hint">会成为产出目录 benchmarks/&lt;项目&gt;/{familyName || '<厂商>'}/… 的一段。</p>
            )}
          </div>
        )}

        <div className="nb-field">
          <label className="nb-label" htmlFor={`${id}-model`}>
            {mode === 'family' ? '首个模型名' : '模型名'}
          </label>
          <div className={cx('nb-path', showError && 'is-invalid')}>
            <span className="nb-path-fix">{mode === 'family' ? `${familyName || '<厂商>'}/` : `${family}/`}</span>
            <input
              ref={mode === 'model' ? firstRef : undefined}
              id={`${id}-model`}
              className="nb-input"
              value={modelName}
              onChange={(event) => setModelName(event.target.value.trim())}
              placeholder="如 3-max、v5-flash"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={showError ? true : undefined}
            />
          </div>
          {showError && <p className="nb-error">{modelError}</p>}
        </div>

        <div className="nb-field">
          <span className="nb-label">可用的 harness</span>
          <HarnessPicker value={harnesses} onChange={setHarnesses} suggestions={suggestions} />
          {showHarnessError ? (
            <p className="nb-error">{harnessError}</p>
          ) : (
            <p className="nb-hint">点下面的现有 harness 快速添加，也可以输入新名字。</p>
          )}
        </div>

        {serverError && (
          <p className="nb-server-error" role="alert">
            <Icon name="alert" size={14} />
            {serverError}
          </p>
        )}

        <footer className="nb-foot">
          <span className="nb-foot-note">写入 catalog.txt，注释与顺序保留</span>
          <div className="nb-actions">
            <button type="button" className="btn btn-sm" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <span className="btn-label">{saving ? '写入中…' : '添加'}</span>
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

/** 危险操作确认：删除、以及会让已有产出落到清单外的重命名。 */
export function ConfirmDialog({
  title,
  lines,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  lines: ReactNode[];
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
    // 默认焦点落在「取消」上，回车不会误删
    cancelRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="nb cd cd-confirm"
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="nb-card">
        <header className="nb-head">
          <div>
            <p className="nb-kicker cd-danger-kicker">请确认</p>
            <h2 className="nb-title" id={`${id}-title`}>
              {title}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭" disabled={busy}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className="cd-confirm-lines">
          {lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <footer className="nb-foot">
          <span className="nb-foot-note">撤销可以恢复这一步</span>
          <div className="nb-actions">
            <button ref={cancelRef} type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={onConfirm} disabled={busy}>
              <Icon name="trash" size={13} />
              {busy ? '写入中…' : confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}