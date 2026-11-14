import { useRef } from 'react';
import { formatValue } from '../../shared/engine/index.js';

export default function FormulaBar({ sheet }) {
  const { workbook, selection, editing, startEdit, updateDraft, commitEdit, cancelEdit } = sheet;
  const id = selection.focus;
  const inputRef = useRef(null);
  const draft = editing ? editing.draft : workbook.getRaw(id);

  return (
    <div className="formula-bar">
      <span className="name-box" title="Selected cell">{id}</span>
      <span className="fx" title="Formula bar">fx</span>
      <input
        ref={inputRef}
        className="formula-input"
        value={draft}
        spellCheck={false}
        placeholder="value or =FORMULA"
        onFocus={() => {
          if (!editing) startEdit(id, workbook.getRaw(id), 'bar');
        }}
        onChange={(event) => updateDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitEdit('down');
            inputRef.current?.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelEdit();
            inputRef.current?.blur();
          }
        }}
      />
      <span className="bar-result" title="Computed result of the selected cell">
        {formatValue(workbook.getValue(id)) || '—'}
      </span>
    </div>
  );
}