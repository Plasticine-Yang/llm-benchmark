import { HighScoreEntry } from './types';

const SCORES_KEY = 'pelican_pedal_high_scores_v1';
const MUTE_KEY = 'pelican_pedal_muted_v1';
const TAG_KEY = 'pelican_pedal_rider_tag_v1';

const DEFAULT_SCORES: HighScoreEntry[] = [
  {
    id: 'seed-1',
    tag: 'CAP',
    score: 4250,
    distance: 640,
    fish: 38,
    flips: 6,
    bestCombo: 5,
    date: 'Pier Pro',
  },
  {
    id: 'seed-2',
    tag: 'GUL',
    score: 2680,
    distance: 420,
    fish: 24,
    flips: 4,
    bestCombo: 4,
    date: 'Local Gull',
  },
  {
    id: 'seed-3',
    tag: 'FIN',
    score: 1450,
    distance: 255,
    fish: 15,
    flips: 2,
    bestCombo: 3,
    date: 'Cruiser',
  },
];

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) {
      localStorage.setItem(SCORES_KEY, JSON.stringify(DEFAULT_SCORES));
      return [...DEFAULT_SCORES];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_SCORES];
    return parsed
      .filter((item) => item && typeof item.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch {
    return [...DEFAULT_SCORES];
  }
}

export function saveHighScore(entry: Omit<HighScoreEntry, 'id' | 'date'>): {
  scores: HighScoreEntry[];
  savedId: string;
  isNewBest: boolean;
  madeLeaderboard: boolean;
} {
  const existing = loadHighScores();
  const prevBest = existing.length > 0 ? existing[0].score : 0;
  const savedId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const fullEntry: HighScoreEntry = {
    ...entry,
    tag: (entry.tag || 'PEL').toUpperCase().slice(0, 3),
    id: savedId,
    date: dateLabel,
  };

  const merged = [...existing, fullEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }

  return {
    scores: merged,
    savedId,
    isNewBest: fullEntry.score > prevBest && fullEntry.score > 0,
    madeLeaderboard: merged.some((s) => s.id === savedId),
  };
}

export function updateScoreTag(id: string, newTag: string): HighScoreEntry[] {
  const cleanTag =
    newTag
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 3) || 'PEL';
  saveRiderTag(cleanTag);
  const scores = loadHighScores().map((entry) =>
    entry.id === id ? { ...entry, tag: cleanTag } : entry
  );
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch {
    // Ignore
  }
  return scores;
}

export function clearHighScores(): HighScoreEntry[] {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify([]));
  } catch {
    // Ignore
  }
  return [];
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore
  }
}

export function loadRiderTag(): string {
  try {
    return localStorage.getItem(TAG_KEY) || 'PEL';
  } catch {
    return 'PEL';
  }
}

export function saveRiderTag(tag: string): void {
  try {
    localStorage.setItem(TAG_KEY, tag.toUpperCase().slice(0, 3) || 'PEL');
  } catch {
    // Ignore
  }
}
