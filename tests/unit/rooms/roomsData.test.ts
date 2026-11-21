import { describe, it, expect } from 'vitest';
import { GAME_DATA, ROOMS, CONNECTIONS, ALL_SECRETS, ALL_DOORS } from '../../../src/rooms/rooms-data';
import { ITEMS } from '../../../src/inventory/items';
import { RoomGraph } from '../../../src/rooms/RoomGraph';

describe('Данные пирамиды', () => {
  it('должны содержать 20 уникальных комнат', () => {
    expect(ROOMS).toHaveLength(20);
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(20);
    expect(new Set(ROOMS.map((r) => r.name)).size).toBe(20);
    for (let i = 1; i <= 20; i++) expect(ROOMS.some((r) => r.id === i)).toBe(true);
  });

  it('должны содержать 120 уникальных секретов, по 6 на комнату', () => {
    expect(ALL_SECRETS).toHaveLength(120);
    expect(new Set(ALL_SECRETS.map((s) => s.id)).size).toBe(120);
    for (const room of ROOMS) {
      expect(room.secrets).toHaveLength(6);
    }
  });

  it('должны содержать ровно 30 секретов каждого яруса', () => {
    for (const tier of [1, 2, 3, 4]) {
      expect(ALL_SECRETS.filter((s) => s.tier === tier)).toHaveLength(30);
    }
  });

  it('каждый секрет должен иметь 3 подсказки и описание', () => {
    for (const s of ALL_SECRETS) {
      expect(s.hints).toHaveLength(3);
      for (const h of s.hints) expect(h.length).toBeGreaterThan(5);
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.description.length).toBeGreaterThan(5);
    }
  });

  it('все награды должны существовать в реестре предметов', () => {
    for (const s of ALL_SECRETS) {
      for (const item of s.rewardItems ?? []) {
        expect(ITEMS[item], `предмет ${item} секрета ${s.id}`).toBeDefined();
      }
    }
  });

  it('все требования дверей должны быть достижимы', () => {
    const rewardedItems = new Set(ALL_SECRETS.flatMap((s) => s.rewardItems ?? []));
    rewardedItems.add('main-crystal');
    const puzzleIds = new Set(GAME_DATA.puzzles.map((p) => p.id));
    const secretIds = new Set(ALL_SECRETS.map((s) => s.id));
    for (const door of ALL_DOORS) {
      if (door.requiresItem) {
        expect(rewardedItems.has(door.requiresItem), `ключ ${door.requiresItem} двери ${door.id}`).toBe(true);
      }
      if (door.requiresPuzzle) expect(puzzleIds.has(door.requiresPuzzle)).toBe(true);
      if (door.requiresSecret) expect(secretIds.has(door.requiresSecret)).toBe(true);
    }
  });

  it('все связи должны ссылаться на существующие комнаты и двери', () => {
    const doorIds = new Set(ALL_DOORS.map((d) => d.id));
    for (const c of CONNECTIONS) {
      expect(c.from).toBeGreaterThanOrEqual(1);
      expect(c.to).toBeLessThanOrEqual(20);
      if (c.doorId) expect(doorIds.has(c.doorId), `дверь ${c.doorId}`).toBe(true);
    }
  });

  it('все 20 комнат должны быть достижимы из сердца пирамиды', () => {
    const graph = new RoomGraph(CONNECTIONS);
    const seen = new Set<number>([1]);
    const queue = [1];
    while (queue.length) {
      const current = queue.shift()!;
      for (const n of graph.neighbors(current)) {
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    expect(seen.size).toBe(20);
  });

  it('граф должен быть не линейной цепочкой (есть дополнительные связи)', () => {
    expect(CONNECTIONS.length).toBeGreaterThan(19);
    const graph = new RoomGraph(CONNECTIONS);
    const branching = ROOMS.filter((r) => graph.neighbors(r.id).length >= 3);
    expect(branching.length).toBeGreaterThanOrEqual(5);
  });

  it('каждая комната (кроме финальной) должна иметь выход', () => {
    for (const room of ROOMS) {
      if (room.id < 20) expect(room.exitZone, `комната ${room.id}`).toBeDefined();
    }
  });

  it('точки входа должны быть заданы для всех соседей', () => {
    const graph = new RoomGraph(CONNECTIONS);
    for (const room of ROOMS) {
      for (const n of graph.neighbors(room.id)) {
        expect(room.entryPoints[String(n)], `комната ${room.id} ← ${n}`).toBeDefined();
      }
    }
  });

  it('объекты секретов должны присутствовать в комнатах', () => {
    for (const room of ROOMS) {
      const chestIds = new Set(room.chests.map((c) => c.id));
      const wallIds = new Set(room.secretWalls.map((w) => w.id));
      const zoneIds = new Set(room.zones.map((z) => z.id));
      const leverPuzzles = new Set(room.levers.map((l) => l.puzzleId));
      for (const s of room.secrets) {
        const n = s.id.split('-')[2];
        if (s.kind === 'hidden-chest' || s.kind === 'artifact-hunt') {
          expect(chestIds.has(`chest-${room.id}-${n}`), s.id).toBe(true);
        } else if (s.kind === 'secret-wall') {
          expect(wallIds.has(`wall-${room.id}-${n}`), s.id).toBe(true);
        } else if (s.kind === 'lever-sequence' || s.kind === 'symbol-decode' || s.kind === 'light-mirror') {
          expect(leverPuzzles.size).toBeGreaterThan(0);
        } else {
          expect(zoneIds.has(`zone-${room.id}-${n}`), s.id).toBe(true);
        }
      }
    }
  });

  it('все комнаты должны иметь ловушки и контрольные точки', () => {
    for (const room of ROOMS) {
      expect(room.traps.length, `ловушки комнаты ${room.id}`).toBeGreaterThan(0);
      expect(room.checkpoints.length, `контрольные точки комнаты ${room.id}`).toBeGreaterThan(0);
    }
  });

  it('все 12 фрагментов надписи должны быть наградами секретов', () => {
    const rewarded = new Set(ALL_SECRETS.flatMap((s) => s.rewardItems ?? []));
    for (let i = 1; i <= 12; i++) {
      expect(rewarded.has(`inscription-${i}`), `inscription-${i}`).toBe(true);
    }
  });
});