import React, { useState } from 'react';
import { Trophy, X, Trash2 } from 'lucide-react';
import { HighScoreEntry } from '../game/types';
import { loadRiderTag, saveRiderTag } from '../game/storage';

interface HighScoresModalProps {
  open: boolean;
  scores: HighScoreEntry[];
  onClose: () => void;
  onResetScores: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  open,
  scores,
  onClose,
  onResetScores,
}) => {
  const [defaultTag, setDefaultTag] = useState(loadRiderTag());
  const [confirmClear, setConfirmClear] = useState(false);

  if (!open) return null;

  const handleTagUpdate = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
    setDefaultTag(clean);
    if (clean.length > 0) {
      saveRiderTag(clean);
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-md rounded-3xl border-[3px] border-slate-900 bg-white p-5 shadow-[0_8px_0_#0F172A] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-amber-300">
              <Trophy className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h2 className="font-display text-2xl leading-none font-bold text-slate-900 uppercase">
                Pier Leaderboard
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Top 5 Local Boardwalk Runs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close High Scores"
            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-900 bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Rider Tag Setting */}
        <div className="mb-3 flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-sky-50 px-3.5 py-2">
          <span className="text-xs font-bold text-slate-700">
            Your Arcade Rider Tag
          </span>
          <input
            type="text"
            value={defaultTag}
            maxLength={3}
            onChange={(e) => handleTagUpdate(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="PEL"
            className="w-16 rounded-lg border-2 border-slate-900 bg-white px-2 py-1 text-center font-display text-sm font-bold tracking-widest text-slate-900 uppercase focus:bg-amber-100 focus:outline-none"
          />
        </div>

        {/* Scores List */}
        {scores.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-8 text-center text-sm font-semibold text-slate-500">
            No runs recorded yet — hit the boardwalk to claim #1!
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between rounded-2xl border-2 px-3.5 py-2.5 ${
                  idx === 0
                    ? 'border-slate-900 bg-amber-200/85'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold ${
                      idx === 0
                        ? 'bg-slate-900 text-amber-300'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-600/25 text-amber-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold tracking-wider text-slate-900 uppercase">
                        {entry.tag}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {entry.date}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 tabular-nums">
                      {entry.distance}m • {entry.fish} fish • {entry.flips} flips
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    {entry.bestCombo}x Max
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {scores.length > 0 ? (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetScores();
                    setConfirmClear(false);
                  }}
                  className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Reset Board</span>
              </button>
            )
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-slate-900 bg-sky-400 px-5 py-2 font-display text-sm font-bold text-slate-950 uppercase shadow-[0_3px_0_#0F172A] hover:bg-sky-300 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
