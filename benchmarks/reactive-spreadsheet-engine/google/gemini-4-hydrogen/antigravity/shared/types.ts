export const DEFAULT_ROWS = 25;
export const DEFAULT_COLS = 12;

export type SpreadsheetErrorCode = '#DIV/0!' | '#REF!' | '#VALUE!' | '#CYCLE!';

export type CellValueType = 'empty' | 'number' | 'text' | 'error';

export interface CellCoord {
  col: number;
  row: number;
}

export interface GridDimensions {
  rows: number;
  cols: number;
}

export interface CellSnapshot {
  id: string;
  raw: string;
  isFormula: boolean;
  valueType: CellValueType;
  computed: number | string | null;
  display: string;
  error: SpreadsheetErrorCode | null;
  errorDetail: string | null;
  inCycle: boolean;
  cyclePath: string[] | null;
  dependencies: string[];
  dependents: string[];
}

export interface PersistedCell {
  raw: string;
  valueType: CellValueType;
  computed: number | string | null;
  display: string;
  error: SpreadsheetErrorCode | null;
  inCycle: boolean;
}

export interface WorkbookData {
  id: string;
  name: string;
  rows: number;
  cols: number;
  revision: number;
  updatedAt: string;
  cells: Record<string, PersistedCell>;
}

export interface RecalcResult {
  changedIds: string[];
  recalculatedIds: string[];
  cycleCells: string[];
  durationMs: number;
}
