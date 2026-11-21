import { describe, it, expect } from 'vitest';
import { GameSession } from '../../src/core/GameSession';
import type { GameData } from '../../src/core/GameSession';
import type { PuzzleDef, RoomDef, StorageAdapter } from '../../src/core/types';

class MemoryStorage implements StorageAdapter {
  data: string | null = null;
  async load() {
    return this.data;
  }
  async save(data: string) {
    this.data = data;
  }
  async clear() {
    this.data = null;
  }
}

const palette = {
  bg: '#1a1026', bgFar: '#241636', wall: '#3a2a50', wallDark: '#2a1c3e',
  platform: '#6a5a8a', platformTop: '#8a7aaa', accent: '#ffcc66', glow: '#ffaa33',
};

function room(id: number, overrides: Partial<RoomDef> = {}): RoomDef {
  return {
    id,
    name: `Комната ${id}`,
    subtitle: '',
    width: 1600,
    height: 720,
    palette,
    spawn: { x: 100, y: 500 },
    checkpoints: [],
    entryPoints: { default: { x: 100, y: 500 } },
    platforms: [],
    traps: [],
    ropes: [],
    levers: [],
    chests: [],
    secretWalls: [],
    zones: [],
    notes: [],
    doors: [],
    secrets: [],
    ...overrides,
  };
}

const data: GameData = {
  rooms: [
    room(1, {
      entryPoints: { default: { x: 100, y: 500 }, '2': { x: 900, y: 500 } },
      zones: [{ id: 'z1', x: 400, y: 400, w: 100, h: 100 }],
      secrets: [
        {
          id: 's1', roomId: 1, tier: 1, kind: 'hidden-chest', title: 'Тайник', description: '',
          discover: { type: 'zone', zone: 'z1' }, complete: { type: 'zone', zone: 'z1' },
          rewardItems: ['bronze-key'], hints: ['h1', 'h2', 'h3'],
        },
      ],
    }),
    room(2, {
      doors: [{ id: 'd-2-3', roomId: 2, name: 'Дверь', requiresItem: 'bronze-key', leadsTo: 3 }],
      secrets: [
        {
          id: 's2', roomId: 2, tier: 2, kind: 'lever-sequence', title: 'Рычаги', description: '',
          discover: { type: 'always' }, complete: { type: 'puzzle', puzzle: 'p1' },
          rewardItems: ['golden-key'], hints: ['h1', 'h2', 'h3'],
        },
      ],
    }),
    room(3, {
      secrets: [
        {
          id: 's3', roomId: 3, tier: 1, kind: 'hidden-chest', title: 'Сундук', description: '',
          discover: { type: 'always' }, complete: { type: 'interact', object: 'chest3' },
          rewardItems: ['inscription-1'], opensDoor: 'd-2-3', hints: ['h1', 'h2', 'h3'],
        },
      ],
    }),
  ],
  puzzles: [
    { id: 'p1', roomId: 2, kind: 'lever-sequence', title: 'Рычаги', steps: ['a', 'b'], hints: ['h1', 'h2', 'h3'] },
  ] as PuzzleDef[],
  connections: [
    { from: 1, to: 2 },
    { from: 2, to: 3, doorId: 'd-2-3' },
    { from: 3, to: 1 },
  ],
};

describe('GameSession (интеграция)', () => {
  it('новая игра начинается в сердце пирамиды с кристаллом', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('seeker');
    expect(session.currentRoom).toBe(1);
    expect(session.inventory.hasItem('main-crystal')).toBe(true);
    expect(session.hints.remaining).toBe(3);
    expect(session.state.difficulty).toBe('seeker');
  });

  it('секрет выдаёт ключ, ключ открывает дверь, дверь пускает в новую комнату', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('explorer');
    expect(session.enterRoom(2)).toBe(true);
    expect(session.enterRoom(3)).toBe(false);

    session.enterRoom(1);
    session.reachZone('z1');
    expect(session.discoverSecret('s1')).toBe(true);
    expect(session.completeSecret('s1')).toBe(true);
    expect(session.inventory.hasItem('bronze-key')).toBe(true);

    session.enterRoom(2);
    expect(session.tryOpenDoor('d-2-3')).toBe(true);
    expect(session.enterRoom(3)).toBe(true);
  });

  it('игрок может вернуться в предыдущую комнату и позиция восстановится в точке входа', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('explorer');
    session.enterRoom(2);
    expect(session.enterRoom(1)).toBe(true);
    expect(session.position).toEqual({ x: 900, y: 500 });
  });

  it('головоломка решает секрет и выдаёт награду', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('seeker');
    session.enterRoom(2);
    expect(session.discoverSecret('s2')).toBe(true);
    expect(session.completeSecret('s2')).toBe(false);
    expect(session.attemptPuzzle('p1', 'a')).toBe('progress');
    expect(session.attemptPuzzle('p1', 'b')).toBe('solved');
    expect(session.completeSecret('s2')).toBe(true);
    expect(session.inventory.hasItem('golden-key')).toBe(true);
  });

  it('секрет может принудительно открыть дверь', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('explorer');
    session.enterRoom(2);
    session.enterRoom(3);
    session.discoverSecret('s3');
    session.interact('chest3');
    expect(session.completeSecret('s3')).toBe(true);
    expect(session.doors.isOpen('d-2-3')).toBe(true);
    expect(session.inventory.hasItem('inscription-1')).toBe(true);
  });

  it('подсказки ограничены тремя и не восстанавливаются при смене комнат', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('explorer');
    const texts: [string, string, string] = ['a', 'b', 'c'];
    expect(session.requestHint('p1', texts).ok).toBe(true);
    session.enterRoom(2);
    expect(session.requestHint('p1', texts).ok).toBe(true);
    expect(session.requestHint('p1', texts).ok).toBe(true);
    expect(session.requestHint('p1', texts).ok).toBe(false);
    expect(session.hints.remaining).toBe(0);
  });

  it('смерть возвращает к контрольной точке, но не отнимает предметы и секреты', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('explorer');
    session.reachZone('z1');
    session.discoverSecret('s1');
    session.completeSecret('s1');
    session.setCheckpoint({ x: 500, y: 400 });
    session.die();
    expect(session.state.deaths).toBe(1);
    expect(session.position).toEqual({ x: 500, y: 400 });
    expect(session.inventory.hasItem('bronze-key')).toBe(true);
    expect(session.secrets.isCompleted('s1')).toBe(true);
  });

  it('прогресс сохраняется и восстанавливается между сессиями', async () => {
    const storage = new MemoryStorage();
    const session = new GameSession(data, storage);
    session.newGame('seeker');
    session.enterRoom(2);
    session.reachZone('z1');
    session.discoverSecret('s1');
    session.completeSecret('s1');
    session.requestHint('ctx', ['a', 'b', 'c']);
    session.tick(60_000);
    await session.flush();

    const restored = new GameSession(data, storage);
    expect(await restored.load()).toBe(true);
    expect(restored.currentRoom).toBe(2);
    expect(restored.inventory.hasItem('bronze-key')).toBe(true);
    expect(restored.secrets.isCompleted('s1')).toBe(true);
    expect(restored.hints.remaining).toBe(2);
    expect(restored.state.elapsedMs).toBe(60_000);
    expect(restored.state.difficulty).toBe('seeker');
  });

  it('автосохранение срабатывает после важных событий', async () => {
    const storage = new MemoryStorage();
    const session = new GameSession(data, storage);
    session.newGame('explorer');
    session.reachZone('z1');
    session.discoverSecret('s1');
    session.completeSecret('s1');
    await session.flush();
    expect(storage.data).toBeTruthy();
    expect(JSON.parse(storage.data!).completedSecrets).toContain('s1');
  });

  it('игра завершается после всех комнат и обязательных секретов', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.newGame('explorer');
    expect(session.isCompleted()).toBe(false);

    session.reachZone('z1');
    session.discoverSecret('s1');
    session.completeSecret('s1');
    session.enterRoom(2);
    session.tryOpenDoor('d-2-3');
    session.enterRoom(3);
    session.discoverSecret('s3');
    session.interact('chest3');
    session.completeSecret('s3');

    session.completeRoom(1);
    session.completeRoom(2);
    expect(session.isCompleted()).toBe(false);
    session.completeRoom(3);
    expect(session.isCompleted()).toBe(true);

    session.finish();
    expect(session.state.finished).toBe(true);
    expect(session.endingType()).toBe('normal');
  });

  it('load без сохранения должен возвращать false', async () => {
    const session = new GameSession(data, new MemoryStorage());
    expect(await session.load()).toBe(false);
  });

  it('время идёт только после старта игры', () => {
    const session = new GameSession(data, new MemoryStorage());
    session.tick(1000);
    expect(session.state.elapsedMs).toBe(0);
    session.newGame('explorer');
    session.tick(1000);
    expect(session.state.elapsedMs).toBe(1000);
  });
});