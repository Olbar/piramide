import { describe, it, expect } from 'vitest';
import { GameProgress } from '../../../src/core/GameProgress';

describe('GameCompletion', () => {
  it('должен завершать игру после выполнения условий', () => {
    const game = new GameProgress();

    game.completeAllRooms();
    game.completeRequiredSecrets();

    expect(game.isCompleted()).toBe(true);
  });

  it('не должен завершаться без всех комнат', () => {
    const game = new GameProgress(20, 30);
    game.completeRequiredSecrets();
    expect(game.isCompleted()).toBe(false);
    for (let i = 1; i <= 19; i++) game.completeRoom(i);
    expect(game.isCompleted()).toBe(false);
    game.completeRoom(20);
    expect(game.isCompleted()).toBe(true);
  });

  it('не должен завершаться без обязательных секретов', () => {
    const game = new GameProgress(20, 30);
    game.completeAllRooms();
    expect(game.isCompleted()).toBe(false);
    for (let i = 0; i < 29; i++) game.completeSecret(`s${i}`);
    expect(game.isCompleted()).toBe(false);
    game.completeSecret('s29');
    expect(game.isCompleted()).toBe(true);
  });

  it('должен считать уникальные секреты', () => {
    const game = new GameProgress(20, 2);
    game.completeSecret('a');
    game.completeSecret('a');
    expect(game.completedSecretsCount).toBe(1);
  });

  it('должен учитывать сложность через число обязательных секретов', () => {
    expect(new GameProgress(20, 30).requiredSecrets).toBe(30);
    expect(new GameProgress(20, 120).requiredSecrets).toBe(120);
  });

  it('должен отдавать долю прогресса', () => {
    const game = new GameProgress(20, 30);
    expect(game.ratio).toBe(0);
    game.completeAllRooms();
    expect(game.ratio).toBeCloseTo(0.5);
    game.completeRequiredSecrets();
    expect(game.ratio).toBe(1);
  });
});