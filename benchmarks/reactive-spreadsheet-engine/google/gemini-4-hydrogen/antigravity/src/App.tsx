import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Toolbar } from './components/Toolbar.js';
import { FormulaBar } from './components/FormulaBar.js';
import { SpreadsheetGrid } from './components/SpreadsheetGrid.js';
import { InspectorPanel } from './components/InspectorPanel.js';
import { useSpreadsheet } from './hooks/useSpreadsheet.js';

export function App() {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const sheet = useSpreadsheet();

  const returnFocusToGrid = useCallback(() => {
    requestAnimationFrame(() => {
      gridContainerRef.current?.focus();
    });
  }, []);

  // Global Undo/Redo handler when not actively typing inside an input
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (target && gridContainerRef.current?.contains(target)) {
        // SpreadsheetGrid handles its own keydown when focused
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      const lower = e.key.toLowerCase();
      if (lower === 'z') {
        e.preventDefault();
        if (e.shiftKey) sheet.redo();
        else sheet.undo();
      } else if (lower === 'y') {
        e.preventDefault();
        sheet.redo();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [sheet]);

  // Focus the grid on initial mount for immediate keyboard navigation
  useEffect(() => {
    gridContainerRef.current?.focus();
  }, []);

  const directRefList = useMemo(
    () => Array.from(sheet.directReferences),
    [sheet.directReferences]
  );
  const indirectRefList = useMemo(
    () => Array.from(sheet.indirectReferences),
    [sheet.indirectReferences]
  );
  const directDepList = useMemo(
    () => Array.from(sheet.directDependents),
    [sheet.directDependents]
  );
  const indirectDepList = useMemo(
    () => Array.from(sheet.indirectDependents),
    [sheet.indirectDependents]
  );

  return (
    <div className="app-shell">
      <Toolbar
        rows={sheet.rows}
        cols={sheet.cols}
        revision={sheet.revision}
        syncStatus={sheet.syncStatus}
        syncError={sheet.syncError}
        undoCount={sheet.undoStack.length}
        redoCount={sheet.redoStack.length}
        activeCellsCount={sheet.activeCellsCount}
        onUndo={() => {
          sheet.undo();
          returnFocusToGrid();
        }}
        onRedo={() => {
          sheet.redo();
          returnFocusToGrid();
        }}
        onClear={() => {
          sheet.clearWorkbook();
          returnFocusToGrid();
        }}
        onLoadSample={() => {
          sheet.loadSampleWorkbook();
          returnFocusToGrid();
        }}
        onRetrySync={() => {
          void sheet.reloadFromBackend();
        }}
      />

      <FormulaBar
        activeId={sheet.activeId}
        selectionRect={sheet.selectionRect}
        snapshot={sheet.activeSnapshot}
        isEditing={sheet.editingCell === sheet.activeId}
        draftValue={sheet.draftValue}
        onDraftChange={sheet.setDraftValue}
        onStartEdit={() => sheet.startEditing(sheet.activeId)}
        onCommit={sheet.commitEdit}
        onCancel={sheet.cancelEdit}
        onReturnFocusToGrid={returnFocusToGrid}
      />

      <main className="workspace">
        <SpreadsheetGrid
          gridContainerRef={gridContainerRef}
          rows={sheet.rows}
          cols={sheet.cols}
          columnLabels={sheet.columnLabels}
          activeCell={sheet.activeCell}
          activeId={sheet.activeId}
          selectionRect={sheet.selectionRect}
          editingCell={sheet.editingCell}
          draftValue={sheet.draftValue}
          directReferences={sheet.directReferences}
          indirectReferences={sheet.indirectReferences}
          directDependents={sheet.directDependents}
          indirectDependents={sheet.indirectDependents}
          getCellSnapshot={sheet.getCellSnapshot}
          onDraftChange={sheet.setDraftValue}
          onSelectCoord={sheet.selectCoord}
          onStartEdit={sheet.startEditing}
          onCommit={sheet.commitEdit}
          onCancel={sheet.cancelEdit}
          onDeleteSelection={sheet.deleteSelection}
          onCopy={sheet.copySelection}
          onPaste={sheet.pasteAtSelection}
          onUndo={sheet.undo}
          onRedo={sheet.redo}
        />

        <InspectorPanel
          activeId={sheet.activeId}
          snapshot={sheet.activeSnapshot}
          directReferences={directRefList}
          indirectReferences={indirectRefList}
          directDependents={directDepList}
          indirectDependents={indirectDepList}
          getCellSnapshot={sheet.getCellSnapshot}
          lastRecalc={sheet.lastRecalc}
          lastActionLabel={sheet.lastActionLabel}
          undoStack={sheet.undoStack}
          redoStack={sheet.redoStack}
          onJumpToCell={(id) => {
            sheet.selectCellById(id);
            returnFocusToGrid();
          }}
        />
      </main>
    </div>
  );
}

export default App;
