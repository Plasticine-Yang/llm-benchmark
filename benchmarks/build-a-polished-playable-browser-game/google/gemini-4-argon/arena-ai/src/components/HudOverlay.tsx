import React from 'react';
import { Bell, Pause, Volume2, VolumeX, Flame, ArrowUp, ArrowDown } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface HudOverlayProps {
  hud: HudSnapshot;
  muted: boolean;
  isTouchDevice: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRingBell: () => void;
  onJumpChange: (pressed: boolean) => void;
  onTuckChange: (pressed: boolean) => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  muted,
  isTouchDevice,
  onToggleMute,
  onPause,
  onRingBell,
  onJumpChange,
  onTuckChange,
}) => {
  if (hud.phase !== 'playing') return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left Score, Combo & Pouch Gauge */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            {/* Main Score Card */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white/90 px-3.5 py-1.5 shadow-[0_4px_0_#0F172A] backdrop-blur-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                  {hud.score.toLocaleString()}
                </span>
                {hud.isNewBest && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-slate-900 uppercase">
                    New Best!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 tabular-nums">
                <span>{hud.distance}m</span>
                <span className="text-slate-300">•</span>
                <span className="text-sky-700">{hud.fishCount} Fish</span>
              </div>
            </div>

            {/* Active Combo Multiplier Pill */}
            {hud.combo > 1 && (
              <div className="animate-pop-in flex flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-gradient-to-b from-amber-300 to-amber-400 px-3 py-1.5 shadow-[0_4px_0_#0F172A]">
                <span className="font-display text-xl leading-none font-bold text-slate-900 tabular-nums sm:text-2xl">
                  {hud.combo}x
                </span>
                <span className="text-[10px] font-extrabold tracking-wider text-amber-950 uppercase">
                  Combo
                </span>
                <div className="mt-1 h-1.5 w-12 overflow-hidden rounded-full bg-amber-950/25">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-[width] duration-75"
                    style={{ width: `${Math.round(hud.comboTimerRatio * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pelican Pouch / Zoomies Fever Bar */}
          <div className="w-fit rounded-xl border-2 border-slate-900 bg-slate-900/80 px-2.5 py-1.5 text-white shadow-md backdrop-blur-sm">
            {hud.feverActive ? (
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 animate-bounce text-amber-300" />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-none font-extrabold tracking-wider text-amber-300 uppercase">
                    Pelican Zoomies! 2x
                  </span>
                  <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 transition-[width] duration-75"
                      style={{ width: `${Math.round(hud.feverRatio * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-300 uppercase">
                  Pouch
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hud.pouchMax }).map((_, idx) => {
                    const filled = idx < hud.pouchFill;
                    return (
                      <span
                        key={idx}
                        className={`h-2.5 w-3 rounded-sm transition-all duration-150 ${
                          filled
                            ? 'scale-105 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                            : 'bg-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onRingBell();
            }}
            title="Ring Bicycle Bell (B)"
            aria-label="Ring Bicycle Bell"
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-amber-300 text-slate-900 shadow-[0_3px_0_#0F172A] transition active:translate-y-0.5 active:shadow-none hover:bg-amber-200 cursor-pointer"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-white/90 text-slate-900 shadow-[0_3px_0_#0F172A] transition active:translate-y-0.5 active:shadow-none hover:bg-white cursor-pointer"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-rose-500" />
            ) : (
              <Volume2 className="h-5 w-5 text-sky-600" />
            )}
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPause();
            }}
            title="Pause Game (P)"
            aria-label="Pause Game"
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-white/90 text-slate-900 shadow-[0_3px_0_#0F172A] transition active:translate-y-0.5 active:shadow-none hover:bg-white cursor-pointer"
          >
            <Pause className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bottom Touch Controls / Subtle Desktop Hint */}
      <div className="flex items-end justify-between">
        {isTouchDevice ? (
          <>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                onJumpChange(true);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onJumpChange(false);
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onJumpChange(false);
              }}
              className="pointer-events-auto flex h-20 w-36 flex-col items-center justify-center rounded-2xl border-2 border-slate-900/80 bg-white/75 text-slate-900 shadow-[0_4px_0_rgba(15,23,42,0.75)] backdrop-blur-sm active:translate-y-1 active:bg-amber-200/90 active:shadow-none sm:w-44"
            >
              <ArrowUp className="h-6 w-6 stroke-[2.8]" />
              <span className="font-display text-sm font-bold tracking-wide uppercase">
                Hop / Flip
              </span>
              <span className="text-[10px] font-semibold text-slate-600">
                Hold in air to spin
              </span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                onTuckChange(true);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onTuckChange(false);
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onTuckChange(false);
              }}
              className="pointer-events-auto flex h-20 w-36 flex-col items-center justify-center rounded-2xl border-2 border-slate-900/80 bg-white/75 text-slate-900 shadow-[0_4px_0_rgba(15,23,42,0.75)] backdrop-blur-sm active:translate-y-1 active:bg-sky-200/90 active:shadow-none sm:w-44"
            >
              <ArrowDown className="h-6 w-6 stroke-[2.8]" />
              <span className="font-display text-sm font-bold tracking-wide uppercase">
                Tuck / Slam
              </span>
              <span className="text-[10px] font-semibold text-slate-600">
                Duck or stomp dive
              </span>
            </button>
          </>
        ) : (
          hud.distance < 85 && (
            <div className="mx-auto mb-1 rounded-full border border-slate-900/30 bg-slate-900/65 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-opacity">
              <span className="text-amber-300">Space / W / Up</span>: Hop & Hold
              for Backflip <span className="mx-2 opacity-40">|</span>
              <span className="text-sky-300">Down / S</span>: Aero Tuck & Air
              Slam <span className="mx-2 opacity-40">|</span>
              <span className="text-amber-200">B</span>: Bell
            </div>
          )
        )}
      </div>
    </div>
  );
};
