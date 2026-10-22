import React from 'react';
import { Play, Trophy, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { HighScoreEntry } from '../game/types';

interface StartOverlayProps {
  bestScore: number;
  highScores: HighScoreEntry[];
  muted: boolean;
  onStart: () => void;
  onOpenScores: () => void;
  onToggleMute: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({
  bestScore,
  muted,
  onStart,
  onOpenScores,
  onToggleMute,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Brand pill + Leaderboard & Sound */}
      <div className="pointer-events-auto flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white/90 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-slate-800 shadow-[0_3px_0_#0F172A] backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>PIER 7 BICYCLE CLUB</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenScores}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-amber-300 px-3.5 py-2 text-sm font-extrabold text-slate-900 shadow-[0_3px_0_#0F172A] transition hover:bg-amber-200 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">High Scores</span>
            {bestScore > 0 && (
              <span className="rounded-md bg-slate-900/15 px-1.5 py-0.5 text-xs tabular-nums">
                {bestScore.toLocaleString()}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-white/90 text-slate-900 shadow-[0_3px_0_#0F172A] transition hover:bg-white active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-rose-500" />
            ) : (
              <Volume2 className="h-5 w-5 text-sky-600" />
            )}
          </button>
        </div>
      </div>

      {/* Center Hero Card (positioned slightly upper-center so live pedaling pelican shines below!) */}
      <div className="mx-auto my-auto flex w-full max-w-md flex-col items-center pb-14 text-center sm:pb-20">
        {/* Coastal Signage Title Plaque */}
        <div className="animate-float-slow mb-4 flex flex-col items-center">
          <div className="mb-2 inline-block -rotate-2 rounded-full border-2 border-slate-900 bg-rose-500 px-3.5 py-0.5 text-xs font-extrabold tracking-widest text-white uppercase shadow-[0_3px_0_#0F172A]">
            Boardwalk Fish Run
          </div>
          <h1
            className="font-display text-5xl leading-none font-bold tracking-tight text-white uppercase sm:text-6xl"
            style={{
              WebkitTextStroke: '3px #0F172A',
              textShadow: '0 6px 0 #0F172A',
            }}
          >
            Pelican Pedal
          </h1>
        </div>

        {/* Frosted Coastal Info & CTA Card */}
        <div className="pointer-events-auto w-full rounded-3xl border-[3px] border-slate-900 bg-white/90 p-5 shadow-[0_8px_0_#0F172A] backdrop-blur-md sm:p-6">
          <p className="mb-4 text-sm font-semibold text-slate-700 sm:text-base">
            Gulp sardines to puff your pouch, bounce off cafe awnings, and stick
            backflips for <span className="font-extrabold text-amber-600">Pelican Zoomies!</span>
          </p>

          {/* Compact Dual-Input How-To-Play Pills */}
          <div className="mb-5 grid grid-cols-2 gap-2.5 text-left">
            <div className="rounded-2xl border-2 border-slate-200 bg-sky-50/90 p-2.5">
              <div className="text-[11px] font-extrabold tracking-wider text-sky-700 uppercase">
                Space / Left Tap
              </div>
              <div className="mt-0.5 text-xs font-bold text-slate-800">
                Bunny Hop &amp; Hold in Air to Backflip
              </div>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-amber-50/90 p-2.5">
              <div className="text-[11px] font-extrabold tracking-wider text-amber-700 uppercase">
                Down / Right Tap
              </div>
              <div className="mt-0.5 text-xs font-bold text-slate-800">
                Aero-Tuck Duck &amp; Mid-Air Slam
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="animate-pulse-glow group flex w-full items-center justify-center gap-3 rounded-2xl border-[3px] border-slate-900 bg-gradient-to-b from-emerald-400 to-emerald-500 px-6 py-3.5 text-slate-950 shadow-[0_5px_0_#0F172A] transition hover:from-emerald-300 hover:to-emerald-400 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <Play className="h-6 w-6 fill-slate-950 transition-transform group-hover:scale-110" />
            <span className="font-display text-2xl font-bold tracking-wide uppercase">
              Ride the Pier!
            </span>
          </button>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <span>Press Space or Tap to start</span>
            {bestScore > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600 tabular-nums">
                  Record: {bestScore.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom subtle spacer so live pelican riding below has room */}
      <div className="h-2" />
    </div>
  );
};
