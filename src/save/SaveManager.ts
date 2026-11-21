import type { GameState, StorageAdapter } from '../core/types';
import { DIFFICULTIES, SAVE_VERSION } from '../core/GameConfig';

export function createDefaultState(difficulty: GameState['difficulty']): GameState {
  return {
    version: SAVE_VERSION,
    difficulty,
    currentRoom: 1,
    checkpoint: { x: 100, y: 500 },
    visitedRooms: [1],
    completedRooms: [],
    discoveredSecrets: [],
    completedSecrets: [],
    items: ['main-crystal'],
    openedDoors: [],
    solvedPuzzles: [],
    hintsUsed: 0,
    hintJournal: [],
    notesFound: [],
    elapsedMs: 0,
    deaths: 0,
    achievements: [],
    settings: { musicVolume: 0.6, sfxVolume: 0.8 },
    finished: false,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function validate(state: unknown): state is GameState {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Record<string, unknown>;
  if (s.version !== SAVE_VERSION) return false;
  if (typeof s.difficulty !== 'string' || !(s.difficulty in DIFFICULTIES)) return false;
  if (typeof s.currentRoom !== 'number') return false;
  if (typeof s.hintsUsed !== 'number' || typeof s.elapsedMs !== 'number' || typeof s.deaths !== 'number') return false;
  if (typeof s.finished !== 'boolean') return false;
  const checkpoint = s.checkpoint as Record<string, unknown> | undefined;
  if (!checkpoint || typeof checkpoint.x !== 'number' || typeof checkpoint.y !== 'number') return false;
  const settings = s.settings as Record<string, unknown> | undefined;
  if (!settings || typeof settings.musicVolume !== 'number' || typeof settings.sfxVolume !== 'number') return false;
  const arrays = [
    'visitedRooms', 'completedRooms', 'discoveredSecrets', 'completedSecrets',
    'items', 'openedDoors', 'solvedPuzzles', 'notesFound', 'achievements',
  ];
  for (const key of arrays) {
    if (!isStringArray(s[key]) && !Array.isArray(s[key])) return false;
  }
  if (!Array.isArray(s.visitedRooms) || !s.visitedRooms.every((v) => typeof v === 'number')) return false;
  if (!Array.isArray(s.completedRooms) || !s.completedRooms.every((v) => typeof v === 'number')) return false;
  if (!Array.isArray(s.hintJournal)) return false;
  return true;
}

export class SaveManager {
  lastError: string | null = null;

  constructor(private readonly storage: StorageAdapter) {}

  async save(state: GameState): Promise<boolean> {
    try {
      await this.storage.save(JSON.stringify(state));
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  async load(): Promise<GameState | null> {
    try {
      const raw = await this.storage.load();
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!validate(parsed)) {
        this.lastError = 'Повреждённое сохранение';
        return null;
      }
      return parsed;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return null;
    }
  }

  async hasSave(): Promise<boolean> {
    return (await this.load()) !== null;
  }

  async clear(): Promise<boolean> {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }
}