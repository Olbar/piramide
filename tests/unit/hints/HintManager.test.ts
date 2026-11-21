import { describe, it, expect } from 'vitest';
import { HintManager } from '../../../src/hints/HintManager';

describe('HintManager', () => {
  it('должен разрешать только 3 подсказки', () => {
    const hints = new HintManager(3);

    expect(hints.useHint()).toBe(true);
    expect(hints.useHint()).toBe(true);
    expect(hints.useHint()).toBe(true);
    expect(hints.useHint()).toBe(false);

    expect(hints.remaining).toBe(0);
  });

  it('не должен восстанавливать подсказки при смене комнаты', () => {
    const hints = new HintManager(3);
    hints.useHint();
    hints.onRoomChange();
    expect(hints.remaining).toBe(2);
  });

  it('должен выдавать ступенчатые подсказки для контекста', () => {
    const hints = new HintManager(3);
    const texts: [string, string, string] = ['Направление', 'Конкретика', 'Прямое указание'];

    const first = hints.requestHint('lava-key', texts);
    expect(first).toEqual({ ok: true, text: 'Направление', stage: 1 });

    const second = hints.requestHint('lava-key', texts);
    expect(second).toEqual({ ok: true, text: 'Конкретика', stage: 2 });

    const third = hints.requestHint('lava-key', texts);
    expect(third).toEqual({ ok: true, text: 'Прямое указание', stage: 3 });

    const fourth = hints.requestHint('lava-key', texts);
    expect(fourth.ok).toBe(false);
    expect(hints.remaining).toBe(0);
  });

  it('должен вести отдельную ступень для каждого контекста, но общий лимит 3', () => {
    const hints = new HintManager(3);
    const a: [string, string, string] = ['A1', 'A2', 'A3'];
    const b: [string, string, string] = ['B1', 'B2', 'B3'];

    expect(hints.requestHint('a', a).text).toBe('A1');
    expect(hints.requestHint('b', b).text).toBe('B1');
    expect(hints.requestHint('a', a).text).toBe('A2');
    expect(hints.requestHint('b', b).ok).toBe(false);
  });

  it('должен вести журнал использованных подсказок', () => {
    const hints = new HintManager(3);
    hints.requestHint('p1', ['x1', 'x2', 'x3']);
    hints.requestHint('p1', ['x1', 'x2', 'x3']);
    expect(hints.journal).toHaveLength(2);
    expect(hints.journal[1]).toEqual({ contextId: 'p1', stage: 2, text: 'x2' });
  });

  it('должен восстанавливаться из состояния', () => {
    const hints = new HintManager(3);
    hints.requestHint('p1', ['x1', 'x2', 'x3']);
    const restored = new HintManager(3);
    restored.restore(1, hints.journal);
    expect(restored.remaining).toBe(2);
    expect(restored.requestHint('p1', ['x1', 'x2', 'x3']).text).toBe('x2');
  });

  it('должен отклонять некорректный лимит', () => {
    expect(() => new HintManager(0)).toThrow();
    expect(() => new HintManager(-1)).toThrow();
  });
});