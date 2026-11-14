import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CatalogFamily } from '../src/types.ts';
import type { CatalogOp } from '../src/shared/catalog.ts';
import { validateCatalogId, validateHarnesses } from '../src/shared/catalog.ts';
import type { CatalogResult } from './catalog.ts';
import { parseCatalogText } from './catalog.ts';

/**
 * catalog.txt 的编辑器：把文件拆成「条目行」和「其余行」（注释、空行、写坏的行），
 * 只改写需要动的条目行，其余原样保留，写回时顺序不变。
 *
 * 撤销是单步的：每次写入记下 before/after，撤销前比对文件当前内容，
 * 期间被手工改过就拒绝，不会盖掉别人的改动。
 */

type EntryLine = {
  kind: 'entry';
  family: string;
  model: string;
  harnesses: string[];
  /** harness 列表在原文件里的起始列，写回时尽量保持对齐 */
  column: number;
};
type OtherLine = { kind: 'other'; text: string };
type Line = EntryLine | OtherLine;

export type CatalogEditResult =
  | { ok: true; catalog: CatalogFamily[]; catalogSize: number; problems: string[]; text: string }
  | { ok: false; error: string };

const DEFAULT_COLUMN = 22;

/** 文件可能以 CRLF  checkout（Windows autocrlf），写回时沿用原来的行尾。 */
function detectEol(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function parseLines(text: string): Line[] {
  const body = text.replace(/\r?\n$/, '');
  return body.split(/\r?\n/).map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) return { kind: 'other', text: raw };
    const match = /^(\s*)(\S+)(\s+)(\S.*)$/.exec(raw);
    if (!match) return { kind: 'other', text: raw };
    const [, lead, key, gap, rest] = match;
    const segments = key.split('/');
    if (segments.length !== 2 || !segments[0] || !segments[1]) return { kind: 'other', text: raw };
    const harnesses = rest.split(',').map((item) => item.trim()).filter(Boolean);
    if (harnesses.length === 0) return { kind: 'other', text: raw };
    return {
      kind: 'entry',
      family: segments[0],
      model: segments[1],
      harnesses,
      column: lead.length + key.length + gap.length,
    };
  });
}

/** 文件里最常见的 harness 起始列；新行跟它对齐，没有条目时用默认列。 */
function dominantColumn(lines: Line[]): number {
  const counts = new Map<number, number>();
  for (const line of lines) {
    if (line.kind !== 'entry') continue;
    counts.set(line.column, (counts.get(line.column) ?? 0) + 1);
  }
  let best = DEFAULT_COLUMN;
  let bestCount = 0;
  for (const [column, count] of counts) {
    if (count > bestCount) {
      best = column;
      bestCount = count;
    }
  }
  return best;
}

function serialize(lines: Line[], eol: string): string {
  return (
    lines
      .map((line) => {
        if (line.kind === 'other') return line.text;
        const key = `${line.family}/${line.model}`;
        const gap = ' '.repeat(Math.max(1, line.column - key.length));
        return `${key}${gap}${line.harnesses.join(', ')}`;
      })
      .join(eol) + eol
  );
}

function entriesOf(lines: Line[]): EntryLine[] {
  return lines.filter((line): line is EntryLine => line.kind === 'entry');
}

function familyIds(entries: EntryLine[]): string[] {
  const ids: string[] = [];
  for (const entry of entries) {
    if (!ids.includes(entry.family)) ids.push(entry.family);
  }
  return ids;
}

function findModel(entries: EntryLine[], family: string, model: string): EntryLine | undefined {
  return entries.find((entry) => entry.family === family && entry.model === model);
}

/** 按新的厂商顺序重排条目，再填回原来的条目行位置（注释、空行不动）。 */
function reorderEntries(lines: Line[], entries: EntryLine[], order: string[]): Line[] {
  const byFamily = new Map<string, EntryLine[]>();
  for (const entry of entries) {
    const list = byFamily.get(entry.family) ?? [];
    list.push(entry);
    byFamily.set(entry.family, list);
  }
  const reordered = order.flatMap((family) => byFamily.get(family) ?? []);
  let index = 0;
  return lines.map((line) => (line.kind === 'entry' ? reordered[index++] : line));
}

function fail(error: string): CatalogEditResult {
  return { ok: false, error };
}

/** 对清单原文应用一次编辑；只做校验和文本变换，不碰磁盘。 */
export function applyOp(text: string, op: CatalogOp): CatalogEditResult {
  const lines = parseLines(text);
  const entries = entriesOf(lines);
  const families = familyIds(entries);
  const column = dominantColumn(lines);
  const eol = detectEol(text);

  switch (op.type) {
    case 'add-family': {
      const familyError = validateCatalogId(op.family, '厂商名', families);
      if (familyError) return fail(familyError);
      const modelError = validateCatalogId(op.model, '模型名');
      if (modelError) return fail(modelError);
      const harnessError = validateHarnesses(op.harnesses);
      if (harnessError) return fail(harnessError);
      lines.push({
        kind: 'entry',
        family: op.family,
        model: op.model,
        harnesses: [...op.harnesses],
        column,
      });
      break;
    }
    case 'rename-family': {
      if (!families.includes(op.family)) return fail(`厂商「${op.family}」不在清单里`);
      if (op.to === op.family) return fail('新名字和原来一样');
      const error = validateCatalogId(op.to, '厂商名', families);
      if (error) return fail(error);
      for (const entry of entries) {
        if (entry.family === op.family) entry.family = op.to;
      }
      break;
    }
    case 'remove-family': {
      if (!families.includes(op.family)) return fail(`厂商「${op.family}」不在清单里`);
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (line.kind === 'entry' && line.family === op.family) lines.splice(i, 1);
      }
      break;
    }
    case 'move-family': {
      const index = families.indexOf(op.family);
      if (index === -1) return fail(`厂商「${op.family}」不在清单里`);
      const target = index + op.dir;
      if (target < 0 || target >= families.length) {
        return fail(op.dir < 0 ? '已经在最前面了' : '已经在最后面了');
      }
      const order = [...families];
      [order[index], order[target]] = [order[target], order[index]];
      return finish(reorderEntries(lines, entries, order), eol);
    }
    case 'add-model': {
      if (!families.includes(op.family)) return fail(`厂商「${op.family}」不在清单里`);
      const siblings = entries.filter((entry) => entry.family === op.family).map((entry) => entry.model);
      const error = validateCatalogId(op.model, '模型名', siblings);
      if (error) return fail(error);
      const harnessError = validateHarnesses(op.harnesses);
      if (harnessError) return fail(harnessError);
      const entry: EntryLine = {
        kind: 'entry',
        family: op.family,
        model: op.model,
        harnesses: [...op.harnesses],
        column,
      };
      let last = -1;
      lines.forEach((line, index) => {
        if (line.kind === 'entry' && line.family === op.family) last = index;
      });
      lines.splice(last + 1, 0, entry);
      break;
    }
    case 'rename-model': {
      const entry = findModel(entries, op.family, op.model);
      if (!entry) return fail(`模型「${op.family}/${op.model}」不在清单里`);
      if (op.to === op.model) return fail('新名字和原来一样');
      const siblings = entries.filter((item) => item.family === op.family).map((item) => item.model);
      const error = validateCatalogId(op.to, '模型名', siblings);
      if (error) return fail(error);
      entry.model = op.to;
      break;
    }
    case 'remove-model': {
      const entry = findModel(entries, op.family, op.model);
      if (!entry) return fail(`模型「${op.family}/${op.model}」不在清单里`);
      lines.splice(lines.indexOf(entry), 1);
      break;
    }
    case 'move-model': {
      const entry = findModel(entries, op.family, op.model);
      if (!entry) return fail(`模型「${op.family}/${op.model}」不在清单里`);
      const siblings = lines.filter(
        (line): line is EntryLine => line.kind === 'entry' && line.family === op.family,
      );
      const index = siblings.indexOf(entry);
      const target = index + op.dir;
      if (target < 0 || target >= siblings.length) {
        return fail(op.dir < 0 ? '已经是这个厂商的第一个模型了' : '已经是这个厂商的最后一个模型了');
      }
      const other = siblings[target];
      const a = lines.indexOf(entry);
      const b = lines.indexOf(other);
      [lines[a], lines[b]] = [lines[b], lines[a]];
      break;
    }
    case 'set-harnesses': {
      const entry = findModel(entries, op.family, op.model);
      if (!entry) return fail(`模型「${op.family}/${op.model}」不在清单里`);
      const error = validateHarnesses(op.harnesses);
      if (error) return fail(error);
      entry.harnesses = [...op.harnesses];
      break;
    }
  }
  return finish(lines, eol);
}

function finish(lines: Line[], eol: string): CatalogEditResult {
  const text = serialize(lines, eol);
  const parsed: CatalogResult = parseCatalogText(text);
  return { ok: true, catalog: parsed.catalog, catalogSize: parsed.size, problems: parsed.problems, text };
}

/**
 * 撤销快照挂在 globalThis 上：改 vite.config 触发的服务器重启不会丢掉上一步。
 * 只记最近一次写入；撤销前要求文件内容仍等于写入后的样子。
 */
type UndoSnapshot = { path: string; before: string; after: string };
type CatalogGlobal = typeof globalThis & { __benchCatalogUndo?: UndoSnapshot };

function catalogPath(repoRoot: string): string {
  return join(repoRoot, 'benchmarks', 'catalog.txt');
}

export function mutateCatalog(repoRoot: string, op: CatalogOp): CatalogEditResult {
  const path = catalogPath(repoRoot);
  let before: string;
  try {
    before = readFileSync(path, 'utf8');
  } catch (error) {
    return fail(`读不到 catalog.txt：${error instanceof Error ? error.message : String(error)}`);
  }
  const result = applyOp(before, op);
  if (!result.ok) return result;
  try {
    writeFileSync(path, result.text, 'utf8');
  } catch (error) {
    return fail(`写入 catalog.txt 失败：${error instanceof Error ? error.message : String(error)}`);
  }
  (globalThis as CatalogGlobal).__benchCatalogUndo = { path, before, after: result.text };
  return result;
}

export function undoCatalog(repoRoot: string): CatalogEditResult {
  const path = catalogPath(repoRoot);
  const snapshot = (globalThis as CatalogGlobal).__benchCatalogUndo;
  if (!snapshot || snapshot.path !== path) return fail('没有可撤销的改动');
  let current: string;
  try {
    current = readFileSync(path, 'utf8');
  } catch (error) {
    return fail(`读不到 catalog.txt：${error instanceof Error ? error.message : String(error)}`);
  }
  if (current !== snapshot.after) {
    return fail('catalog.txt 在上次改动后又被修改过，无法撤销');
  }
  try {
    writeFileSync(path, snapshot.before, 'utf8');
  } catch (error) {
    return fail(`写入 catalog.txt 失败：${error instanceof Error ? error.message : String(error)}`);
  }
  delete (globalThis as CatalogGlobal).__benchCatalogUndo;
  const parsed = parseCatalogText(snapshot.before);
  return {
    ok: true,
    catalog: parsed.catalog,
    catalogSize: parsed.size,
    problems: parsed.problems,
    text: snapshot.before,
  };
}