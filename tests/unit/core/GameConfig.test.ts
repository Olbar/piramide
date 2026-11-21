import { describe, it, expect } from 'vitest';
import { DIFFICULTIES, getDifficulty, difficultyTier } from '../../../src/core/GameConfig';
import type { DifficultyId } from '../../../src/core/types';

describe('Difficulty', () => {
  it('должен определять 4 уровня сложности с 30/60/90/120 секретами', () => {
    expect(Object.keys(DIFFICULTIES)).toHaveLength(4);
    expect(getDifficulty('explorer').requiredSecrets).toBe(30);
    expect(getDifficulty('seeker').requiredSecrets).toBe(60);
    expect(getDifficulty('archaeologist').requiredSecrets).toBe(90);
    expect(getDifficulty('pharaoh').requiredSecrets).toBe(120);
  });

  it('должен иметь русские названия', () => {
    expect(getDifficulty('explorer').label).toBe('Исследователь');
    expect(getDifficulty('seeker').label).toBe('Искатель');
    expect(getDifficulty('archaeologist').label).toBe('Археолог');
    expect(getDifficulty('pharaoh').label).toBe('Проклятие фараона');
  });

  it('сложность должна влиять на скорость ловушек и размер платформ', () => {
    const easy = getDifficulty('explorer');
    const hard = getDifficulty('pharaoh');
    expect(hard.trapSpeed).toBeGreaterThan(easy.trapSpeed);
    expect(hard.platformScale).toBeLessThan(easy.platformScale);
    expect(hard.trapInterval).toBeLessThan(easy.trapInterval);
  });

  it('все 20 комнат должны присутствовать на любой сложности', () => {
    for (const id of Object.keys(DIFFICULTIES) as DifficultyId[]) {
      expect(getDifficulty(id).roomCount).toBe(20);
    }
  });

  it('должен сопоставлять сложность и ярус секретов', () => {
    expect(difficultyTier('explorer')).toBe(1);
    expect(difficultyTier('seeker')).toBe(2);
    expect(difficultyTier('archaeologist')).toBe(3);
    expect(difficultyTier('pharaoh')).toBe(4);
  });

  it('должен отклонять неизвестную сложность', () => {
    expect(() => getDifficulty('nightmare' as DifficultyId)).toThrow();
  });
});