import { describe, it, expect } from 'vitest';
import { PuzzleManager } from '../../../src/puzzles/PuzzleManager';
import type { PuzzleDef } from '../../../src/core/types';

const puzzles: PuzzleDef[] = [
  {
    id: 'p-levers',
    roomId: 2,
    kind: 'lever-sequence',
    title: 'Рычаги песочных часов',
    steps: ['l3', 'l1', 'l2'],
    hints: ['h1', 'h2', 'h3'],
  },
  {
    id: 'p-symbols',
    roomId: 10,
    kind: 'symbol-decode',
    title: 'Древние символы',
    steps: ['sun', 'eye', 'ankh'],
    hints: ['h1', 'h2', 'h3'],
  },
];

describe('PuzzleManager', () => {
  it('должен решать головоломку при правильной последовательности', () => {
    const mgr = new PuzzleManager(puzzles);
    expect(mgr.attempt('p-levers', 'l3')).toBe('progress');
    expect(mgr.attempt('p-levers', 'l1')).toBe('progress');
    expect(mgr.attempt('p-levers', 'l2')).toBe('solved');
    expect(mgr.isSolved('p-levers')).toBe(true);
  });

  it('должен сбрасывать прогресс при неправильном шаге', () => {
    const mgr = new PuzzleManager(puzzles);
    mgr.attempt('p-levers', 'l3');
    expect(mgr.attempt('p-levers', 'l2')).toBe('wrong');
    expect(mgr.progress('p-levers')).toBe(0);
    expect(mgr.isSolved('p-levers')).toBe(false);
    expect(mgr.attempt('p-levers', 'l3')).toBe('progress');
  });

  it('решённая головоломка не должна сбрасываться', () => {
    const mgr = new PuzzleManager(puzzles);
    mgr.attempt('p-levers', 'l3');
    mgr.attempt('p-levers', 'l1');
    mgr.attempt('p-levers', 'l2');
    expect(mgr.attempt('p-levers', 'l1')).toBe('solved');
    expect(mgr.isSolved('p-levers')).toBe(true);
  });

  it('неизвестная головоломка должна возвращать unknown', () => {
    const mgr = new PuzzleManager(puzzles);
    expect(mgr.attempt('missing', 'x')).toBe('unknown');
    expect(mgr.isSolved('missing')).toBe(false);
  });

  it('должен поддерживать разные типы головоломок', () => {
    const mgr = new PuzzleManager(puzzles);
    expect(mgr.attempt('p-symbols', 'sun')).toBe('progress');
    expect(mgr.attempt('p-symbols', 'eye')).toBe('progress');
    expect(mgr.attempt('p-symbols', 'ankh')).toBe('solved');
  });

  it('должен сохранять и восстанавливать решённые головоломки', () => {
    const mgr = new PuzzleManager(puzzles);
    mgr.attempt('p-symbols', 'sun');
    mgr.attempt('p-symbols', 'eye');
    mgr.attempt('p-symbols', 'ankh');
    const restored = new PuzzleManager(puzzles);
    restored.restore(mgr.serialize());
    expect(restored.isSolved('p-symbols')).toBe(true);
    expect(restored.isSolved('p-levers')).toBe(false);
  });

  it('должен возвращать определение головоломки', () => {
    const mgr = new PuzzleManager(puzzles);
    expect(mgr.get('p-levers')?.steps).toEqual(['l3', 'l1', 'l2']);
    expect(mgr.get('missing')).toBeUndefined();
  });
});