import React, { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, Crown } from 'lucide-react';
import { HighScoreEntry, HudSnapshot } from '../game/types';
import { loadRiderTag } from '../game/storage';

interface GameOverModalProps {
  hud: HudSnapshot;
  highScores: HighScoreEntry[];
  onRestart: () => void;
  onQuit: () => void;
  onUpdateTag: (runId: string, tag: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  highScores,
  onRestart,
  onQuit,
  onUpdateTag,
}) => {
  const [tagInput, setTagInput] = useState<string>(loadRiderTag());

  useEffect(() => {
    if (hud.phase === 'gameover') {
      setTagInput(loadRiderTag());
    }
  }, [hud.phase, hud.lastRunId]);

  if (hud.phase !== 'gameover') return null;

  const handleTagChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
    setTagInput(cleaned);
    if (hud.lastRunId && cleaned.length > 0) {
      onUpdateTag(hud.lastRunId, cleaned);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-900/55 p-3 backdrop-blur-sm sm:p-5">
      <div className="animate-pop-in my-auto w-full max-w-md rounded-3xl border-[3px] border-slate-900 bg-white/95 p-5 shadow-[0_8px_0_#0F172A] sm:p-6">
        {/* Header */}
        <div className="text-center">
          {hud.isNewBest ? (
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-amber-300 px-3.5 py-0.5 text-xs font-extrabold tracking-wider text-slate-900 uppercase shadow-[0_2px_0_#0F172A]">
              <Crown className="h-3.5 w-3.5 fill-amber-600 text-slate-900" />
              <span>New Pier Record!</span>
            </div>
          ) : (
            <div className="mb-1 inline-block rounded-full bg-rose-100 px-3 py-0.5 text-xs font-extrabold tracking-wider text-rose-700 uppercase">
              Wipeout!
            </div>
          )}

          <h2 className="font-display text-3xl leading-tight font-bold text-slate-900 uppercase sm:text-4xl">
            {hud.score.toLocaleString()}{' '}
            <span className="text-xl text-slate-500">pts</span>
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-600">
            {hud.crashReason || 'Tumbled off the cruiser!'}
          </p>
        </div>

        {/* Run Summary Grid */}
        <div className="my-3.5 grid grid-cols-4 gap-2 rounded-2xl border-2 border-slate-200 bg-sky-50/75 p-2.5 text-center">
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Dist
            </div>
            <div className="font-display text-base font-bold text-slate-900 tabular-nums sm:text-lg">
              {hud.distance}m
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Fish
            </div>
            <div className="font-display text-base font-bold text-sky-600 tabular-nums sm:text-lg">
              {hud.fishCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Flips
            </div>
            <div className="font-display text-base font-bold text-emerald-600 tabular-nums sm:text-lg">
              {hud.flipsCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Combo
            </div>
            <div className="font-display text-base font-bold text-amber-600 tabular-nums sm:text-lg">
              {hud.bestCombo}x
            </div>
          </div>
        </div>

        {/* Local High-Score Table */}
        <div className="mb-4 rounded-2xl border-2 border-slate-900 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-slate-800 uppercase">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Local Pier Top 5</span>
            </div>

            {hud.lastRunId && (
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <span>Your Tag:</span>
                <input
                  type="text"
                  value={tagInput}
                  maxLength={3}
                  onChange={(e) => handleTagChange(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-12 rounded-md border-2 border-slate-900 bg-amber-200 px-1.5 py-0.5 text-center font-display text-xs font-bold tracking-widest text-slate-900 uppercase focus:bg-white focus:outline-none"
                />
              </label>
            )}
          </div>

          <div className="space-y-1">
            {highScores.map((entry, idx) => {
              const isCurrentRun = entry.id === hud.lastRunId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                    isCurrentRun
                      ? 'border-2 border-slate-900 bg-amber-300 text-slate-950 shadow-[0_2px_0_#0F172A]'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold ${
                        idx === 0
                          ? 'bg-slate-900 text-amber-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-display text-sm tracking-wider uppercase">
                      {entry.tag}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                      {entry.distance}m • {entry.fish} fish
                    </span>
                  </div>

                  <span className="font-display text-sm font-bold text-slate-900 tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instant Replay & Home Actions */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onQuit}
            title="Back to Title"
            aria-label="Back to Title"
            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-slate-100 text-slate-800 shadow-[0_4px_0_#0F172A] transition hover:bg-slate-200 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Home className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border-2 border-slate-900 bg-gradient-to-b from-emerald-400 to-emerald-500 py-3 font-display text-xl font-bold text-slate-950 uppercase shadow-[0_4px_0_#0F172A] transition hover:from-emerald-300 hover:to-emerald-400 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <RotateCcw className="h-5 w-5 stroke-[2.6]" />
            <span>Ride Again!</span>
          </button>
        </div>

        <div className="mt-2 text-center text-[11px] font-bold text-slate-400">
          Press Space or R for instant restart
        </div>
      </div>
    </div>
  );
};
