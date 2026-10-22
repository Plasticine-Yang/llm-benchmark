import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PelicanGameEngine } from './game/engine';
import { sound } from './game/sound';
import {
  clearHighScores,
  loadHighScores,
  updateScoreTag,
} from './game/storage';
import { HighScoreEntry, HudSnapshot } from './game/types';
import { StartOverlay } from './components/StartOverlay';
import { HudOverlay } from './components/HudOverlay';
import { PauseOverlay } from './components/PauseOverlay';
import { GameOverModal } from './components/GameOverModal';
import { HighScoresModal } from './components/HighScoresModal';

const INITIAL_HUD: HudSnapshot = {
  phase: 'start',
  score: 0,
  bestScore: 0,
  distance: 0,
  fishCount: 0,
  flipsCount: 0,
  combo: 1,
  bestCombo: 1,
  comboTimerRatio: 0,
  pouchFill: 0,
  pouchMax: 8,
  feverActive: false,
  feverRatio: 0,
  speedKmh: 28,
  isNewBest: false,
  crashReason: '',
  lastRunId: null,
};

interface ActivePointerInfo {
  role: 'jump' | 'tuck';
  startY: number;
  swipedDown: boolean;
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PelicanGameEngine | null>(null);
  const pointersRef = useRef<Map<number, ActivePointerInfo>>(new Map());

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState<boolean>(() => sound.isMuted());
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() =>
    loadHighScores()
  );
  const [scoresModalOpen, setScoresModalOpen] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(pointer: coarse)').matches ||
      'ontouchstart' in window
    );
  });

  // Sync leaderboard whenever phase enters gameover or start
  useEffect(() => {
    if (hud.phase === 'gameover' || hud.phase === 'start') {
      setHighScores(loadHighScores());
    }
  }, [hud.phase]);

  // Initialize 60fps Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new PelicanGameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.startLoop();

    const onResize = () => engine.handleResize();
    const onVisibility = () => {
      if (document.hidden) {
        engine.pause();
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const isTypingInInput = () => {
      const el = document.activeElement;
      return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput()) return;
      const engine = engineRef.current;
      if (!engine) return;

      const code = e.code;

      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'KeyW' ||
        code === 'KeyS'
      ) {
        e.preventDefault();
      }

      if (scoresModalOpen) {
        if (code === 'Escape') {
          setScoresModalOpen(false);
        }
        return;
      }

      if (hud.phase === 'start') {
        if (code === 'Space' || code === 'Enter' || code === 'ArrowUp' || code === 'KeyW') {
          engine.startRun();
        } else if (code === 'KeyB') {
          engine.ringBell();
        }
        return;
      }

      if (hud.phase === 'paused') {
        if (code === 'Escape' || code === 'KeyP' || code === 'Space') {
          engine.resume();
        } else if (code === 'KeyR') {
          engine.startRun();
        }
        return;
      }

      if (hud.phase === 'gameover') {
        if (code === 'Space' || code === 'Enter' || code === 'KeyR') {
          engine.startRun();
        } else if (code === 'Escape') {
          engine.quitToStart();
        }
        return;
      }

      // Active 'playing' phase controls
      if (e.repeat) return;

      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        engine.setJumpInput(true);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        engine.setTuckInput(true);
      } else if (code === 'KeyB') {
        engine.ringBell();
      } else if (code === 'KeyP' || code === 'Escape') {
        engine.togglePause();
      } else if (code === 'KeyR') {
        engine.startRun();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      const code = e.code;

      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        engine.setJumpInput(false);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        engine.setTuckInput(false);
      }
    };

    const handleBlur = () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setJumpInput(false);
      engine.setTuckInput(false);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [hud.phase, scoresModalOpen]);

  // Sync active canvas pointer roles into engine inputs
  const syncPointerInputs = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    let anyJump = false;
    let anyTuck = false;
    pointersRef.current.forEach((info) => {
      if (info.role === 'jump') anyJump = true;
      if (info.role === 'tuck') anyTuck = true;
    });
    engine.setJumpInput(anyJump);
    engine.setTuckInput(anyTuck);
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') {
      setIsTouchDevice(true);
    }
    const engine = engineRef.current;
    if (!engine) return;
    if (hud.phase === 'start') {
      engine.ringBell();
      return;
    }
    if (hud.phase !== 'playing') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);

    // Right mouse button OR right-third touch zone triggers Tuck/Dive; otherwise Jump/Flip!
    const isRightZone =
      e.button === 2 || (e.pointerType === 'touch' && relX > 0.68);

    pointersRef.current.set(e.pointerId, {
      role: isRightZone ? 'tuck' : 'jump',
      startY: e.clientY,
      swipedDown: false,
    });
    syncPointerInputs();
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const info = pointersRef.current.get(e.pointerId);
    if (!info || info.swipedDown) return;

    // One-thumb swipe down anywhere converts touch into Tuck / Mid-Air Slam!
    if (e.clientY - info.startY > 36) {
      info.role = 'tuck';
      info.swipedDown = true;
      syncPointerInputs();
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.delete(e.pointerId);
      syncPointerInputs();
    }
  };

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleStartRun = useCallback(() => {
    pointersRef.current.clear();
    engineRef.current?.startRun();
  }, []);

  const handlePause = useCallback(() => {
    pointersRef.current.clear();
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleQuit = useCallback(() => {
    pointersRef.current.clear();
    engineRef.current?.quitToStart();
  }, []);

  const handleRingBell = useCallback(() => {
    engineRef.current?.ringBell();
  }, []);

  const handleUpdateTag = useCallback((runId: string, tag: string) => {
    const updated = updateScoreTag(runId, tag);
    setHighScores(updated);
  }, []);

  const handleResetScores = useCallback(() => {
    const cleared = clearHighScores();
    setHighScores(cleared);
    engineRef.current?.refreshBestScore();
  }, []);

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-sky-400 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Full-Viewport 60fps Coastal Boardwalk Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        className="block h-full w-full touch-none"
      />

      {/* Start Screen Overlay */}
      {hud.phase === 'start' && (
        <StartOverlay
          bestScore={hud.bestScore}
          highScores={highScores}
          muted={muted}
          onStart={handleStartRun}
          onOpenScores={() => setScoresModalOpen(true)}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Live Minimalist HUD */}
      <HudOverlay
        hud={hud}
        muted={muted}
        isTouchDevice={isTouchDevice}
        onToggleMute={handleToggleMute}
        onPause={handlePause}
        onRingBell={handleRingBell}
        onJumpChange={(pressed) => engineRef.current?.setJumpInput(pressed)}
        onTuckChange={(pressed) => engineRef.current?.setTuckInput(pressed)}
      />

      {/* Frosted Pause Overlay */}
      <PauseOverlay
        hud={hud}
        muted={muted}
        onResume={handleResume}
        onRestart={handleStartRun}
        onQuit={handleQuit}
        onToggleMute={handleToggleMute}
      />

      {/* Game Over Modal with Instant Restart & Top 5 Table */}
      <GameOverModal
        hud={hud}
        highScores={highScores}
        onRestart={handleStartRun}
        onQuit={handleQuit}
        onUpdateTag={handleUpdateTag}
      />

      {/* Start-Screen High Scores Drawer/Modal */}
      <HighScoresModal
        open={scoresModalOpen}
        scores={highScores}
        onClose={() => setScoresModalOpen(false)}
        onResetScores={handleResetScores}
      />
    </main>
  );
}

export default App;
