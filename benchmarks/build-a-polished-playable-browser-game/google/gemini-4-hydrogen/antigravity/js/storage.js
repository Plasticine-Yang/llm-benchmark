(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});
  const CFG = PelicanGame.CONFIG;

  const STORAGE_KEY_SCORES = 'pelican_pedal_scores_v1';
  const STORAGE_KEY_SETTINGS = 'pelican_pedal_settings_v1';
  const MAX_ENTRIES = 8;

  let memoryScores = null;
  let memorySettings = null;

  function cloneSeedScores() {
    return CFG.SEED_HIGH_SCORES.map((item) => Object.assign({}, item));
  }

  function readStorage(key) {
    try {
      return global.localStorage ? global.localStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, value);
      }
    } catch (_err) {
      // Ignore storage quota / privacy restrictions gracefully
    }
  }

  function loadSettings() {
    if (memorySettings) return memorySettings;
    const defaults = { muted: false, riderName: 'PELI', touchMode: 'auto' };
    const raw = readStorage(STORAGE_KEY_SETTINGS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        memorySettings = Object.assign(defaults, parsed);
        return memorySettings;
      } catch (_err) {
        // Fall through to defaults
      }
    }
    memorySettings = defaults;
    return memorySettings;
  }

  function saveSettings(patch) {
    const next = Object.assign(loadSettings(), patch);
    memorySettings = next;
    writeStorage(STORAGE_KEY_SETTINGS, JSON.stringify(next));
    return next;
  }

  function normalizeList(list) {
    return list
      .filter((entry) => entry && typeof entry.score === 'number' && entry.score >= 0)
      .sort((a, b) => (b.score - a.score) || ((b.distance || 0) - (a.distance || 0)))
      .slice(0, MAX_ENTRIES);
  }

  function loadScores() {
    if (memoryScores) return memoryScores.slice();
    const raw = readStorage(STORAGE_KEY_SCORES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryScores = normalizeList(parsed);
          return memoryScores.slice();
        }
      } catch (_err) {
        // Fall back to seeds
      }
    }
    memoryScores = cloneSeedScores();
    writeStorage(STORAGE_KEY_SCORES, JSON.stringify(memoryScores));
    return memoryScores.slice();
  }

  function saveScoresList(list) {
    memoryScores = normalizeList(list);
    writeStorage(STORAGE_KEY_SCORES, JSON.stringify(memoryScores));
    return memoryScores.slice();
  }

  function recordRun(run) {
    const scores = loadScores();
    const cleanName = sanitizeName(run.name || loadSettings().riderName || 'PELI');
    const id = 'run-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const entry = {
      id,
      name: cleanName,
      score: Math.max(0, Math.round(run.score || 0)),
      distance: Math.max(0, Math.round(run.distance || 0)),
      fish: Math.max(0, Math.round(run.fish || 0)),
      isSeed: false,
      createdAt: Date.now()
    };

    const previousTop = scores.length > 0 ? scores[0].score : 0;
    const combined = normalizeList(scores.concat([entry]));
    const rankIndex = combined.findIndex((item) => item.id === id);
    const madeBoard = rankIndex !== -1;

    if (madeBoard) {
      saveScoresList(combined);
    }

    return {
      entryId: id,
      madeBoard,
      rank: madeBoard ? rankIndex + 1 : null,
      isNewTop: madeBoard && rankIndex === 0 && entry.score > previousTop,
      scores: madeBoard ? combined : scores
    };
  }

  function updateEntryName(entryId, newName) {
    const clean = sanitizeName(newName);
    saveSettings({ riderName: clean });
    if (!entryId) return loadScores();
    const list = loadScores();
    let changed = false;
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].id === entryId) {
        list[i].name = clean;
        changed = true;
        break;
      }
    }
    return changed ? saveScoresList(list) : list;
  }

  function resetScores() {
    memoryScores = cloneSeedScores();
    writeStorage(STORAGE_KEY_SCORES, JSON.stringify(memoryScores));
    return memoryScores.slice();
  }

  function sanitizeName(raw) {
    const trimmed = String(raw || '').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trim();
    return (trimmed || 'PELI').slice(0, 10);
  }

  function getBestScore() {
    const list = loadScores();
    return list.length > 0 ? list[0].score : 0;
  }

  PelicanGame.Storage = {
    loadSettings,
    saveSettings,
    loadScores,
    recordRun,
    updateEntryName,
    resetScores,
    sanitizeName,
    getBestScore
  };
})(window);
