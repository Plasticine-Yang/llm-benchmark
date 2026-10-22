import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface PauseOverlayProps {
  hud: HudSnapshot;
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onToggleMute: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  hud,
  muted,
  onResume,
  onRestart,
  onQuit,
  onToggleMute,
}) => {
  if (hud.phase !== 'paused') return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm rounded-3xl border-[3px] border-slate-900 bg-white/95 p-6 text-center shadow-[0_8px_0_#0F172A]">
        <div className="mb-1 inline-block rounded-full bg-sky-100 px-3 py-0.5 text-xs font-extrabold tracking-wider text-sky-700 uppercase">
          Breather on the Pier
        </div>
        <h2 className="font-display text-3xl font-bold text-slate-900 uppercase">
          Game Paused
        </h2>

        {/* Current Run Snapshot */}
        <div className="my-4 grid grid-cols-3 gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Score
            </div>
            <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Distance
            </div>
            <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
              {hud.distance}m
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">
              Fish
            </div>
            <div className="font-display text-lg font-bold text-sky-600 tabular-nums">
              {hud.fishCount}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-emerald-400 py-3 font-display text-xl font-bold text-slate-950 uppercase shadow-[0_4px_0_#0F172A] transition hover:bg-emerald-300 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Play className="h-5 w-5 fill-slate-950" />
            <span>Resume Ride</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-amber-300 py-2.5 font-display text-lg font-bold text-slate-900 uppercase shadow-[0_4px_0_#0F172A] transition hover:bg-amber-200 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Instant Restart (R)</span>
          </button>

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-100 py-2.5 text-sm font-bold text-slate-800 shadow-[0_3px_0_#0F172A] transition hover:bg-slate-200 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4 text-rose-500" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-sky-600" />
                  <span>Sound On</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onQuit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-100 py-2.5 text-sm font-bold text-slate-800 shadow-[0_3px_0_#0F172A] transition hover:bg-slate-200 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Title</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
