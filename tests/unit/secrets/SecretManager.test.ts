import { describe, it, expect } from 'vitest';
import { SecretManager } from '../../../src/secrets/SecretManager';
import { evaluateCondition } from '../../../src/secrets/SecretConditions';
import type { SecretDef, SecretContext } from '../../../src/core/types';

function secret(id: string, tier: 1 | 2 | 3 | 4, overrides: Partial<SecretDef> = {}): SecretDef {
  return {
    id,
    roomId: 1,
    tier,
    kind: 'hidden-chest',
    title: `Секрет ${id}`,
    description: 'Тестовый секрет',
    discover: { type: 'always' },
    complete: { type: 'always' },
    hints: ['h1', 'h2', 'h3'],
    ...overrides,
  };
}

const emptyCtx: SecretContext = {
  items: [],
  solvedPuzzles: [],
  reachedZones: [],
  interacted: [],
  completedSecrets: [],
};

describe('SecretConditions', () => {
  it('always выполняется всегда', () => {
    expect(evaluateCondition({ type: 'always' }, emptyCtx)).toBe(true);
  });

  it('item требует предмет', () => {
    expect(evaluateCondition({ type: 'item', item: 'k' }, emptyCtx)).toBe(false);
    expect(evaluateCondition({ type: 'item', item: 'k' }, { ...emptyCtx, items: ['k'] })).toBe(true);
  });

  it('zone требует достижения зоны', () => {
    expect(evaluateCondition({ type: 'zone', zone: 'z' }, { ...emptyCtx, reachedZones: ['z'] })).toBe(true);
  });

  it('puzzle требует решённой головоломки', () => {
    expect(evaluateCondition({ type: 'puzzle', puzzle: 'p' }, { ...emptyCtx, solvedPuzzles: ['p'] })).toBe(true);
  });

  it('secret требует другого секрета', () => {
    expect(evaluateCondition({ type: 'secret', secret: 's' }, { ...emptyCtx, completedSecrets: ['s'] })).toBe(true);
  });

  it('all и any комбинируют условия', () => {
    const all = { type: 'all' as const, conditions: [{ type: 'item' as const, item: 'k' }, { type: 'zone' as const, zone: 'z' }] };
    expect(evaluateCondition(all, { ...emptyCtx, items: ['k'] })).toBe(false);
    expect(evaluateCondition(all, { ...emptyCtx, items: ['k'], reachedZones: ['z'] })).toBe(true);
    const any = { type: 'any' as const, conditions: [{ type: 'item' as const, item: 'k' }, { type: 'zone' as const, zone: 'z' }] };
    expect(evaluateCondition(any, { ...emptyCtx, reachedZones: ['z'] })).toBe(true);
    expect(evaluateCondition(any, emptyCtx)).toBe(false);
  });
});

describe('SecretManager', () => {
  const defs = [
    secret('s1', 1),
    secret('s2', 2, { discover: { type: 'item', item: 'magic-amulet' }, complete: { type: 'zone', zone: 'alcove' } }),
    secret('s3', 3, { complete: { type: 'puzzle', puzzle: 'p1' } }),
    secret('s4', 4, { complete: { type: 'secret', secret: 's1' } }),
  ];

  it('должен обнаруживать секреты по условию обнаружения', () => {
    const mgr = new SecretManager(defs);
    expect(mgr.discover('s2', emptyCtx)).toBe(false);
    expect(mgr.discover('s2', { ...emptyCtx, items: ['magic-amulet'] })).toBe(true);
    expect(mgr.isDiscovered('s2')).toBe(true);
    expect(mgr.discover('s2', { ...emptyCtx, items: ['magic-amulet'] })).toBe(false);
  });

  it('должен выполнять секрет только после обнаружения и по условию', () => {
    const mgr = new SecretManager(defs);
    expect(mgr.complete('s2', { ...emptyCtx, reachedZones: ['alcove'] })).toBe(false);
    mgr.discover('s2', { ...emptyCtx, items: ['magic-amulet'] });
    expect(mgr.complete('s2', emptyCtx)).toBe(false);
    expect(mgr.complete('s2', { ...emptyCtx, reachedZones: ['alcove'] })).toBe(true);
    expect(mgr.isCompleted('s2')).toBe(true);
  });

  it('повторное выполнение уже завершённого секрета не требуется', () => {
    const mgr = new SecretManager(defs);
    mgr.discover('s1', emptyCtx);
    expect(mgr.complete('s1', emptyCtx)).toBe(true);
    expect(mgr.complete('s1', emptyCtx)).toBe(false);
    expect(mgr.completedCount).toBe(1);
  });

  it('неизвестный секрет не должен обнаруживаться или выполняться', () => {
    const mgr = new SecretManager(defs);
    expect(mgr.discover('nope', emptyCtx)).toBe(false);
    expect(mgr.complete('nope', emptyCtx)).toBe(false);
  });

  it('должен считать секреты по ярусам сложности', () => {
    const mgr = new SecretManager(defs);
    for (const s of defs) {
      mgr.discover(s.id, { ...emptyCtx, items: ['magic-amulet'] });
    }
    mgr.complete('s1', emptyCtx);
    expect(mgr.requiredCompletedCount('explorer')).toBe(1);
    expect(mgr.requiredCompletedCount('seeker')).toBe(1);
    mgr.complete('s2', { ...emptyCtx, reachedZones: ['alcove'] });
    expect(mgr.requiredCompletedCount('seeker')).toBe(2);
    expect(mgr.requiredCompletedCount('explorer')).toBe(1);
  });

  it('должен проверять выполнение всех обязательных секретов сложности', () => {
    const mgr = new SecretManager([secret('a1', 1), secret('a2', 1), secret('b1', 2)]);
    expect(mgr.allRequiredCompleted('explorer')).toBe(false);
    mgr.discover('a1', emptyCtx);
    mgr.complete('a1', emptyCtx);
    mgr.discover('a2', emptyCtx);
    mgr.complete('a2', emptyCtx);
    expect(mgr.allRequiredCompleted('explorer')).toBe(true);
    expect(mgr.allRequiredCompleted('seeker')).toBe(false);
  });

  it('должен фильтровать секреты по комнате', () => {
    const mgr = new SecretManager([secret('x', 1, { roomId: 7 }), secret('y', 1, { roomId: 8 })]);
    expect(mgr.secretsForRoom(7).map((s) => s.id)).toEqual(['x']);
  });

  it('должен сериализоваться и восстанавливаться', () => {
    const mgr = new SecretManager(defs);
    mgr.discover('s1', emptyCtx);
    mgr.complete('s1', emptyCtx);
    mgr.discover('s3', emptyCtx);
    const restored = new SecretManager(defs);
    restored.restore(mgr.serialize());
    expect(restored.isCompleted('s1')).toBe(true);
    expect(restored.isDiscovered('s3')).toBe(true);
    expect(restored.isCompleted('s3')).toBe(false);
  });

  it('должен учитывать зависимость секрета от другого секрета', () => {
    const mgr = new SecretManager(defs);
    mgr.discover('s4', emptyCtx);
    expect(mgr.complete('s4', emptyCtx)).toBe(false);
    mgr.discover('s1', emptyCtx);
    mgr.complete('s1', emptyCtx);
    expect(mgr.complete('s4', { ...emptyCtx, completedSecrets: ['s1'] })).toBe(true);
  });
});