import { describe, it, expect } from 'vitest';
import { AchievementsManager, ACHIEVEMENTS } from '../../../src/achievements/AchievementsManager';
import { computeRating } from '../../../src/achievements/Rating';
import { selectEnding } from '../../../src/achievements/EndingSelector';

const base = {
  completedSecrets: 0,
  totalSecrets: 120,
  hintsUsed: 0,
  deaths: 0,
  elapsedMs: 3600_000,
  visitedRooms: 1,
  inscriptions: 0,
  finished: false,
};

describe('AchievementsManager', () => {
  it('должен выдавать достижение за первый секрет', () => {
    const mgr = new AchievementsManager();
    const unlocked = mgr.evaluate({ ...base, completedSecrets: 1 });
    expect(unlocked).toContain('first-secret');
  });

  it('должен выдавать достижение за 10 секретов', () => {
    const mgr = new AchievementsManager();
    expect(mgr.evaluate({ ...base, completedSecrets: 10 })).toContain('secrets-10');
  });

  it('должен выдавать достижение за все 120 секретов', () => {
    const mgr = new AchievementsManager();
    expect(mgr.evaluate({ ...base, completedSecrets: 120 })).toContain('all-secrets');
  });

  it('достижения за прохождение должны требовать финиша', () => {
    const mgr = new AchievementsManager();
    expect(mgr.evaluate({ ...base, finished: false })).not.toContain('no-hints');
    const unlocked = mgr.evaluate({ ...base, finished: true, visitedRooms: 20 });
    expect(unlocked).toContain('no-hints');
    expect(unlocked).toContain('no-deaths');
  });

  it('не должен выдавать no-deaths при смертях', () => {
    const mgr = new AchievementsManager();
    expect(mgr.evaluate({ ...base, finished: true, deaths: 3 })).not.toContain('no-deaths');
  });

  it('не должен выдавать достижение повторно', () => {
    const mgr = new AchievementsManager();
    mgr.evaluate({ ...base, completedSecrets: 1 });
    expect(mgr.evaluate({ ...base, completedSecrets: 2 })).not.toContain('first-secret');
  });

  it('должен выдавать достижение за полное исследование', () => {
    const mgr = new AchievementsManager();
    const unlocked = mgr.evaluate({ ...base, finished: true, visitedRooms: 20, completedSecrets: 120, inscriptions: 12 });
    expect(unlocked).toContain('full-exploration');
  });

  it('должен сериализоваться и восстанавливаться', () => {
    const mgr = new AchievementsManager();
    mgr.evaluate({ ...base, completedSecrets: 1 });
    const restored = new AchievementsManager();
    restored.restore(mgr.serialize());
    expect(restored.unlocked).toContain('first-secret');
  });

  it('все достижения должны иметь русские названия', () => {
    for (const a of Object.values(ACHIEVEMENTS)) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
    }
  });
});

describe('Rating', () => {
  it('идеальное прохождение должно давать высший ранг', () => {
    const rating = computeRating({ elapsedMs: 1800_000, secretsFound: 120, totalSecrets: 120, hintsUsed: 0, deaths: 0 });
    expect(rating.rank).toBe('S');
    expect(rating.score).toBeGreaterThanOrEqual(90);
  });

  it('подсказки и смерти должны снижать рейтинг', () => {
    const clean = computeRating({ elapsedMs: 3600_000, secretsFound: 60, totalSecrets: 120, hintsUsed: 0, deaths: 0 });
    const messy = computeRating({ elapsedMs: 3600_000, secretsFound: 60, totalSecrets: 120, hintsUsed: 3, deaths: 20 });
    expect(messy.score).toBeLessThan(clean.score);
  });

  it('долгое прохождение должно снижать рейтинг', () => {
    const fast = computeRating({ elapsedMs: 1800_000, secretsFound: 60, totalSecrets: 120, hintsUsed: 0, deaths: 0 });
    const slow = computeRating({ elapsedMs: 14400_000, secretsFound: 60, totalSecrets: 120, hintsUsed: 0, deaths: 0 });
    expect(slow.score).toBeLessThan(fast.score);
  });

  it('рейтинг должен быть в диапазоне 0..100', () => {
    const worst = computeRating({ elapsedMs: 999999999, secretsFound: 0, totalSecrets: 120, hintsUsed: 3, deaths: 999 });
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(worst.rank);
    expect(worst.title.length).toBeGreaterThan(0);
  });
});

describe('EndingSelector', () => {
  it('обычная концовка по умолчанию', () => {
    expect(selectEnding({ completedSecrets: 30, totalSecrets: 120, inscriptions: 2, totalInscriptions: 12 })).toBe('normal');
  });

  it('хорошая концовка при раскрытой тайне кристалла', () => {
    expect(selectEnding({ completedSecrets: 60, totalSecrets: 120, inscriptions: 12, totalInscriptions: 12 })).toBe('good');
  });

  it('истинная концовка при всех секретах и надписях', () => {
    expect(selectEnding({ completedSecrets: 120, totalSecrets: 120, inscriptions: 12, totalInscriptions: 12 })).toBe('true');
  });

  it('все секреты без надписей не дают истинную концовку', () => {
    expect(selectEnding({ completedSecrets: 120, totalSecrets: 120, inscriptions: 5, totalInscriptions: 12 })).toBe('normal');
  });
});