import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parseSpec, SPEC_FILE } from '../src/shared/launch.ts';
import type { LaunchInfo, SpecResult } from '../src/shared/launch.ts';

/** 读取并校验某个产出目录的 bench.json。 */
export function readSpec(dir: string): SpecResult | null {
  const file = join(dir, SPEC_FILE);
  if (!existsSync(file)) return null;
  let parsed: SpecResult;
  try {
    parsed = parseSpec(readFileSync(file, 'utf8'));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  if (parsed.ok && parsed.spec.kind === 'static') {
    const entry = resolve(dir, parsed.spec.entry);
    if (!entry.startsWith(resolve(dir) + sep) || !existsSync(entry) || !statSync(entry).isFile()) {
      return { ok: false, error: `entry 指向的 ${parsed.spec.entry} 不存在` };
    }
  }
  return parsed;
}

function isEmptyDir(dir: string): boolean {
  try {
    return readdirSync(dir).filter((name) => name !== '.DS_Store').length === 0;
  } catch {
    return true;
  }
}

/** manifest 里给前端看的精简版启动信息。 */
export function readLaunchInfo(dir: string): LaunchInfo {
  const result = readSpec(dir);
  if (!result) return { spec: 'missing', empty: isEmptyDir(dir) };
  if (!result.ok) return { spec: 'invalid', error: result.error };
  const { spec } = result;
  switch (spec.kind) {
    case 'static':
      return { spec: 'static', entry: spec.entry, ...(spec.notes ? { notes: spec.notes } : {}) };
    case 'process':
      return { spec: 'process', start: spec.start, ...(spec.notes ? { notes: spec.notes } : {}) };
    case 'unavailable':
      return { spec: 'unavailable', reason: spec.reason };
  }
}
