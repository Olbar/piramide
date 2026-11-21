import { describe, it, expect } from 'vitest';
import { DoorManager } from '../../../src/doors/DoorManager';
import type { DoorDef } from '../../../src/core/types';

const doors: DoorDef[] = [
  { id: 'd-item', roomId: 5, name: 'Дверь с замком', requiresItem: 'golden-key', leadsTo: 6 },
  { id: 'd-puzzle', roomId: 8, name: 'Дверь механизма', requiresPuzzle: 'p-mirrors', leadsTo: 9 },
  { id: 'd-secret', roomId: 13, name: 'Тайная дверь', requiresSecret: 's-13-1', leadsTo: 14 },
  { id: 'd-free', roomId: 1, name: 'Открытый проход', leadsTo: 2 },
];

const emptyCtx = { items: [], solvedPuzzles: [], completedSecrets: [] };

describe('DoorManager', () => {
  it('должен открывать дверь при наличии ключа', () => {
    const mgr = new DoorManager(doors);
    expect(mgr.tryOpen('d-item', emptyCtx)).toBe(false);
    expect(mgr.tryOpen('d-item', { ...emptyCtx, items: ['golden-key'] })).toBe(true);
    expect(mgr.isOpen('d-item')).toBe(true);
  });

  it('открытая дверь должна оставаться открытой', () => {
    const mgr = new DoorManager(doors);
    mgr.tryOpen('d-item', { ...emptyCtx, items: ['golden-key'] });
    expect(mgr.tryOpen('d-item', emptyCtx)).toBe(true);
    expect(mgr.isOpen('d-item')).toBe(true);
  });

  it('должен открывать дверь после решения головоломки', () => {
    const mgr = new DoorManager(doors);
    expect(mgr.tryOpen('d-puzzle', emptyCtx)).toBe(false);
    expect(mgr.tryOpen('d-puzzle', { ...emptyCtx, solvedPuzzles: ['p-mirrors'] })).toBe(true);
  });

  it('должен открывать дверь после выполнения секрета', () => {
    const mgr = new DoorManager(doors);
    expect(mgr.tryOpen('d-secret', emptyCtx)).toBe(false);
    expect(mgr.tryOpen('d-secret', { ...emptyCtx, completedSecrets: ['s-13-1'] })).toBe(true);
  });

  it('дверь без требований должна открываться сразу', () => {
    const mgr = new DoorManager(doors);
    expect(mgr.tryOpen('d-free', emptyCtx)).toBe(true);
  });

  it('неизвестная дверь не должна открываться', () => {
    const mgr = new DoorManager(doors);
    expect(mgr.tryOpen('missing', emptyCtx)).toBe(false);
    expect(mgr.canOpen('missing', emptyCtx)).toBe(false);
  });

  it('должен принудительно открывать дверь (награда за секрет)', () => {
    const mgr = new DoorManager(doors);
    mgr.openDoor('d-item');
    expect(mgr.isOpen('d-item')).toBe(true);
  });

  it('должен сохранять и восстанавливать состояние дверей', () => {
    const mgr = new DoorManager(doors);
    mgr.openDoor('d-item');
    mgr.openDoor('d-free');
    const restored = new DoorManager(doors);
    restored.restore(mgr.serialize());
    expect(restored.isOpen('d-item')).toBe(true);
    expect(restored.isOpen('d-free')).toBe(true);
    expect(restored.isOpen('d-puzzle')).toBe(false);
  });
});